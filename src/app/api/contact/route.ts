/**
 * @fileoverview Contact API Route
 * @description İletişim formu ve iletişim talepleri yönetimi API endpoint'i.
 * POST (public) - yeni iletişim talebi, GET (admin only) - talep listesi.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Honeypot spam protection
 * - Admin authentication for list access
 *
 * @security
 * - POST: Public endpoint, rate limiting (3 req/5min), honeypot protection
 * - GET: Admin authentication required (JWT) - KRİTİK! Hassas veriler!
 * - Email/phone validation
 * - Input sanitization (XSS koruması)
 * - Spam bot protection (honeypot fields)
 *
 * @admin-sync
 * POST: Front-end /iletisim sayfasındaki form tarafından kullanılır.
 * GET: Admin paneldeki /admin/iletisim sayfası tarafından kullanılır.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAdminAuth,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
} from '@/lib/security';
// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window for POST: 5 minutes */
const RATE_LIMIT_WINDOW_POST = 5 * 60 * 1000;

/** Max requests per window for POST: 3 */
const MAX_REQUESTS_POST = 3;

/** Rate limit window for GET: 1 minute */
const RATE_LIMIT_WINDOW_GET = 60 * 1000;

/** Max requests per window for GET: 30 */
const MAX_REQUESTS_GET = 30;

/** Maximum field lengths */
const MAX_LENGTHS = {
  name: 100,
  email: 200,
  phone: 20,
  message: 2000,
  service: 50,
} as const;

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
 * @param window Time window in milliseconds
 * @returns boolean - true if rate limited
 */
function checkRateLimit(ip: string, maxRequests: number, window: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];

  // Filter out old timestamps outside the window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < window
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

function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
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
 * GET handler - List all contact requests (admin only)
 * @param request NextRequest object
 * @returns Contact requests JSON array
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  try {
    const authError = await requireAdminAuth(request);
    if (authError) {
      console.warn('Unauthorized contact requests list attempt', { ip });
      return authError;
    }
  } catch (authErr) {
    const msg = authErr instanceof Error ? authErr.message : String(authErr);
    console.error('Auth failed in GET /api/contact', { ip, error: msg });
    return NextResponse.json(
      { error: 'Yetkilendirme başarısız oldu' },
      { status: 500, headers }
    );
  }

  // Rate limiting
  if (checkRateLimit(ip, MAX_REQUESTS_GET, RATE_LIMIT_WINDOW_GET)) {
    console.warn('Rate limit exceeded on GET contact', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching contact requests', { ip });

    // İlişkiyi ayrı çekiyoruz: MongoDB’de bozuk/uyumsuz assignedUserId Prisma include’da 500 üretebiliyor.
    let rows: Array<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      service: string | null;
      message: string;
      read: boolean;
      pipelineStatus: string;
      internalNotes: string | null;
      reminderAt: Date | null;
      assignedUserId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    try {
      rows = await prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          service: true,
          message: true,
          read: true,
          pipelineStatus: true,
          internalNotes: true,
          reminderAt: true,
          assignedUserId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (queryError) {
      // Bazı legacy kayıtlarda bozuk ObjectId alanları bulunabiliyor.
      // Listeyi tamamen düşürmek yerine assignee alanını yok sayıp kayıtları yine döndürelim.
      console.warn('Contact list primary query failed, retrying without assignee field', {
        ip,
        error: queryError instanceof Error ? queryError.message : String(queryError),
      });

      const fallbackRows = await prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          service: true,
          message: true,
          read: true,
          pipelineStatus: true,
          internalNotes: true,
          reminderAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      rows = fallbackRows.map((row) => ({ ...row, assignedUserId: null }));
    }

    const assigneeIds = [
      ...new Set(
        rows
          .map((r) => r.assignedUserId)
          .filter((id): id is string => typeof id === 'string')
          .filter((id) => isMongoObjectId(id))
      ),
    ];
    // Bazı legacy kayıtlar assignedUserId alanında bozuk değer barındırabiliyor.
    // Bu durumda `prisma.user.findMany` adımı 500 döndürebiliyor; listeyi kırmamak için burada güvenli fallback yapıyoruz.
    let assignees:
      | Array<{
          id: string;
          name: string | null;
          email: string | null;
        }>
      | [] = [];

    if (assigneeIds.length > 0) {
      try {
        assignees = await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true, email: true },
        });
      } catch (assigneeError) {
        console.warn('Assignees fetch failed, returning contacts without assignee', {
          ip,
          error: assigneeError instanceof Error ? assigneeError.message : String(assigneeError),
        });
        assignees = [];
      }
    }
    const byId = new Map(assignees.map((u) => [u.id, u]));

    const contacts = rows.map((r) => ({
      ...r,
      assignedUser: r.assignedUserId ? byId.get(r.assignedUserId) ?? null : null,
    }));

    console.log(`Retrieved ${contacts.length} contact requests`);

    return NextResponse.json(contacts, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch contact requests', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'İletişim talepleri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new contact request (public)
 * @param request NextRequest object
 * @returns Created contact request JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint (3 requests per 5 minutes)
  if (checkRateLimit(ip, MAX_REQUESTS_POST, RATE_LIMIT_WINDOW_POST)) {
    console.warn('Rate limit exceeded on POST contact', { ip });
    return NextResponse.json(
      { error: 'Çok fazla mesaj gönderdiniz. Lütfen 5 dakika sonra tekrar deneyin.' },
      { status: 429, headers }
    );
  }

  try {
    const data = await request.json();

    // Honeypot spam protection
    if (data.website || data.honeypot) {
      console.warn('Honeypot triggered - potential spam bot', { ip, email: data.email });
      return NextResponse.json(
        { error: 'Spam tespit edildi' },
        { status: 400, headers }
      );
    }

    // Validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'İsim zorunludur' },
        { status: 400, headers }
      );
    }

    if (data.name.length > MAX_LENGTHS.name) {
      return NextResponse.json(
        { error: `İsim en fazla ${MAX_LENGTHS.name} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
      return NextResponse.json(
        { error: 'E-posta adresi zorunludur' },
        { status: 400, headers }
      );
    }

    if (data.email.length > MAX_LENGTHS.email) {
      return NextResponse.json(
        { error: 'E-posta adresi çok uzun' },
        { status: 400, headers }
      );
    }

    if (!isValidEmail(data.email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400, headers }
      );
    }

    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mesaj zorunludur' },
        { status: 400, headers }
      );
    }

    if (data.message.length > MAX_LENGTHS.message) {
      return NextResponse.json(
        { error: `Mesaj en fazla ${MAX_LENGTHS.message} karakter olabilir` },
        { status: 400, headers }
      );
    }

    if (data.phone && typeof data.phone === 'string') {
      if (data.phone.length > MAX_LENGTHS.phone) {
        return NextResponse.json(
          { error: 'Telefon numarası çok uzun' },
          { status: 400, headers }
        );
      }
      if (!isValidPhone(data.phone)) {
        return NextResponse.json(
          { error: 'Geçerli bir telefon numarası giriniz' },
          { status: 400, headers }
        );
      }
    }

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email.toLowerCase().trim()),
      phone: data.phone && typeof data.phone === 'string'
        ? sanitizeInput(data.phone)
        : '',
      service: data.service && typeof data.service === 'string'
        ? sanitizeInput(data.service).slice(0, MAX_LENGTHS.service)
        : 'Genel',
      message: sanitizeInput(data.message),
    };

    console.log('Creating new contact request', { email: sanitizedData.email, ip });

    const newContact = await prisma.contactRequest.create({
      data: {
        ...sanitizedData,
        read: false,
      },
    });

    console.log('Contact request created successfully', { id: newContact.id, email: sanitizedData.email });

    return NextResponse.json(
      {
        success: true,
        message: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.',
        contact: newContact,
      },
      { status: 201, headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create contact request', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.' },
      { status: 500, headers }
    );
  }
}
