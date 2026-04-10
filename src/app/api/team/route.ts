/**
 * @fileoverview Team API Route
 * @description Ekip üyeleri CRUD API endpoint'i.
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
 * - String length validasyonu
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/ekip sayfası tarafından kullanılır.
 * Ekip üyeleri admin panelden yönetilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */
const logger = createLogger('api/team');

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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
 * GET handler - List all team members (public)
 * @param request NextRequest object
 * @returns JSON array of team members
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded on GET team', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    logger.info('Fetching all team members', { ip });

    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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

    logger.info(`Retrieved ${members.length} team members`);

    return NextResponse.json(members, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch team members', { error: errorMessage, ip });

    return NextResponse.json(
      { error: 'Ekip üyeleri yüklenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * POST handler - Create new team member (admin only)
 * @param request NextRequest object
 * @returns Created team member JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validation using helper functions
    const nameValidation = validateRequiredString(body.name, 'İsim', MAX_LENGTHS.name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error || 'İsim zorunludur' }, { status: 400, headers });
    }

    const roleValidation = validateRequiredString(body.role, 'Pozisyon', MAX_LENGTHS.role);
    if (!roleValidation.valid) {
      return NextResponse.json({ error: roleValidation.error || 'Pozisyon zorunludur' }, { status: 400, headers });
    }

    logger.info('Creating new team member', { name: body.name });

    // Sanitize inputs
    const sanitizedName = sanitizeInput(body.name as string);
    const sanitizedRole = sanitizeInput(body.role as string);
    const sanitizedBio = body.bio && typeof body.bio === 'string' ? sanitizeInput(body.bio) : null;
    const sanitizedPhone = body.phone && typeof body.phone === 'string' ? body.phone.slice(0, MAX_LENGTHS.phone) : null;
    const sanitizedEmail = body.email && typeof body.email === 'string' ? body.email.slice(0, MAX_LENGTHS.email) : null;
    const sanitizedLinkedin = body.linkedin && typeof body.linkedin === 'string' ? body.linkedin.slice(0, MAX_LENGTHS.linkedin) : null;

    const member = await prisma.teamMember.create({
      data: {
        name: sanitizedName || '',
        role: sanitizedRole || '',
        bio: sanitizedBio,
        image: body.image && typeof body.image === 'string' ? body.image : null,
        phone: sanitizedPhone,
        email: sanitizedEmail,
        linkedin: sanitizedLinkedin,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: typeof body.order === 'number' ? body.order : 0,
      },
    });

    logger.info('Team member created successfully', { id: member.id });

    return NextResponse.json(member, { status: 201, headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create team member', { error: errorMessage });
    return NextResponse.json({ error: 'Ekip üyesi oluşturulamadı' }, { status: 500, headers });
  }
}

/**
 * PUT handler - Update team member (admin only)
 * @param request NextRequest object
 * @returns Updated team member JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID zorunludur' }, { status: 400, headers });
    }

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Ekip üyesi bulunamadı' }, { status: 404, headers });
    }

    // Build update data dynamically with validation
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const nameValidation = validateRequiredString(data.name, 'İsim', MAX_LENGTHS.name);
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error || 'İsim zorunludur' }, { status: 400, headers });
      }
      updateData.name = sanitizeInput(data.name as string);
    }

    if (data.role !== undefined) {
      const roleValidation = validateRequiredString(data.role, 'Pozisyon', MAX_LENGTHS.role);
      if (!roleValidation.valid) {
        return NextResponse.json({ error: roleValidation.error || 'Pozisyon zorunludur' }, { status: 400, headers });
      }
      updateData.role = sanitizeInput(data.role as string);
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio && typeof data.bio === 'string' ? sanitizeInput(data.bio) : null;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone && typeof data.phone === 'string' ? data.phone.slice(0, MAX_LENGTHS.phone) : null;
    }

    if (data.email !== undefined) {
      updateData.email = data.email && typeof data.email === 'string' ? data.email.slice(0, MAX_LENGTHS.email) : null;
    }

    if (data.linkedin !== undefined) {
      updateData.linkedin = data.linkedin && typeof data.linkedin === 'string' ? data.linkedin.slice(0, MAX_LENGTHS.linkedin) : null;
    }

    if (data.image !== undefined) {
      updateData.image = data.image && typeof data.image === 'string' ? data.image : null;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = typeof data.isActive === 'boolean' ? data.isActive : undefined;
    }

    if (data.order !== undefined) {
      updateData.order = typeof data.order === 'number' ? data.order : undefined;
    }

    logger.info('Updating team member', { id });

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    logger.info('Team member updated successfully', { id });

    return NextResponse.json(member, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to update team member', { error: errorMessage });
    return NextResponse.json({ error: 'Ekip üyesi güncellenemedi' }, { status: 500, headers });
  }
}

/**
 * DELETE handler - Delete team member (admin only)
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

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Ekip üyesi bulunamadı' }, { status: 404, headers });
    }

    logger.info('Deleting team member', { id });

    await prisma.teamMember.delete({
      where: { id },
    });

    logger.info('Team member deleted successfully', { id });

    return NextResponse.json(
      { success: true, message: 'Ekip üyesi başarıyla silindi' },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete team member', { error: errorMessage });
    return NextResponse.json({ error: 'Ekip üyesi silinemedi' }, { status: 500, headers });
  }
}
