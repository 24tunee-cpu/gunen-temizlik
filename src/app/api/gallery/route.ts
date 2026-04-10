/**
 * @fileoverview Gallery API Route
 * @description Galeri CRUD API endpoint'i.
 * GET (public), POST/PUT/DELETE (admin only) operasyonları.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication for mutations
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır
 * - POST/PUT/DELETE: Admin authentication required (JWT)
 * - Input sanitization (XSS koruması)
 * - Image URL validation
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/galeri sayfası tarafından kullanılır.
 * Galeri öğeleri admin panelden yönetilir.
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
  title: 100,
  description: 500,
  category: 50,
} as const;

/** Default category */
const DEFAULT_CATEGORY = 'Diğer';

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
 * Validate image URL format
 * @param url URL to validate
 * @returns boolean - true if valid
 */
function isValidImageUrl(url: string): boolean {
  // Allow relative paths (starting with /) or absolute URLs
  return url.startsWith('/') || /^https?:\/\//.test(url);
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
 * GET handler - List all gallery items (public)
 * @param request NextRequest object
 * @returns Gallery items JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET gallery', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching all gallery items', { ip });

    const items = await prisma.gallery.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        category: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    console.log(`Retrieved ${items.length} gallery items`);

    return NextResponse.json(items, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch gallery', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Galeri öğeleri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new gallery item (admin only)
 * @param request NextRequest object
 * @returns Created gallery item JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized gallery item create attempt');
    return authError;
  }

  try {
    const body = await request.json();

    // Validation
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Başlık zorunludur' },
        { status: 400, headers }
      );
    }

    if (body.title.length > MAX_LENGTHS.title) {
      return NextResponse.json(
        { error: `Başlık en fazla ${MAX_LENGTHS.title} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!body.image || typeof body.image !== 'string' || !isValidImageUrl(body.image)) {
      return NextResponse.json(
        { error: 'Geçerli bir resim URL\'si giriniz' },
        { status: 400, headers }
      );
    }

    console.log('Creating new gallery item', { title: body.title });

    const item = await prisma.gallery.create({
      data: {
        title: sanitizeInput(body.title),
        description: body.description && typeof body.description === 'string'
          ? sanitizeInput(body.description).slice(0, MAX_LENGTHS.description)
          : null,
        image: body.image,
        category: body.category && typeof body.category === 'string'
          ? sanitizeInput(body.category).slice(0, MAX_LENGTHS.category)
          : DEFAULT_CATEGORY,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    console.log('Gallery item created successfully', { id: item.id });

    return NextResponse.json(item, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create gallery item', { error: errorMessage });
    return NextResponse.json(
      { error: 'Galeri öğesi oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update gallery item (admin only)
 * @param request NextRequest object
 * @returns Updated gallery item JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized gallery item update attempt');
    return authError;
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID zorunludur' },
        { status: 400, headers }
      );
    }

    // Check if gallery item exists
    const existingItem = await prisma.gallery.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Galeri öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    // Validate title if provided
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
    }

    // Validate image if provided
    if (data.image !== undefined) {
      if (typeof data.image !== 'string' || !isValidImageUrl(data.image)) {
        return NextResponse.json(
          { error: 'Geçerli bir resim URL\'si giriniz' },
          { status: 400, headers }
        );
      }
    }

    console.log('Updating gallery item', { id });

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = sanitizeInput(data.title as string);
    }
    if (data.description !== undefined) {
      updateData.description = data.description && typeof data.description === 'string'
        ? sanitizeInput(data.description).slice(0, MAX_LENGTHS.description)
        : null;
    }
    if (data.image !== undefined) {
      updateData.image = data.image;
    }
    if (data.category !== undefined) {
      updateData.category = data.category && typeof data.category === 'string'
        ? sanitizeInput(data.category).slice(0, MAX_LENGTHS.category)
        : DEFAULT_CATEGORY;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
    }
    if (data.order !== undefined) {
      updateData.order = typeof data.order === 'number' ? data.order : 0;
    }

    const item = await prisma.gallery.update({
      where: { id },
      data: updateData,
    });

    console.log('Gallery item updated successfully', { id });

    return NextResponse.json(item, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update gallery item', { error: errorMessage });
    return NextResponse.json(
      { error: 'Galeri öğesi güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete gallery item (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized gallery item delete attempt');
    return authError;
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

    // Check if gallery item exists
    const existingItem = await prisma.gallery.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Galeri öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting gallery item', { id, title: existingItem.title });

    await prisma.gallery.delete({
      where: { id },
    });

    console.log('Gallery item deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Galeri öğesi başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete gallery item', { error: errorMessage });
    return NextResponse.json(
      { error: 'Galeri öğesi silinemedi' },
      { status: 500, headers }
    );
  }
}
