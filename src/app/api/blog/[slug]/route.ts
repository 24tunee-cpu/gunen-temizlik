/**
 * @fileoverview Single Blog Post API Route (Dynamic)
 * @description Belirli bir blog yazısı için slug bazlı CRUD operasyonları.
 * GET (public), PUT/DELETE (admin only) endpoint'leri.
 *
 * @architecture
 * - Dynamic Route Segment [slug]
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication for mutations
 * - Slug-based URL routing
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır, sadece yayınlanmış yazılar
 * - PUT/DELETE: Admin authentication required (JWT)
 * - Slug validasyonu
 * - Input sanitization (XSS koruması)
 * - View counter increment (atomic)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/blog sayfası tarafından kullanılır.
 * Tekil blog yazısı düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/blog/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 1 minute */
const RATE_LIMIT_WINDOW = 60 * 1000;

/** Max requests per window: 60 */
const MAX_REQUESTS = 60;

/** Maximum string lengths */
const MAX_LENGTHS = {
  title: 200,
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
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// TYPES
// ============================================

/** Route parameters */
interface RouteParams {
  params: Promise<{ slug: string }>;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Check rate limit for IP address
 * @param ip Client IP address
 * @returns boolean - true if rate limited
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out old timestamps outside the window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if limit exceeded
  if (validTimestamps.length >= MAX_REQUESTS) {
    return true;
  }

  // Add current timestamp
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  return false;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
 * GET handler - Fetch single blog post by slug (public)
 * @param request NextRequest object
 * @param params Route parameters with slug
 * @returns Single blog post JSON with incremented view count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET blog/[slug]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { slug } = await params;

    // Validate slug format
    if (!slug || typeof slug !== 'string' || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Geçersiz slug formatı' },
        { status: 400, headers }
      );
    }

    console.log('Fetching blog post by slug', { slug, ip });

    // Fetch post with selective fields
    const post = await prisma.blogPost.findUnique({
      where: { slug },
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

    if (!post) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    // Only return published posts for public endpoint
    if (!post.published) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    // Increment view count atomically
    await prisma.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });

    // Increment the views count in the response
    const postWithUpdatedViews = { ...post, views: post.views + 1 };

    console.log('Blog post retrieved and view incremented', { slug, views: postWithUpdatedViews.views });

    return NextResponse.json(postWithUpdatedViews, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching blog post', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Blog yazısı yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update blog post by slug (admin only)
 * @param request NextRequest object
 * @param params Route parameters with slug
 * @returns Updated blog post JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized blog post update attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on PUT blog/[slug]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { slug } = await params;

    // Validate slug format
    if (!slug || typeof slug !== 'string' || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Geçersiz slug formatı' },
        { status: 400, headers }
      );
    }

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    const data = await request.json();

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    // Validate and update title if provided
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

    // Validate and update excerpt if provided
    if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt && typeof data.excerpt === 'string'
        ? sanitizeInput(data.excerpt).slice(0, MAX_LENGTHS.excerpt)
        : '';
    }

    // Update content if provided
    if (data.content !== undefined) {
      updateData.content = typeof data.content === 'string' ? data.content : '';
    }

    // Validate and update image if provided
    if (data.image !== undefined) {
      updateData.image = data.image && typeof data.image === 'string' ? data.image : null;
    }

    // Validate and update category if provided
    if (data.category !== undefined) {
      updateData.category = data.category && typeof data.category === 'string'
        ? sanitizeInput(data.category).slice(0, MAX_LENGTHS.category)
        : 'Genel';
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    }

    // Validate and update author if provided
    if (data.author !== undefined) {
      updateData.author = data.author && typeof data.author === 'string'
        ? sanitizeInput(data.author).slice(0, MAX_LENGTHS.author)
        : 'Günen Temizlik';
    }

    // Update published status if provided
    if (data.published !== undefined) {
      updateData.published = typeof data.published === 'boolean' ? data.published : false;
    }

    // Validate and update metaTitle if provided
    if (data.metaTitle !== undefined) {
      updateData.metaTitle = data.metaTitle && typeof data.metaTitle === 'string'
        ? sanitizeInput(data.metaTitle).slice(0, MAX_LENGTHS.metaTitle)
        : null;
    }

    // Validate and update metaDesc if provided
    if (data.metaDesc !== undefined) {
      updateData.metaDesc = data.metaDesc && typeof data.metaDesc === 'string'
        ? sanitizeInput(data.metaDesc).slice(0, MAX_LENGTHS.metaDesc)
        : null;
    }

    console.log('Updating blog post by slug', { slug });

    const post = await prisma.blogPost.update({
      where: { slug },
      data: updateData,
    });

    console.log('Blog post updated successfully', { slug, id: post.id });

    return NextResponse.json(
      {
        success: true,
        message: 'Blog yazısı başarıyla güncellendi',
        post,
      },
      { headers }
    );
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
 * DELETE handler - Delete blog post by slug (admin only)
 * @param request NextRequest object
 * @param params Route parameters with slug
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized blog post delete attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on DELETE blog/[slug]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { slug } = await params;

    // Validate slug format
    if (!slug || typeof slug !== 'string' || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Geçersiz slug formatı' },
        { status: 400, headers }
      );
    }

    // Check if post exists before deleting
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, title: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog yazısı bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting blog post by slug', { slug, title: existingPost.title, ip });

    await prisma.blogPost.delete({
      where: { slug },
    });

    console.log('Blog post deleted successfully', { slug, id: existingPost.id });

    return NextResponse.json(
      {
        success: true,
        message: 'Blog yazısı başarıyla silindi',
      },
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
