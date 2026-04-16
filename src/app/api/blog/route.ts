/**
 * @fileoverview Blog API Route
 * @description Blog yazıları CRUD API endpoint'i.
 * GET (public), POST/PUT/DELETE (admin only) operasyonları.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication for mutations
 * - Slug-based URL routing
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır (100 req/min)
 * - POST/PUT/DELETE: Admin authentication required (JWT)
 * - Slug uniqueness validation
 * - Input sanitization (XSS koruması)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/blog sayfası tarafından kullanılır.
 * Blog yazıları admin panelden yönetilir.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { resolveBlogMetaDesc, resolveBlogMetaTitle } from '@/lib/blog-meta';
import { requireAdminAuth, sanitizeInput, sanitizeStringList } from '@/lib/security';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 1 minute */
const RATE_LIMIT_WINDOW = 60 * 1000;

/** Max requests per window for GET: 100 */
const MAX_REQUESTS_GET = 100;

/** Max requests per window for POST/PUT/DELETE: 30 */
const MAX_REQUESTS_MUTATION = 30;

/** Maximum field lengths */
const MAX_LENGTHS = {
  title: 200,
  slug: 200,
  excerpt: 500,
  category: 50,
  author: 100,
  metaTitle: 200,
  metaDesc: 300,
} as const;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check rate limit for IP address
 * @param ip Client IP address
 * @param maxRequests Max requests allowed
 * @returns boolean - true if rate limited
 */
function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out old timestamps outside the window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if limit exceeded
  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  // Add current timestamp
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  return false;
}

/**
 * Get client IP from request headers
 * @param request NextRequest object
 * @returns Client IP address
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Validate slug format
 * @param slug Slug to validate
 * @returns boolean - true if valid
 */
function isValidSlug(slug: string): boolean {
  // Allow lowercase letters, numbers, hyphens, and underscores
  return /^[a-z0-9-_]+$/.test(slug);
}

// ============================================
// API HANDLERS
// ============================================

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

/**
 * GET handler - List blog posts (public)
 * @param request NextRequest object
 * @returns Blog posts JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip, MAX_REQUESTS_GET)) {
    console.warn('Rate limit exceeded on GET blog', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const publishedParam = searchParams.get('published');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    const isAdmin = token?.role === 'ADMIN';

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.published = true;
    } else {
      if (publishedParam === 'true') where.published = true;
      else if (publishedParam === 'false') where.published = false;
    }
    if (category) where.category = category;

    console.log('Fetching blog posts', { ip, isAdmin, filters: { publishedParam, category, limit } });

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: limit ? parseInt(limit, 10) : undefined,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        image: true,
        category: true,
        tags: true,
        author: true,
        published: true,
        views: true,
        metaTitle: true,
        metaDesc: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`Retrieved ${posts.length} blog posts`);

    return NextResponse.json(posts, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch blog posts', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Blog yazıları yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new blog post (admin only)
 * @param request NextRequest object
 * @returns Created blog post JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized blog post create attempt', { ip });
    return authError;
  }

  // Rate limiting for mutation endpoint
  if (checkRateLimit(ip, MAX_REQUESTS_MUTATION)) {
    console.warn('Rate limit exceeded on POST blog', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const data = await request.json();

    // Validation
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Başlık zorunludur' },
        { status: 400, headers }
      );
    }

    if (data.title.length > MAX_LENGTHS.title) {
      return NextResponse.json(
        { error: `Başlık en fazla ${MAX_LENGTHS.title} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug zorunludur' },
        { status: 400, headers }
      );
    }

    if (data.slug.length > MAX_LENGTHS.slug) {
      return NextResponse.json(
        { error: `Slug en fazla ${MAX_LENGTHS.slug} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!isValidSlug(data.slug)) {
      return NextResponse.json(
        { error: 'Slug sadece küçük harf, rakam, tire ve alt çizgi içerebilir' },
        { status: 400, headers }
      );
    }

    // Check if slug exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'Bu slug zaten kullanılıyor' },
        { status: 400, headers }
      );
    }

    console.log('Creating new blog post', { title: data.title, slug: data.slug });

    const title = sanitizeInput(data.title);
    const excerpt = data.excerpt && typeof data.excerpt === 'string'
      ? sanitizeInput(data.excerpt).slice(0, MAX_LENGTHS.excerpt)
      : '';
    const metaTitleRaw =
      data.metaTitle && typeof data.metaTitle === 'string'
        ? sanitizeInput(data.metaTitle).slice(0, MAX_LENGTHS.metaTitle)
        : null;
    const metaDescRaw =
      data.metaDesc && typeof data.metaDesc === 'string'
        ? sanitizeInput(data.metaDesc).slice(0, MAX_LENGTHS.metaDesc)
        : null;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: sanitizeInput(data.slug.toLowerCase().trim()),
        excerpt,
        content: typeof data.content === 'string' ? data.content : '',
        image: data.image && typeof data.image === 'string' ? data.image : null,
        category: data.category && typeof data.category === 'string'
          ? sanitizeInput(data.category).slice(0, MAX_LENGTHS.category)
          : 'Genel',
        tags: sanitizeStringList(data.tags, { maxItems: 16, maxLength: 60 }),
        author: data.author && typeof data.author === 'string'
          ? sanitizeInput(data.author).slice(0, MAX_LENGTHS.author)
          : 'Günen Temizlik',
        published: typeof data.published === 'boolean' ? data.published : false,
        scheduledPublishAt:
          typeof data.scheduledPublishAt === 'string' && data.scheduledPublishAt
            ? (() => {
                const d = new Date(data.scheduledPublishAt);
                return Number.isNaN(d.getTime()) ? null : d;
              })()
            : null,
        metaTitle: resolveBlogMetaTitle(title, metaTitleRaw).slice(0, MAX_LENGTHS.metaTitle),
        metaDesc: resolveBlogMetaDesc(excerpt, metaDescRaw).slice(0, MAX_LENGTHS.metaDesc),
      },
    });

    console.log('Blog post created successfully', { id: post.id, title: post.title });

    return NextResponse.json(post, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating blog post', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Blog yazısı oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update blog post (admin only)
 * @param request NextRequest object
 * @returns Updated blog post JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized blog post update attempt', { ip });
    return authError;
  }

  // Rate limiting for mutation endpoint
  if (checkRateLimit(ip, MAX_REQUESTS_MUTATION)) {
    console.warn('Rate limit exceeded on PUT blog', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const data = await request.json();

    if (!data.id || typeof data.id !== 'string') {
      return NextResponse.json(
        { error: 'ID zorunludur' },
        { status: 400, headers }
      );
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: data.id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    // Validate slug if provided
    if (data.slug !== undefined) {
      if (typeof data.slug !== 'string' || data.slug.trim().length === 0) {
        return NextResponse.json(
          { error: 'Slug zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.slug.length > MAX_LENGTHS.slug) {
        return NextResponse.json(
          { error: `Slug en fazla ${MAX_LENGTHS.slug} karakter olabilir` },
          { status: 400, headers }
        );
      }
      if (!isValidSlug(data.slug)) {
        return NextResponse.json(
          { error: 'Slug sadece küçük harf, rakam, tire ve alt çizgi içerebilir' },
          { status: 400, headers }
        );
      }

      // Check if new slug conflicts with another post
      const slugCheck = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (slugCheck && slugCheck.id !== existingPost.id) {
        return NextResponse.json(
          { error: 'Bu slug zaten kullanılıyor' },
          { status: 400, headers }
        );
      }
    }

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Başlık zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.title.length > MAX_LENGTHS.title) {
        return NextResponse.json(
          { error: `Başlık en fazla ${MAX_LENGTHS.title} karakter olabilir` },
          { status: 400, headers }
        );
      }
      updateData.title = sanitizeInput(data.title);
    }

    if (data.slug !== undefined) {
      updateData.slug = sanitizeInput(data.slug.toLowerCase().trim());
    }

    if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt && typeof data.excerpt === 'string'
        ? sanitizeInput(data.excerpt).slice(0, MAX_LENGTHS.excerpt)
        : '';
    }

    if (data.content !== undefined) {
      updateData.content = typeof data.content === 'string' ? data.content : '';
    }

    if (data.image !== undefined) {
      updateData.image = data.image && typeof data.image === 'string' ? data.image : null;
    }

    if (data.category !== undefined) {
      updateData.category = data.category && typeof data.category === 'string'
        ? sanitizeInput(data.category).slice(0, MAX_LENGTHS.category)
        : 'Genel';
    }

    if (data.tags !== undefined) {
      updateData.tags = sanitizeStringList(data.tags, { maxItems: 16, maxLength: 60 });
    }

    if (data.author !== undefined) {
      updateData.author = data.author && typeof data.author === 'string'
        ? sanitizeInput(data.author).slice(0, MAX_LENGTHS.author)
        : 'Günen Temizlik';
    }

    if (data.published !== undefined) {
      updateData.published = typeof data.published === 'boolean' ? data.published : false;
    }

    if (data.scheduledPublishAt !== undefined) {
      if (data.scheduledPublishAt === null || data.scheduledPublishAt === '') {
        updateData.scheduledPublishAt = null;
      } else if (typeof data.scheduledPublishAt === 'string') {
        const d = new Date(data.scheduledPublishAt);
        if (!Number.isNaN(d.getTime())) {
          updateData.scheduledPublishAt = d;
        }
      }
    }

    if (data.metaTitle !== undefined) {
      updateData.metaTitle = data.metaTitle && typeof data.metaTitle === 'string'
        ? sanitizeInput(data.metaTitle).slice(0, MAX_LENGTHS.metaTitle)
        : null;
    }

    if (data.metaDesc !== undefined) {
      updateData.metaDesc = data.metaDesc && typeof data.metaDesc === 'string'
        ? sanitizeInput(data.metaDesc).slice(0, MAX_LENGTHS.metaDesc)
        : null;
    }

    const mergedTitle =
      typeof updateData.title === 'string' ? updateData.title : existingPost.title;
    const mergedExcerpt =
      typeof updateData.excerpt === 'string' ? updateData.excerpt : existingPost.excerpt;
    const mergedMetaTitle =
      updateData.metaTitle !== undefined
        ? (updateData.metaTitle as string | null)
        : existingPost.metaTitle;
    const mergedMetaDesc =
      updateData.metaDesc !== undefined
        ? (updateData.metaDesc as string | null)
        : existingPost.metaDesc;

    updateData.metaTitle = resolveBlogMetaTitle(mergedTitle, mergedMetaTitle).slice(
      0,
      MAX_LENGTHS.metaTitle
    );
    updateData.metaDesc = resolveBlogMetaDesc(mergedExcerpt, mergedMetaDesc).slice(
      0,
      MAX_LENGTHS.metaDesc
    );

    console.log('Updating blog post', { id: data.id });

    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: updateData,
    });

    console.log('Blog post updated successfully', { id: post.id });

    return NextResponse.json(post, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating blog post', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Blog yazısı güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete blog post (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized blog post delete attempt', { ip });
    return authError;
  }

  // Rate limiting for mutation endpoint
  if (checkRateLimit(ip, MAX_REQUESTS_MUTATION)) {
    console.warn('Rate limit exceeded on DELETE blog', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    // Get ID from URL search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID zorunludur' },
        { status: 400, headers }
      );
    }

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting blog post', { id, title: existingPost.title, slug: existingPost.slug });

    await prisma.blogPost.delete({
      where: { id },
    });

    console.log('Blog post deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Blog yazısı başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting blog post', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Blog yazısı silinemedi' },
      { status: 500, headers }
    );
  }
}
