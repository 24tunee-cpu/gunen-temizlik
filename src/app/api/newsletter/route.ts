/**
 * @fileoverview Newsletter API Route
 * @description E-bülten abonelik yönetimi API endpoint'i.
 * POST (public) - yeni abonelik, GET (admin only) - abone listesi.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Email validation and duplicate prevention
 * - Admin authentication for list access
 *
 * @security
 * - POST: Public endpoint, rate limiting (10 req/min), email validation
 * - GET: Admin authentication required (JWT) - KRİTİK!
 * - Email format validation (RFC 5322)
 * - Duplicate email prevention
 * - Input sanitization (XSS koruması)
 *
 * @admin-sync
 * POST: Front-end footer/newsletter formu tarafından kullanılır.
 * GET: Admin paneldeki /admin/aboneler sayfası tarafından kullanılır.
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

/** Max requests per window for POST: 10 */
const MAX_REQUESTS_POST = 10;

/** Max requests per window for GET: 30 */
const MAX_REQUESTS_GET = 30;

/** Maximum name length */
const MAX_NAME_LENGTH = 100;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check rate limit for IP address
 * @param ip Client IP address
 * @param maxRequests Max requests allowed
 * @returns boolean - true if rate limited
 */
function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out old timestamps outside the window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if limit exceeded
  if (validTimestamps.length >= maxRequests) {
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
 * Validate email format (RFC 5322 simplified)
 * @param email Email to validate
 * @returns boolean - true if valid
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize and validate subscriber data
 * @param data Raw subscriber data
 * @returns Sanitized data and validation result
 */
function validateSubscriberData(data: Record<string, unknown>): {
  valid: boolean;
  error?: string;
  sanitized?: { email: string; name: string | null };
} {
  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: 'E-posta adresi zorunludur' };
  }

  const email = data.email.trim().toLowerCase();

  if (email.length === 0) {
    return { valid: false, error: 'E-posta adresi zorunludur' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'E-posta adresi çok uzun' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: 'Geçerli bir e-posta adresi giriniz' };
  }

  // Validate and sanitize name (optional)
  let name: string | null = null;
  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== 'string') {
      return { valid: false, error: 'İsim metin formatında olmalıdır' };
    }

    const trimmedName = data.name.trim();

    if (trimmedName.length > 0) {
      if (trimmedName.length > MAX_NAME_LENGTH) {
        return { valid: false, error: `İsim en fazla ${MAX_NAME_LENGTH} karakter olabilir` };
      }
      name = sanitizeInput(trimmedName);
    }
  }

  return {
    valid: true,
    sanitized: { email: sanitizeInput(email), name },
  };
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
 * GET handler - List all subscribers (admin only)
 * @param request NextRequest object
 * @returns Subscribers list JSON
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized newsletter subscribers list attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip, MAX_REQUESTS_GET)) {
    console.warn('Rate limit exceeded on GET newsletter', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching newsletter subscribers', { ip });

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`Retrieved ${subscribers.length} subscribers`);

    return NextResponse.json(subscribers, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching newsletter subscribers', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Abone listesi yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Subscribe to newsletter (public)
 * @param request NextRequest object
 * @returns Created subscriber JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip, MAX_REQUESTS_POST)) {
    console.warn('Rate limit exceeded on POST newsletter', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    const body = await request.json();

    console.log('New newsletter subscription attempt', { ip });

    // Validate and sanitize input
    const validation = validateSubscriberData(body);
    if (!validation.valid) {
      console.warn('Invalid newsletter subscription data', { error: validation.error, ip });
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers }
      );
    }

    const { email, name } = validation.sanitized!;

    // Check for duplicate email
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      // If subscriber exists but is inactive, reactivate them
      if (!existingSubscriber.isActive) {
        const updated = await prisma.subscriber.update({
          where: { email },
          data: { isActive: true },
        });
        console.log('Reactivated existing subscriber', { email, ip });
        return NextResponse.json(
          {
            success: true,
            message: 'Aboneliğiniz yeniden aktif edildi!',
            subscriber: updated,
          },
          { status: 200, headers }
        );
      }

      // Already subscribed and active
      console.log('Duplicate subscription attempt', { email, ip });
      return NextResponse.json(
        {
          success: true,
          message: 'Bu e-posta adresi zaten abone!',
          subscriber: existingSubscriber,
        },
        { status: 200, headers }
      );
    }

    // Create new subscriber
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        name,
        isActive: true,
      },
    });

    console.log('New subscriber created successfully', { email, ip });

    return NextResponse.json(
      {
        success: true,
        message: 'Bülten aboneliğiniz başarıyla oluşturuldu!',
        subscriber,
      },
      { status: 201, headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating newsletter subscription', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Abonelik oluşturulamadı. Lütfen tekrar deneyin.' },
      { status: 500, headers }
    );
  }
}
