/**
 * @fileoverview Single Team Member API Route (Dynamic)
 * @description Belirli bir ekip üyesi için ID bazlı CRUD operasyonları.
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
 * Bu endpoint admin paneldeki /admin/ekip sayfası tarafından kullanılır.
 * Tekil üye düzenleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/team/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Maximum string lengths */
const MAX_LENGTHS = {
  name: 100,
  role: 100,
  bio: 500,
  phone: 20,
  email: 100,
  linkedin: 200,
} as const;

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

/**
 * Validate required string field
 * @param value Value to validate
 * @param fieldName Field name for error message
 * @param maxLength Maximum allowed length
 * @returns Validation result
 */
function validateRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number
): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { valid: false, error: `${fieldName} zorunludur` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} çok uzun (maksimum ${maxLength} karakter)` };
  }

  return { valid: true };
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
 * GET handler - Fetch single team member (public: active only; admin: drafts too)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Single team member JSON
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET team/[id]', { ip });
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

    console.log('Fetching team member by ID', { id, ip });

    const member = await prisma.teamMember.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        bio: true,
        image: true,
        phone: true,
        email: true,
        linkedin: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Ekip üyesi bulunamadı' },
        { status: 404, headers }
      );
    }

    const secret =
      process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production';
    const token = await getToken({ req: request, secret });
    const isAdmin = token?.role === 'ADMIN';

    if (!member.isActive && !isAdmin) {
      return NextResponse.json(
        { error: 'Ekip üyesi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Team member retrieved successfully', { id });

    return NextResponse.json(member, { headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch team member', { error: errorMessage, ip });

    return NextResponse.json(
      { error: 'Ekip üyesi yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Update team member (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated team member JSON
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

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Ekip üyesi bulunamadı' },
        { status: 404, headers }
      );
    }

    const body = await request.json();

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const nameValidation = validateRequiredString(body.name, 'İsim', MAX_LENGTHS.name);
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error || 'İsim zorunludur' }, { status: 400, headers });
      }
      updateData.name = sanitizeInput(body.name as string);
    }

    const roleBody = body.role !== undefined ? body.role : body.position;
    if (roleBody !== undefined) {
      const roleValidation = validateRequiredString(roleBody, 'Pozisyon', MAX_LENGTHS.role);
      if (!roleValidation.valid) {
        return NextResponse.json({ error: roleValidation.error || 'Pozisyon zorunludur' }, { status: 400, headers });
      }
      updateData.role = sanitizeInput(roleBody as string);
    }

    if (body.bio !== undefined) {
      updateData.bio = body.bio && typeof body.bio === 'string' ? sanitizeInput(body.bio) : null;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone && typeof body.phone === 'string' ? body.phone.slice(0, MAX_LENGTHS.phone) : null;
    }

    if (body.email !== undefined) {
      updateData.email = body.email && typeof body.email === 'string' ? body.email.slice(0, MAX_LENGTHS.email) : null;
    }

    if (body.linkedin !== undefined) {
      updateData.linkedin = body.linkedin && typeof body.linkedin === 'string' ? body.linkedin.slice(0, MAX_LENGTHS.linkedin) : null;
    }

    if (body.image !== undefined) {
      updateData.image = body.image && typeof body.image === 'string' ? body.image : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined;
    }

    if (body.order !== undefined) {
      updateData.order = typeof body.order === 'number' ? body.order : undefined;
    }

    console.log('Updating team member', { id });

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    console.log('Team member updated successfully', { id });

    return NextResponse.json(member, { headers });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update team member', { error: errorMessage });
    return NextResponse.json(
      { error: 'Ekip üyesi güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete team member (admin only)
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

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Ekip üyesi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting team member', { id });

    await prisma.teamMember.delete({
      where: { id },
    });

    console.log('Team member deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Ekip üyesi başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete team member', { error: errorMessage });
    return NextResponse.json(
      { error: 'Ekip üyesi silinemedi' },
      { status: 500, headers }
    );
  }
}
