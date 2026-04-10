/**
 * @fileoverview Single Gallery Item API Route (Dynamic)
 * @description Belirli bir galeri öğesi için ID bazlı CRUD operasyonları.
 * GET (public), PUT/DELETE (admin only) endpoint'leri.
 *
 * @architecture
 * - Dynamic Route Segment [id]
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication for mutations
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır
 * - PUT/DELETE: Admin authentication required (JWT) - KRİTİK!
 * - ID validasyonu
 * - Input sanitization (XSS koruması)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/galeri sayfası tarafından kullanılır.
 * Tekil galeri öğesi düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/gallery/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
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
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// TYPES
// ============================================

/** Route parameters */
interface RouteParams {
  params: Promise<{ id: string }>;
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
 * Validate ID parameter
 * @param id ID to validate
 * @returns boolean - true if valid
 */
function validateId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 100;
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
 * GET handler - Fetch single gallery item (public)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single gallery item JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET gallery/[id]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { id } = await params;

    // Validate ID
    if (!validateId(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID formatı' },
        { status: 400, headers }
      );
    }

    console.log('Fetching gallery item by ID', { id, ip });

    const item = await prisma.gallery.findUnique({
      where: { id },
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

    if (!item) {
      return NextResponse.json(
        { error: 'Galeri öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    // Only return active items for public endpoint
    if (!item.isActive) {
      return NextResponse.json(
        { error: 'Galeri öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Gallery item retrieved successfully', { id });

    return NextResponse.json(item, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching gallery item', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Galeri öğesi yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update gallery item (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated gallery item JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized gallery item update attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on PUT gallery/[id]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { id } = await params;

    // Validate ID
    if (!validateId(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID formatı' },
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

    const body = await request.json();

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    // Validate and update title if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
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
      updateData.title = sanitizeInput(body.title);
    }

    // Validate and update description if provided
    if (body.description !== undefined) {
      updateData.description = body.description && typeof body.description === 'string'
        ? sanitizeInput(body.description).slice(0, MAX_LENGTHS.description)
        : null;
    }

    // Validate and update image if provided
    if (body.image !== undefined) {
      if (typeof body.image !== 'string' || !isValidImageUrl(body.image)) {
        return NextResponse.json(
          { error: 'Geçerli bir resim URL\'si giriniz' },
          { status: 400, headers }
        );
      }
      updateData.image = body.image;
    }

    // Update category if provided
    if (body.category !== undefined) {
      updateData.category = body.category && typeof body.category === 'string'
        ? sanitizeInput(body.category).slice(0, MAX_LENGTHS.category)
        : DEFAULT_CATEGORY;
    }

    // Update isActive if provided
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive değeri boolean olmalıdır' },
          { status: 400, headers }
        );
      }
      updateData.isActive = body.isActive;
    }

    // Update order if provided
    if (body.order !== undefined) {
      if (typeof body.order !== 'number') {
        return NextResponse.json(
          { error: 'order değeri sayı olmalıdır' },
          { status: 400, headers }
        );
      }
      updateData.order = body.order;
    }

    console.log('Updating gallery item', { id });

    const item = await prisma.gallery.update({
      where: { id },
      data: updateData,
    });

    console.log('Gallery item updated successfully', { id });

    return NextResponse.json(
      {
        success: true,
        message: 'Galeri öğesi başarıyla güncellendi',
        item,
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating gallery item', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Galeri öğesi güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete gallery item (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized gallery item delete attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on DELETE gallery/[id]', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const { id } = await params;

    // Validate ID
    if (!validateId(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID formatı' },
        { status: 400, headers }
      );
    }

    // Check if gallery item exists before deleting
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

    console.log('Deleting gallery item', { id, title: existingItem.title, ip });

    await prisma.gallery.delete({
      where: { id },
    });

    console.log('Gallery item deleted successfully', { id });

    return NextResponse.json(
      {
        success: true,
        message: 'Galeri öğesi başarıyla silindi',
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting gallery item', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Galeri öğesi silinemedi' },
      { status: 500, headers }
    );
  }
}
