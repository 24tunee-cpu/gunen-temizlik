/**
 * @fileoverview Single Service API Route (Dynamic)
 * @description Belirli bir hizmet için ID bazlı CRUD operasyonları.
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
 * - PUT/DELETE: Admin authentication required (JWT)
 * - Input sanitization (XSS koruması)
 * - ID validasyonu
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/hizmetler sayfası tarafından kullanılır.
 * Tekil hizmet düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/services/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
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
 * Validate slug format
 * @param slug Slug to validate
 * @returns boolean - true if valid
 */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
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
 * GET handler - Fetch single service (public)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single service JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET service/[id]', { ip });
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

    console.log('Fetching service by ID', { id, ip });

    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDesc: true,
        description: true,
        image: true,
        icon: true,
        features: true,
        priceRange: true,
        order: true,
        isActive: true,
        metaTitle: true,
        metaDesc: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404, headers }
      );
    }

    // Only return active services for public endpoint
    if (!service.isActive) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Service retrieved successfully', { id });

    return NextResponse.json(service, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching service', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Hizmet yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update service (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated service JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    const ip = getClientIp(request);
    console.warn('Unauthorized service update attempt', { ip });
    return authError;
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

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404, headers }
      );
    }

    const data = await request.json();

    // Validate title if provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400, headers });
      }
      if (data.title.length > 200) {
        return NextResponse.json({ error: 'Başlık en fazla 200 karakter olabilir' }, { status: 400, headers });
      }
    }

    // Validate slug if provided and check uniqueness
    if (data.slug !== undefined && data.slug !== existingService.slug) {
      if (typeof data.slug !== 'string' || data.slug.trim().length === 0) {
        return NextResponse.json({ error: 'Slug zorunludur' }, { status: 400, headers });
      }
      if (!isValidSlug(data.slug)) {
        return NextResponse.json({ error: 'Slug sadece küçük harf, rakam ve tire içerebilir' }, { status: 400, headers });
      }
      const slugExists = await prisma.service.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 400, headers });
      }
    }

    // Build update data dynamically (partial update)
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = sanitizeInput(data.title as string);
    if (data.slug !== undefined) updateData.slug = sanitizeInput(data.slug as string);
    if (data.shortDesc !== undefined) {
      updateData.shortDesc = data.shortDesc && typeof data.shortDesc === 'string' ? sanitizeInput(data.shortDesc) : '';
    }
    if (data.description !== undefined) {
      updateData.description = data.description && typeof data.description === 'string' ? sanitizeInput(data.description) : '';
    }
    if (data.image !== undefined) updateData.image = data.image && typeof data.image === 'string' ? data.image : null;
    if (data.icon !== undefined) updateData.icon = data.icon && typeof data.icon === 'string' ? data.icon : 'Sparkles';
    if (data.features !== undefined) updateData.features = Array.isArray(data.features) ? data.features : [];
    if (data.priceRange !== undefined) updateData.priceRange = data.priceRange && typeof data.priceRange === 'string' ? data.priceRange : null;
    if (data.order !== undefined) updateData.order = typeof data.order === 'number' ? data.order : 0;
    if (data.isActive !== undefined) updateData.isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle && typeof data.metaTitle === 'string' ? data.metaTitle : null;
    if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc && typeof data.metaDesc === 'string' ? data.metaDesc : null;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    console.log('Service updated successfully', { id });
    return NextResponse.json(service, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating service', { error: errorMessage });
    return NextResponse.json(
      { error: 'Hizmet güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete service (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    const ip = getClientIp(request);
    console.warn('Unauthorized service delete attempt', { ip });
    return authError;
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

    // Check if service exists before deleting
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Hizmet bulunamadı' },
        { status: 404, headers }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    console.log('Service deleted successfully', { id, title: existingService.title });
    return NextResponse.json(
      { success: true, message: 'Hizmet başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting service', { error: errorMessage });
    return NextResponse.json(
      { error: 'Hizmet silinemedi' },
      { status: 500, headers }
    );
  }
}
