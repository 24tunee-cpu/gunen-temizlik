/**
 * @fileoverview Pricing API Route
 * @description Fiyatlandırma CRUD API endpoint'i.
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
 * - Numeric validation for prices
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/fiyatlar sayfası tarafından kullanılır.
 * Fiyatlandırma bilgileri admin panelden yönetilir.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */
const logger = createLogger('api/pricing');

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
 * GET handler - List all pricing items (public)
 * @param request NextRequest object
 * @returns Pricing items JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on GET pricing', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    logger.info('Fetching all pricing items', { ip });

    const pricing = await prisma.pricing.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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

    logger.info(`Retrieved ${pricing.length} pricing items`);
    return NextResponse.json(pricing, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch pricing', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Fiyatlandırma bilgileri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new pricing item (admin only)
 * @param request NextRequest object
 * @returns Created pricing item JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized pricing create attempt');
    return authError;
  }

  try {
    const body = await request.json();

    // Validation
    if (!body.serviceName || typeof body.serviceName !== 'string' || body.serviceName.trim().length === 0) {
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

    if (typeof body.basePrice !== 'number' || body.basePrice < 0) {
      return NextResponse.json(
        { error: 'Geçerli bir fiyat giriniz' },
        { status: 400, headers }
      );
    }

    logger.info('Creating new pricing item', { serviceName: body.serviceName });

    const item = await prisma.pricing.create({
      data: {
        serviceName: sanitizeInput(body.serviceName),
        basePrice: body.basePrice,
        pricePerSqm: typeof body.pricePerSqm === 'number' ? body.pricePerSqm : null,
        unit: body.unit && typeof body.unit === 'string' ? body.unit : 'm²',
        minPrice: typeof body.minPrice === 'number' ? body.minPrice : null,
        description: body.description && typeof body.description === 'string'
          ? sanitizeInput(body.description)
          : null,
        features: Array.isArray(body.features) ? body.features : [],
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    logger.info('Pricing item created successfully', { id: item.id });
    return NextResponse.json(item, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create pricing', { error: errorMessage });
    return NextResponse.json(
      { error: 'Fiyatlandırma oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update pricing item (admin only)
 * @param request NextRequest object
 * @returns Updated pricing item JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized pricing update attempt');
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

    // Validate serviceName if provided
    if (data.serviceName !== undefined) {
      if (typeof data.serviceName !== 'string' || data.serviceName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Hizmet adı zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.serviceName.length > 100) {
        return NextResponse.json(
          { error: 'Hizmet adı en fazla 100 karakter olabilir' },
          { status: 400, headers }
        );
      }
    }

    // Validate basePrice if provided
    if (data.basePrice !== undefined) {
      if (typeof data.basePrice !== 'number' || data.basePrice < 0) {
        return NextResponse.json(
          { error: 'Geçerli bir fiyat giriniz' },
          { status: 400, headers }
        );
      }
    }

    logger.info('Updating pricing item', { id });

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (data.serviceName !== undefined) {
      updateData.serviceName = sanitizeInput(data.serviceName as string);
    }
    if (data.basePrice !== undefined) {
      updateData.basePrice = data.basePrice;
    }
    if (data.pricePerSqm !== undefined) {
      updateData.pricePerSqm = typeof data.pricePerSqm === 'number' ? data.pricePerSqm : null;
    }
    if (data.unit !== undefined) {
      updateData.unit = data.unit && typeof data.unit === 'string' ? data.unit : 'm²';
    }
    if (data.minPrice !== undefined) {
      updateData.minPrice = typeof data.minPrice === 'number' ? data.minPrice : null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description && typeof data.description === 'string'
        ? sanitizeInput(data.description)
        : null;
    }
    if (data.features !== undefined) {
      updateData.features = Array.isArray(data.features) ? data.features : [];
    }
    if (data.isActive !== undefined) {
      updateData.isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
    }
    if (data.order !== undefined) {
      updateData.order = typeof data.order === 'number' ? data.order : 0;
    }

    const item = await prisma.pricing.update({
      where: { id },
      data: updateData,
    });

    logger.info('Pricing item updated successfully', { id });
    return NextResponse.json(item, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update pricing', { error: errorMessage });
    return NextResponse.json(
      { error: 'Fiyatlandırma güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete pricing item (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized pricing delete attempt');
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

    // Check if pricing item exists
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

    logger.info('Deleting pricing item', { id, serviceName: existingItem.serviceName });

    await prisma.pricing.delete({
      where: { id },
    });

    logger.info('Pricing item deleted successfully', { id });
    return NextResponse.json(
      { success: true, message: 'Fiyatlandırma başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete pricing', { error: errorMessage });
    return NextResponse.json(
      { error: 'Fiyatlandırma silinemedi' },
      { status: 500, headers }
    );
  }
}
