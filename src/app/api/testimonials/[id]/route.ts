/**
 * @fileoverview Single Testimonial API Route (Dynamic)
 * @description Belirli bir müşteri yorumu için ID bazlı CRUD operasyonları.
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
 * Bu endpoint admin paneldeki /admin/referanslar sayfası tarafından kullanılır.
 * Tekil yorum düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/testimonials/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Minimum rating değeri */
const MIN_RATING = 1;

/** Maximum rating değeri */
const MAX_RATING = 5;

/** Default rating değeri */
const DEFAULT_RATING = 5;

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
 * Validate rating value
 * @param rating Rating value to validate
 * @returns Valid rating (1-5)
 */
function validateRating(rating: unknown): number {
  const numRating =
    typeof rating === 'number' ? rating : parseInt(String(rating), 10);

  if (isNaN(numRating) || numRating < MIN_RATING || numRating > MAX_RATING) {
    return DEFAULT_RATING;
  }

  return numRating;
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
 * GET handler - Fetch single testimonial (public)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single testimonial JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET testimonial/[id]', { ip });
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

    console.log('Fetching testimonial by ID', { id, ip });

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        rating: true,
        content: true,
        avatar: true,
        service: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Referans bulunamadı' },
        { status: 404, headers }
      );
    }

    // Only return active testimonials for public endpoint
    if (!testimonial.isActive) {
      return NextResponse.json(
        { error: 'Referans bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Testimonial retrieved successfully', { id });

    return NextResponse.json(testimonial, { headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch testimonial', { error: errorMessage, ip });

    return NextResponse.json(
      { error: 'Referans yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update testimonial (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated testimonial JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Validate ID
    if (!validateId(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID formatı' },
        { status: 400, headers }
      );
    }

    const body = await request.json();
    const { name, location, rating, content, avatar, service, isActive, order } =
      body;

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Referans bulunamadı' },
        { status: 404, headers }
      );
    }

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'İsim zorunludur' },
          { status: 400, headers }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'İsim çok uzun (maksimum 100 karakter)' },
          { status: 400, headers }
        );
      }
      updateData.name = sanitizeInput(name);
    }

    if (location !== undefined) {
      updateData.location =
        location && typeof location === 'string'
          ? sanitizeInput(location)
          : null;
    }

    if (rating !== undefined) {
      updateData.rating = validateRating(rating);
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'İçerik zorunludur' },
          { status: 400, headers }
        );
      }
      if (content.length > 1000) {
        return NextResponse.json(
          { error: 'İçerik çok uzun (maksimum 1000 karakter)' },
          { status: 400, headers }
        );
      }
      updateData.content = sanitizeInput(content);
    }

    if (avatar !== undefined) {
      updateData.avatar =
        avatar && typeof avatar === 'string' ? avatar : null;
    }

    if (service !== undefined) {
      updateData.service =
        service && typeof service === 'string' ? sanitizeInput(service) : null;
    }

    if (isActive !== undefined) {
      updateData.isActive = typeof isActive === 'boolean' ? isActive : undefined;
    }

    if (order !== undefined) {
      updateData.order = typeof order === 'number' ? order : undefined;
    }

    console.log('Updating testimonial', { id });

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    });

    console.log('Testimonial updated successfully', { id });

    return NextResponse.json(testimonial, { headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update testimonial', { error: errorMessage });
    return NextResponse.json(
      { error: 'Referans güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete testimonial (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Validate ID
    if (!validateId(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID formatı' },
        { status: 400, headers }
      );
    }

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Referans bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting testimonial', { id });

    await prisma.testimonial.delete({
      where: { id },
    });

    console.log('Testimonial deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Referans başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete testimonial', { error: errorMessage });
    return NextResponse.json(
      { error: 'Referans silinemedi' },
      { status: 500, headers }
    );
  }
}

