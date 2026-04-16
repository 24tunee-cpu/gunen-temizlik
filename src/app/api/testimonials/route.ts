/**
 * @fileoverview Testimonials API Route
 * @description Müşteri yorumları CRUD API endpoint'i.
 * GET (public), POST/PUT/DELETE (admin only) operasyonları.
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır
 * - POST/PUT/DELETE: Admin authentication required (JWT)
 * - Input sanitization (XSS koruması)
 * - Rating validasyonu (1-5 arası)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/referanslar sayfası tarafından kullanılır.
 * Yorumlar admin panelden yönetilir (CRUD operasyonları).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

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

/** Max requests per window: 60 (1 per second) */
const MAX_REQUESTS = 60;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Public endpoint
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
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
// VALIDATION HELPERS
// ============================================

/**
 * Validate rating value
 * @param rating Rating value to validate
 * @returns Valid rating (1-5)
 */
function validateRating(rating: unknown): number {
  const numRating = typeof rating === 'number' ? rating : parseInt(String(rating), 10);

  if (isNaN(numRating) || numRating < MIN_RATING || numRating > MAX_RATING) {
    return DEFAULT_RATING;
  }

  return numRating;
}

/**
 * Validate required string field
 * @param value Value to validate
 * @param fieldName Field name for error message
 * @returns Validation result
 */
function validateRequiredString(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { valid: false, error: `${fieldName} zorunludur` };
  }

  if (value.length > 500) {
    return { valid: false, error: `${fieldName} çok uzun (maksimum 500 karakter)` };
  }

  return { valid: true };
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
 * GET handler - List all testimonials (public)
 * @returns JSON array of testimonials
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET testimonials', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    const isAdmin = token?.role === 'ADMIN';

    console.log('Fetching all testimonials', { ip, isAdmin });

    const testimonials = await prisma.testimonial.findMany({
      ...(isAdmin ? {} : { where: { isActive: true } }),
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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

    console.log(`Retrieved ${testimonials.length} testimonials`);

    return NextResponse.json(testimonials, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch testimonials', { error: errorMessage, ip });

    return NextResponse.json(
      { error: 'Referanslar yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new testimonial (admin only)
 * @param request NextRequest object
 * @returns Created testimonial JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, location, rating, content, avatar, service, isActive, order } = body;

    // Validation using helper functions
    const nameValidation = validateRequiredString(name, 'İsim');
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error || 'İsim zorunludur' }, { status: 400, headers });
    }

    const contentValidation = validateRequiredString(content, 'İçerik');
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error || 'İçerik zorunludur' }, { status: 400, headers });
    }

    // Validate and sanitize rating
    const validatedRating = validateRating(rating);

    console.log('Creating new testimonial', { name });

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name as string);
    const sanitizedContent = sanitizeInput(content as string);
    const sanitizedLocation = location && typeof location === 'string' ? sanitizeInput(location) : null;
    const sanitizedService = service && typeof service === 'string' ? sanitizeInput(service) : null;

    const testimonial = await prisma.testimonial.create({
      data: {
        name: sanitizedName || '',
        location: sanitizedLocation,
        rating: validatedRating,
        content: sanitizedContent || '',
        avatar: avatar && typeof avatar === 'string' ? avatar : null,
        service: sanitizedService,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    console.log('Testimonial created successfully', { id: testimonial.id });

    return NextResponse.json(testimonial, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create testimonial', { error: errorMessage });
    return NextResponse.json({ error: 'Referans oluşturulamadı' }, { status: 500, headers });
  }
}

/**
 * PUT handler - Update testimonial (admin only)
 * @param request NextRequest object
 * @returns Updated testimonial JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, name, location, rating, content, avatar, service, isActive, order } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID zorunludur' }, { status: 400, headers });
    }

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      const nameValidation = validateRequiredString(name, 'İsim');
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error || 'İsim zorunludur' }, { status: 400, headers });
      }
      updateData.name = sanitizeInput(name as string);
    }

    if (location !== undefined) {
      updateData.location = location && typeof location === 'string' ? sanitizeInput(location) : null;
    }

    if (rating !== undefined) {
      updateData.rating = validateRating(rating);
    }

    if (content !== undefined) {
      const contentValidation = validateRequiredString(content, 'İçerik');
      if (!contentValidation.valid) {
        return NextResponse.json({ error: contentValidation.error || 'İçerik zorunludur' }, { status: 400, headers });
      }
      updateData.content = sanitizeInput(content as string);
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar && typeof avatar === 'string' ? avatar : null;
    }

    if (service !== undefined) {
      updateData.service = service && typeof service === 'string' ? sanitizeInput(service) : null;
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update testimonial', { error: errorMessage });
    return NextResponse.json({ error: 'Referans güncellenemedi' }, { status: 500, headers });
  }
}

/**
 * DELETE handler - Delete testimonial (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    // Get ID from URL search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID zorunludur' }, { status: 400, headers });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete testimonial', { error: errorMessage });
    return NextResponse.json({ error: 'Referans silinemedi' }, { status: 500, headers });
  }
}
