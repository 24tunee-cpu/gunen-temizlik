/**
 * @fileoverview Single Pricing API Route (Dynamic)
 * @description Belirli bir fiyatlandırma kaydı için ID bazlı CRUD operasyonları.
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
 * Bu endpoint admin paneldeki /admin/fiyatlar sayfası tarafından kullanılır.
 * Tekil fiyatlandırma düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/pricing/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput, sanitizeStringList } from '@/lib/security';

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
 * GET handler - Fetch single pricing item (public)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single pricing item JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET pricing/[id]', { ip });
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

    console.log('Fetching pricing item by ID', { id, ip });

    const item = await prisma.pricing.findUnique({
      where: { id },
      select: {
        id: true,
        serviceName: true,
        basePrice: true,
        pricePerSqm: true,
        unit: true,
        minPrice: true,
        description: true,
        features: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Fiyatlandırma kaydı bulunamadı' },
        { status: 404, headers }
      );
    }

    // Only return active items for public endpoint
    if (!item.isActive) {
      return NextResponse.json(
        { error: 'Fiyatlandırma kaydı bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Pricing item retrieved successfully', { id });

    return NextResponse.json(item, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching pricing item', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Fiyatlandırma bilgileri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update pricing item (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated pricing item JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    const ip = getClientIp(request);
    console.warn('Unauthorized pricing update attempt', { ip });
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

    // Check if pricing item exists
    const existingItem = await prisma.pricing.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Fiyatlandırma kaydı bulunamadı' },
        { status: 404, headers }
      );
    }

    const body = await request.json();

    // Validate serviceName if provided
    if (body.serviceName !== undefined) {
      if (typeof body.serviceName !== 'string' || body.serviceName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Hizmet adı zorunludur' },
          { status: 400, headers }
        );
      }
      if (body.serviceName.length > 100) {
        return NextResponse.json(
          { error: 'Hizmet adı en fazla 100 karakter olabilir' },
          { status: 400, headers }
        );
      }
    }

    // Validate basePrice if provided
    if (body.basePrice !== undefined) {
      if (typeof body.basePrice !== 'number' || body.basePrice < 0) {
        return NextResponse.json(
          { error: 'Geçerli bir fiyat giriniz' },
          { status: 400, headers }
        );
      }
    }

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (body.serviceName !== undefined) {
      updateData.serviceName = sanitizeInput(body.serviceName as string);
    }
    if (body.basePrice !== undefined) {
      updateData.basePrice = body.basePrice;
    }
    if (body.pricePerSqm !== undefined) {
      updateData.pricePerSqm = typeof body.pricePerSqm === 'number' ? body.pricePerSqm : null;
    }
    if (body.unit !== undefined) {
      updateData.unit = body.unit && typeof body.unit === 'string' ? body.unit : 'm²';
    }
    if (body.minPrice !== undefined) {
      updateData.minPrice = typeof body.minPrice === 'number' ? body.minPrice : null;
    }
    if (body.description !== undefined) {
      updateData.description = body.description && typeof body.description === 'string'
        ? sanitizeInput(body.description)
        : null;
    }
    if (body.features !== undefined) {
      updateData.features = sanitizeStringList(body.features, { maxItems: 20, maxLength: 100 });
    }
    if (body.isActive !== undefined) {
      updateData.isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    }
    if (body.order !== undefined) {
      updateData.order = typeof body.order === 'number' ? body.order : 0;
    }

    console.log('Updating pricing item', { id });

    const item = await prisma.pricing.update({
      where: { id },
      data: updateData,
    });

    console.log('Pricing item updated successfully', { id });

    return NextResponse.json(item, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating pricing item', { error: errorMessage });
    return NextResponse.json(
      { error: 'Fiyatlandırma güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete pricing item (admin only)
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
    console.warn('Unauthorized pricing delete attempt', { ip });
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

    // Check if pricing item exists before deleting
    const existingItem = await prisma.pricing.findUnique({
      where: { id },
      select: { id: true, serviceName: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Fiyatlandırma kaydı bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting pricing item', { id, serviceName: existingItem.serviceName });

    await prisma.pricing.delete({
      where: { id },
    });

    console.log('Pricing item deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Fiyatlandırma başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting pricing item', { error: errorMessage });
    return NextResponse.json(
      { error: 'Fiyatlandırma silinemedi' },
      { status: 500, headers }
    );
  }
}
