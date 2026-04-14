/**
 * @fileoverview Single Contact Request API Route (Dynamic)
 * @description Belirli bir iletişim talebi için ID bazlı operasyonlar.
 * PUT/DELETE (admin only) endpoint'leri - okundu durumu güncelleme ve silme.
 *
 * @architecture
 * - Dynamic Route Segment [id]
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Admin authentication required for all operations
 *
 * @security
 * - PUT/DELETE: Admin authentication required (JWT) - KRİTİK!
 * - Rate limiting uygulanır
 * - ID validasyonu
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/iletisim sayfası tarafından kullanılır.
 * İletişim taleplerini okundu olarak işaretleme ve silme işlemleri için kullanılır.
 * Not: Bu route /api/contact/route.ts'deki koleksiyon endpoint'i ile birlikte çalışır.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, requireAdminOnly } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit-log';
import { getToken } from 'next-auth/jwt';

const PIPELINE = new Set(['new', 'contacted', 'quoted', 'won', 'lost']);

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

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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
 * PUT handler - Update contact request read status (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Updated contact request JSON
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized contact request update attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on PUT contact/[id]', { ip });
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

    // Check if contact request exists
    const existingContact = await prisma.contactRequest.findUnique({
      where: { id },
      select: { id: true, read: true },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'İletişim talebi bulunamadı' },
        { status: 404, headers }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const data: Prisma.ContactRequestUpdateInput = {};

    if (body.read !== undefined) {
      if (typeof body.read !== 'boolean') {
        return NextResponse.json({ error: 'read boolean olmalıdır' }, { status: 400, headers });
      }
      data.read = body.read;
    }
    if (body.pipelineStatus !== undefined) {
      const ps = String(body.pipelineStatus);
      if (!PIPELINE.has(ps)) {
        return NextResponse.json({ error: 'Geçersiz pipeline durumu' }, { status: 400, headers });
      }
      data.pipelineStatus = ps;
    }
    if (body.internalNotes !== undefined) {
      if (body.internalNotes === null) data.internalNotes = null;
      else if (typeof body.internalNotes === 'string') {
        data.internalNotes = body.internalNotes.slice(0, 8000);
      } else {
        return NextResponse.json({ error: 'internalNotes metin veya null olmalı' }, { status: 400, headers });
      }
    }
    if (body.reminderAt !== undefined) {
      if (body.reminderAt === null) data.reminderAt = null;
      else if (typeof body.reminderAt === 'string') {
        const d = new Date(body.reminderAt);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Geçersiz reminderAt' }, { status: 400, headers });
        }
        data.reminderAt = d;
      } else {
        return NextResponse.json({ error: 'reminderAt ISO string veya null' }, { status: 400, headers });
      }
    }
    if (body.assignedUserId !== undefined) {
      if (body.assignedUserId === null || body.assignedUserId === '') {
        data.assignedUser = { disconnect: true };
      } else if (typeof body.assignedUserId === 'string') {
        const uid = body.assignedUserId;
        const u = await prisma.user.findFirst({
          where: { id: uid, role: { in: ['ADMIN', 'EDITOR'] } },
          select: { id: true },
        });
        if (!u) {
          return NextResponse.json({ error: 'Atanan kullanıcı bulunamadı' }, { status: 400, headers });
        }
        data.assignedUser = { connect: { id: uid } };
      } else {
        return NextResponse.json({ error: 'assignedUserId geçersiz' }, { status: 400, headers });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400, headers });
    }

    console.log('Updating contact request', { id, fields: Object.keys(data), ip });

    const contact = await prisma.contactRequest.update({
      where: { id },
      data,
      include: { assignedUser: { select: { id: true, name: true, email: true } } },
    });

    const secret = process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production';
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'contact.update',
      resource: 'ContactRequest',
      resourceId: id,
      metadata: { fields: Object.keys(data) },
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Talep güncellendi',
        contact,
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating contact request', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'İletişim talebi durumu güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * DELETE handler - Delete contact request (admin only)
 * @param request NextRequest object
 * @param params Route parameters with ID
 * @returns Success message JSON
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  const authError = await requireAdminOnly(request);
  if (authError) {
    console.warn('Unauthorized contact request delete attempt', { ip });
    return authError;
  }

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on DELETE contact/[id]', { ip });
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

    // Check if contact request exists before deleting
    const existingContact = await prisma.contactRequest.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'İletişim talebi bulunamadı' },
        { status: 404, headers }
      );
    }

    console.log('Deleting contact request', { id, name: existingContact.name, email: existingContact.email, ip });

    await prisma.contactRequest.delete({
      where: { id },
    });

    const secret = process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production';
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'contact.delete',
      resource: 'ContactRequest',
      resourceId: id,
      ip,
    });

    console.log('Contact request deleted successfully', { id });

    return NextResponse.json(
      {
        success: true,
        message: 'İletişim talebi başarıyla silindi',
      },
      { headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting contact request', { error: errorMessage, ip });
    return NextResponse.json(
      { error: 'İletişim talebi silinemedi' },
      { status: 500, headers }
    );
  }
}
