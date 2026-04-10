/**
 * @fileoverview Certificates API Route
 * @description Sertifikalar CRUD API endpoint'i.
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
 * Bu endpoint admin paneldeki /admin/sertifikalar sayfası tarafından kullanılır.
 * Sertifikalar admin panelden yönetilir.
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
const logger = createLogger('api/certificates');

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
  issuer: 100,
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

/**
 * Validate date string format
 * @param date Date string to validate
 * @returns boolean - true if valid
 */
function isValidDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
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
 * GET handler - List all certificates (public)
 * @param request NextRequest object
 * @returns Certificates JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on GET certificates', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    logger.info('Fetching all certificates', { ip });

    const certificates = await prisma.certificate.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        issuer: true,
        date: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    logger.info(`Retrieved ${certificates.length} certificates`);

    return NextResponse.json(certificates, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch certificates', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Sertifikalar yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new certificate (admin only)
 * @param request NextRequest object
 * @returns Created certificate JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized certificate create attempt');
    return authError;
  }

  try {
    const body = await request.json();

    // Validation
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Sertifika başlığı zorunludur' },
        { status: 400, headers }
      );
    }

    if (body.title.length > MAX_LENGTHS.title) {
      return NextResponse.json(
        { error: `Sertifika başlığı en fazla ${MAX_LENGTHS.title} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!body.image || typeof body.image !== 'string' || !isValidImageUrl(body.image)) {
      return NextResponse.json(
        { error: 'Geçerli bir sertifika görseli URL\'si giriniz' },
        { status: 400, headers }
      );
    }

    // Validate date if provided
    if (body.date !== undefined && body.date !== null) {
      if (typeof body.date !== 'string' || !isValidDate(body.date)) {
        return NextResponse.json(
          { error: 'Geçerli bir tarih giriniz' },
          { status: 400, headers }
        );
      }
    }

    logger.info('Creating new certificate', { title: body.title });

    const certificate = await prisma.certificate.create({
      data: {
        title: sanitizeInput(body.title),
        description: body.description && typeof body.description === 'string'
          ? sanitizeInput(body.description).slice(0, MAX_LENGTHS.description)
          : null,
        image: body.image,
        issuer: body.issuer && typeof body.issuer === 'string'
          ? sanitizeInput(body.issuer).slice(0, MAX_LENGTHS.issuer)
          : null,
        date: body.date && isValidDate(body.date) ? new Date(body.date) : null,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    logger.info('Certificate created successfully', { id: certificate.id });

    return NextResponse.json(certificate, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create certificate', { error: errorMessage });
    return NextResponse.json(
      { error: 'Sertifika oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update certificate (admin only)
 * @param request NextRequest object
 * @returns Updated certificate JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized certificate update attempt');
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

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: 'Sertifika bulunamadı' },
        { status: 404, headers }
      );
    }

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    // Validate and update title if provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Sertifika başlığı zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.title.length > MAX_LENGTHS.title) {
        return NextResponse.json(
          { error: `Sertifika başlığı en fazla ${MAX_LENGTHS.title} karakter olabilir` },
          { status: 400, headers }
        );
      }
      updateData.title = sanitizeInput(data.title);
    }

    // Validate and update description if provided
    if (data.description !== undefined) {
      updateData.description = data.description && typeof data.description === 'string'
        ? sanitizeInput(data.description).slice(0, MAX_LENGTHS.description)
        : null;
    }

    // Validate and update image if provided
    if (data.image !== undefined) {
      if (typeof data.image !== 'string' || !isValidImageUrl(data.image)) {
        return NextResponse.json(
          { error: 'Geçerli bir sertifika görseli URL\'si giriniz' },
          { status: 400, headers }
        );
      }
      updateData.image = data.image;
    }

    // Update issuer if provided
    if (data.issuer !== undefined) {
      updateData.issuer = data.issuer && typeof data.issuer === 'string'
        ? sanitizeInput(data.issuer).slice(0, MAX_LENGTHS.issuer)
        : null;
    }

    // Validate and update date if provided
    if (data.date !== undefined && data.date !== null) {
      if (typeof data.date !== 'string' || !isValidDate(data.date)) {
        return NextResponse.json(
          { error: 'Geçerli bir tarih giriniz' },
          { status: 400, headers }
        );
      }
      updateData.date = new Date(data.date);
    } else if (data.date === null) {
      updateData.date = null;
    }

    // Update isActive if provided
    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive değeri boolean olmalıdır' },
          { status: 400, headers }
        );
      }
      updateData.isActive = data.isActive;
    }

    // Update order if provided
    if (data.order !== undefined) {
      if (typeof data.order !== 'number') {
        return NextResponse.json(
          { error: 'order değeri sayı olmalıdır' },
          { status: 400, headers }
        );
      }
      updateData.order = data.order;
    }

    logger.info('Updating certificate', { id });

    const certificate = await prisma.certificate.update({
      where: { id },
      data: updateData,
    });

    logger.info('Certificate updated successfully', { id });

    return NextResponse.json(certificate, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update certificate', { error: errorMessage });
    return NextResponse.json(
      { error: 'Sertifika güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete certificate (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized certificate delete attempt');
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

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: 'Sertifika bulunamadı' },
        { status: 404, headers }
      );
    }

    logger.info('Deleting certificate', { id, title: existingCertificate.title });

    await prisma.certificate.delete({
      where: { id },
    });

    logger.info('Certificate deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Sertifika başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete certificate', { error: errorMessage });
    return NextResponse.json(
      { error: 'Sertifika silinemedi' },
      { status: 500, headers }
    );
  }
}
