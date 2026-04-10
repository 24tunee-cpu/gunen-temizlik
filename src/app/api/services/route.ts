/**
 * @fileoverview Services API Route
 * @description Hizmetler CRUD API endpoint'i.
 * GET (public), POST/PUT/DELETE (admin only) operasyonları.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Middleware pattern with error handling
 * - Rate limiting and security headers
 *
 * @security
 * - GET: Public endpoint, rate limiting (100 req/min)
 * - POST/PUT/DELETE: Admin authentication required (JWT)
 * - Input sanitization (XSS koruması)
 * - Security event logging
 * - CORS headers
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/hizmetler sayfası tarafından kullanılır.
 * Hizmetler admin panelden yönetilir (CRUD operasyonları).
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAPILogging } from '@/lib/api-logger';
import { withErrorHandler } from '@/lib/error-handler';
import {
  requireAdminAuth,
  sanitizeInput,
  rateLimitMiddleware,
  addSecurityHeaders,
} from '@/lib/security';


// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// OPTIONS HANDLER
// ============================================

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

// ============================================
// GET HANDLER (Public)
// ============================================

/**
 * GET handler - Fetch all services (public)
 * @param req NextRequest object
 * @returns Services list JSON
 */
const getHandler = async (req: NextRequest) => {
  console.log('Fetching services list', { method: 'GET', url: req.url });

  const rateLimit = rateLimitMiddleware(req, 100, 60000);
  if (rateLimit) {
    console.warn('Rate limit exceeded for services GET', { url: req.url });
    return rateLimit;
  }

  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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
      },
    });
    console.log('Returning services list', { count: services.length });

    const response = NextResponse.json(services, { headers: CORS_HEADERS });
    return addSecurityHeaders(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch services', { error: errorMessage });
    return NextResponse.json(
      { error: 'Hizmetler yüklenemedi' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

// GET export with error handling
export const GET = withErrorHandler(getHandler);

// ============================================
// POST HANDLER (Admin Only)
// ============================================

/**
 * POST handler - Create new service (admin only)
 * @param req NextRequest object
 * @returns Created service JSON
 */
const postHandler = async (req: NextRequest) => {
  console.log('Creating new service', { method: 'POST', url: req.url });

  const authError = await requireAdminAuth(req);
  if (authError) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    console.warn('Unauthorized service create attempt', { url: req.url, ip });
    return authError;
  }

  const rateLimit = rateLimitMiddleware(req, 30, 60000);
  if (rateLimit) {
    console.warn('Rate limit exceeded for service POST', { url: req.url });
    return rateLimit;
  }

  try {
    const data = await req.json();
    console.log('Received service data', { title: data.title });

    // Validation
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400, headers: CORS_HEADERS });
    }

    if (data.title.length > 200) {
      return NextResponse.json({ error: 'Başlık en fazla 200 karakter olabilir' }, { status: 400, headers: CORS_HEADERS });
    }

    if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug zorunludur' }, { status: 400, headers: CORS_HEADERS });
    }

    // Validate slug format (alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json({ error: 'Slug sadece küçük harf, rakam ve tire içerebilir' }, { status: 400, headers: CORS_HEADERS });
    }

    // Check if slug exists
    const existingService = await prisma.service.findUnique({
      where: { slug: data.slug },
    });
    if (existingService) {
      return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 400, headers: CORS_HEADERS });
    }

    const service = await prisma.service.create({
      data: {
        title: sanitizeInput(data.title),
        slug: sanitizeInput(data.slug),
        shortDesc: data.shortDesc && typeof data.shortDesc === 'string' ? sanitizeInput(data.shortDesc) : '',
        description: data.description && typeof data.description === 'string' ? sanitizeInput(data.description) : '',
        image: data.image && typeof data.image === 'string' ? data.image : null,
        icon: data.icon && typeof data.icon === 'string' ? data.icon : 'Sparkles',
        features: Array.isArray(data.features) ? data.features : [],
        priceRange: data.priceRange && typeof data.priceRange === 'string' ? data.priceRange : null,
        order: typeof data.order === 'number' ? data.order : 0,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        metaTitle: data.metaTitle && typeof data.metaTitle === 'string' ? data.metaTitle : null,
        metaDesc: data.metaDesc && typeof data.metaDesc === 'string' ? data.metaDesc : null,
      },
    });

    console.log('Service created successfully', { id: service.id, title: service.title });
    const response = NextResponse.json(service, { status: 201, headers: CORS_HEADERS });
    return addSecurityHeaders(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating service', { error: errorMessage });
    return NextResponse.json({ error: 'Hizmet oluşturulamadı' }, { status: 500, headers: CORS_HEADERS });
  }
};

// POST export with error handling
export const POST = withErrorHandler(postHandler);

// ============================================
// PUT HANDLER (Admin Only)
// ============================================

/**
 * PUT handler - Update service (admin only)
 * @param req NextRequest object
 * @returns Updated service JSON
 */
const putHandler = async (req: NextRequest) => {
  console.log('Updating service', { method: 'PUT', url: req.url });

  const authError = await requireAdminAuth(req);
  if (authError) {
    console.warn('Unauthorized service update attempt', { url: req.url });
    return authError;
  }

  try {
    const data = await req.json();

    if (!data.id || typeof data.id !== 'string') {
      return NextResponse.json({ error: 'ID zorunludur' }, { status: 400, headers: CORS_HEADERS });
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: data.id },
      select: { id: true, slug: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Hizmet bulunamadı' }, { status: 404, headers: CORS_HEADERS });
    }

    // Validate title if provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400, headers: CORS_HEADERS });
      }
      if (data.title.length > 200) {
        return NextResponse.json({ error: 'Başlık en fazla 200 karakter olabilir' }, { status: 400, headers: CORS_HEADERS });
      }
    }

    // Validate slug if provided and check uniqueness
    if (data.slug !== undefined && data.slug !== existingService.slug) {
      if (typeof data.slug !== 'string' || data.slug.trim().length === 0) {
        return NextResponse.json({ error: 'Slug zorunludur' }, { status: 400, headers: CORS_HEADERS });
      }
      if (!/^[a-z0-9-]+$/.test(data.slug)) {
        return NextResponse.json({ error: 'Slug sadece küçük harf, rakam ve tire içerebilir' }, { status: 400, headers: CORS_HEADERS });
      }
      const slugExists = await prisma.service.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 400, headers: CORS_HEADERS });
      }
    }

    // Build update data dynamically
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
      where: { id: data.id },
      data: updateData,
    });

    console.log('Service updated successfully', { id: service.id });
    const response = NextResponse.json(service, { headers: CORS_HEADERS });
    return addSecurityHeaders(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating service', { error: errorMessage });
    return NextResponse.json({ error: 'Hizmet güncellenemedi' }, { status: 500, headers: CORS_HEADERS });
  }
};

export const PUT = withErrorHandler(putHandler);

// ============================================
// DELETE HANDLER (Admin Only)
// ============================================

/**
 * DELETE handler - Delete service (admin only)
 * @param req NextRequest object
 * @returns Success message JSON
 */
const deleteHandler = async (req: NextRequest) => {
  console.log('Deleting service', { method: 'DELETE', url: req.url });

  const authError = await requireAdminAuth(req);
  if (authError) {
    console.warn('Unauthorized service delete attempt', { url: req.url });
    return authError;
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID zorunludur' }, { status: 400, headers: CORS_HEADERS });
    }

    // Check if service exists before deleting
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Hizmet bulunamadı' }, { status: 404, headers: CORS_HEADERS });
    }

    await prisma.service.delete({
      where: { id },
    });

    console.log('Service deleted successfully', { id, title: existingService.title });
    const response = NextResponse.json(
      { success: true, message: 'Hizmet başarıyla silindi' },
      { headers: CORS_HEADERS }
    );
    return addSecurityHeaders(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting service', { error: errorMessage });
    return NextResponse.json({ error: 'Hizmet silinemedi' }, { status: 500, headers: CORS_HEADERS });
  }
};

export const DELETE = withErrorHandler(deleteHandler);
