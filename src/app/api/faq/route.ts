/**
 * @fileoverview FAQ API Route
 * @description Sıkça Sorulan Sorular (FAQ) CRUD API endpoint'i.
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
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/sss sayfası tarafından kullanılır.
 * SSS öğeleri admin panelden yönetilir.
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
  question: 500,
  answer: 2000,
  category: 50,
} as const;

/** Default category */
const DEFAULT_CATEGORY = 'Genel';

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
 * GET handler - List all FAQs (public)
 * @param request NextRequest object
 * @returns FAQs JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET faq', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching all FAQs', { ip });

    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    console.log(`Retrieved ${faqs.length} FAQs`);

    return NextResponse.json(faqs, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch FAQs', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'SSS öğeleri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new FAQ (admin only)
 * @param request NextRequest object
 * @returns Created FAQ JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized FAQ create attempt');
    return authError;
  }

  try {
    const body = await request.json();

    // Validation
    if (!body.question || typeof body.question !== 'string' || body.question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Soru zorunludur' },
        { status: 400, headers }
      );
    }

    if (body.question.length > MAX_LENGTHS.question) {
      return NextResponse.json(
        { error: `Soru en fazla ${MAX_LENGTHS.question} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!body.answer || typeof body.answer !== 'string' || body.answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cevap zorunludur' },
        { status: 400, headers }
      );
    }

    if (body.answer.length > MAX_LENGTHS.answer) {
      return NextResponse.json(
        { error: `Cevap en fazla ${MAX_LENGTHS.answer} karakter olabilir` },
        { status: 400, headers }
      );
    }

    console.log('Creating new FAQ', { question: body.question.slice(0, 50) });

    const newFaq = await prisma.faq.create({
      data: {
        question: sanitizeInput(body.question),
        answer: sanitizeInput(body.answer),
        category: body.category && typeof body.category === 'string'
          ? sanitizeInput(body.category).slice(0, MAX_LENGTHS.category)
          : DEFAULT_CATEGORY,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    console.log('FAQ created successfully', { id: newFaq.id });

    return NextResponse.json(newFaq, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create FAQ', { error: errorMessage });
    return NextResponse.json(
      { error: 'SSS öğesi oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update FAQ (admin only)
 * @param request NextRequest object
 * @returns Updated FAQ JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized FAQ update attempt');
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

    // Check if FAQ exists
    const existingFaq = await prisma.faq.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { error: 'SSS öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    // Validate and update question if provided
    if (data.question !== undefined) {
      if (typeof data.question !== 'string' || data.question.trim().length === 0) {
        return NextResponse.json(
          { error: 'Soru zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.question.length > MAX_LENGTHS.question) {
        return NextResponse.json(
          { error: `Soru en fazla ${MAX_LENGTHS.question} karakter olabilir` },
          { status: 400, headers }
        );
      }
      updateData.question = sanitizeInput(data.question);
    }

    // Validate and update answer if provided
    if (data.answer !== undefined) {
      if (typeof data.answer !== 'string' || data.answer.trim().length === 0) {
        return NextResponse.json(
          { error: 'Cevap zorunludur' },
          { status: 400, headers }
        );
      }
      if (data.answer.length > MAX_LENGTHS.answer) {
        return NextResponse.json(
          { error: `Cevap en fazla ${MAX_LENGTHS.answer} karakter olabilir` },
          { status: 400, headers }
        );
      }
      updateData.answer = sanitizeInput(data.answer);
    }

    // Update category if provided
    if (data.category !== undefined) {
      updateData.category = data.category && typeof data.category === 'string'
        ? sanitizeInput(data.category).slice(0, MAX_LENGTHS.category)
        : DEFAULT_CATEGORY;
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

    console.log('Updating FAQ', { id });

    const faq = await prisma.faq.update({
      where: { id },
      data: updateData,
    });

    console.log('FAQ updated successfully', { id });

    return NextResponse.json(faq, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update FAQ', { error: errorMessage });
    return NextResponse.json(
      { error: 'SSS öğesi güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete FAQ (admin only)
 * @param request NextRequest object
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized FAQ delete attempt');
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

    // Check if FAQ exists
    const existingFaq = await prisma.faq.findUnique({
      where: { id },
      select: { id: true, question: true },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { error: 'SSS öğesi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting FAQ', { id, question: existingFaq.question.slice(0, 50) });

    await prisma.faq.delete({
      where: { id },
    });

    console.log('FAQ deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'SSS öğesi başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete FAQ', { error: errorMessage });
    return NextResponse.json(
      { error: 'SSS öğesi silinemedi' },
      { status: 500, headers }
    );
  }
}
