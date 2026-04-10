/**
 * @fileoverview Single Newsletter Subscriber API Route (Dynamic)
 * @description Belirli bir bülten abonesi için ID bazlı CRUD operasyonları.
 * GET/PUT/DELETE (admin only) endpoint'leri.
 *
 * @architecture
 * - Dynamic Route Segment [id]
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication required for all operations
 *
 * @security
 * - All endpoints: Admin authentication required (JWT)
 * - Rate limiting uygulanır
 * - ID validasyonu
 * - Email privacy protection (sadece admin görebilir)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/aboneler sayfası tarafından kullanılır.
 * Tekil abone görüntüleme, güncelleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/newsletter/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
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
const logger = createLogger('api/newsletter/[id]');

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 1 minute */
const RATE_LIMIT_WINDOW = 60 * 1000;

/** Max requests per window: 60 */
const MAX_REQUESTS = 60;

/** Maximum name length */
const MAX_NAME_LENGTH = 100;

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
 * Validate email format (RFC 5322 simplified)
 * @param email Email to validate
 * @returns boolean - true if valid
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
 * GET handler - Fetch single subscriber (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single subscriber JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized subscriber fetch attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on GET newsletter/[id]', { ip });
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

    logger.info('Fetching subscriber by ID', { id, ip });

    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Abone bulunamadı' },
        { status: 404, headers }
      );
    }

    logger.info('Subscriber retrieved successfully', { id });

    return NextResponse.json(subscriber, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching subscriber', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Abone bilgileri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update subscriber (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated subscriber JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized subscriber update attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on PUT newsletter/[id]', { ip });
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

    // Check if subscriber exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: 'Abone bulunamadı' },
        { status: 404, headers }
      );
    }

    const body = await request.json();

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    // Validate and update name if provided
    if (body.name !== undefined) {
      if (body.name !== null) {
        if (typeof body.name !== 'string') {
          return NextResponse.json(
            { error: 'İsim metin formatında olmalıdır' },
            { status: 400, headers }
          );
        }
        const trimmedName = body.name.trim();
        if (trimmedName.length > MAX_NAME_LENGTH) {
          return NextResponse.json(
            { error: `İsim en fazla ${MAX_NAME_LENGTH} karakter olabilir` },
            { status: 400, headers }
          );
        }
        updateData.name = trimmedName ? sanitizeInput(trimmedName) : null;
      } else {
        updateData.name = null;
      }
    }

    // Validate and update email if provided
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !isValidEmail(body.email.trim())) {
        return NextResponse.json(
          { error: 'Geçerli bir e-posta adresi giriniz' },
          { status: 400, headers }
        );
      }
      const newEmail = body.email.trim().toLowerCase();

      // Check if new email already exists (and it's not the current subscriber)
      if (newEmail !== existingSubscriber.email) {
        const emailExists = await prisma.subscriber.findUnique({
          where: { email: newEmail },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: 'Bu e-posta adresi başka bir abone tarafından kullanılıyor' },
            { status: 400, headers }
          );
        }
      }

      updateData.email = sanitizeInput(newEmail);
    }

    // Update isActive status if provided
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive değeri boolean olmalıdır' },
          { status: 400, headers }
        );
      }
      updateData.isActive = body.isActive;
    }

    logger.info('Updating subscriber', { id, ip });

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: updateData,
    });

    logger.info('Subscriber updated successfully', { id });

    return NextResponse.json(
      {
        success: true,
        message: 'Abone başarıyla güncellendi',
        subscriber,
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating subscriber', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Abone güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete subscriber (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized subscriber delete attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on DELETE newsletter/[id]', { ip });
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

    // Check if subscriber exists before deleting
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: 'Abone bulunamadı' },
        { status: 404, headers }
      );
    }

    logger.info('Deleting subscriber', { id, email: existingSubscriber.email, ip });

    await prisma.subscriber.delete({
      where: { id },
    });

    logger.info('Subscriber deleted successfully', { id });

    return NextResponse.json(
      {
        success: true,
        message: 'Abone başarıyla silindi',
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error deleting subscriber', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Abone silinemedi' },
      { status: 500, headers }
    );
  }
}
