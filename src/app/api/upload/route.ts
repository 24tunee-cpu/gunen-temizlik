/**
 * @fileoverview Upload API Route
 * @description Admin panel için güvenli dosya yükleme API endpoint'i.
 * Rate limiting, dosya validasyonu ve güvenlik kontrolleri ile.
 *
 * @security
 * - Admin authentication required (JWT token)
 * - Rate limiting: 10 requests per minute per IP
 * - File type validation (JPEG, PNG, GIF, WebP only)
 * - File size limit: 5MB
 * - Filename sanitization (path traversal protection)
 * - CORS headers for admin domain
 *
 * @admin-sync
 * Bu endpoint admin paneldeki medya yöneticisi tarafından kullanılır.
 * Yüklenen dosyalar /public/uploads klasöründe saklanır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { requireAdminAuth } from '@/lib/security';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */
const logger = createLogger('api/upload');

/** Allowed MIME types for upload */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/** Maximum file size: 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Upload directory path */
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 1 minute */
const RATE_LIMIT_WINDOW = 60 * 1000;

/** Max requests per window: 10 */
const MAX_REQUESTS = 10;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ADMIN_URL || 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
// UTILITY FUNCTIONS
// ============================================

/**
 * Sanitize filename to prevent path traversal attacks
 * @param filename Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const cleanName = filename
    .replace(/\.\./g, '') // Remove double dots
    .replace(/[<>:"|?*]/g, '') // Remove illegal characters
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/$/, ''); // Remove trailing slashes

  return cleanName;
}

/**
 * Get file extension from MIME type
 * @param mimeType MIME type
 * @returns File extension
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return extensionMap[mimeType] || 'jpg';
}

/**
 * Generate unique filename
 * @param mimeType File MIME type
 * @returns Unique filename
 */
function generateUniqueFilename(mimeType: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = getExtensionFromMimeType(mimeType);

  return `${timestamp}-${randomString}.${extension}`;
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
 * POST handler - Upload image (admin only)
 * @param request Next.js request object
 * @returns JSON response with upload result
 */
export async function POST(request: NextRequest) {
  // Apply CORS headers
  const headers = { ...CORS_HEADERS };

  // Get client IP
  const ip = getClientIp(request);

  // Rate limiting check
  if (checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded', { ip });
    return NextResponse.json(
      { error: 'Cok fazla istek. Lutfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    logger.warn('Unauthorized upload attempt', { ip });
    return authError;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya secilmedi' },
        { status: 400, headers }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      logger.warn('Invalid file type attempted', { type: file.type, ip });
      return NextResponse.json(
        {
          error: 'Gecersiz dosya turu. Sadece JPEG, PNG, GIF ve WebP dosyalari yuklenebilir.'
        },
        { status: 400, headers }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('File size exceeded', { size: file.size, ip });
      return NextResponse.json(
        {
          error: 'Dosya boyutu cok buyuk. Maksimum 5MB yukleyebilirsiniz.'
        },
        { status: 400, headers }
      );
    }

    // Validate file size is not zero
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Dosya bos olamaz' },
        { status: 400, headers }
      );
    }

    // Generate safe filename
    const fileName = generateUniqueFilename(file.type);

    // Ensure uploads directory exists
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true, mode: 0o755 });
      logger.info('Created uploads directory');
    }

    // Write file securely
    const filePath = path.join(UPLOADS_DIR, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer, { mode: 0o644 });

    logger.info('File uploaded successfully', {
      fileName,
      size: file.size,
      type: file.type,
      ip
    });

    // Return public URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      type: file.type,
    }, { headers });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to upload file', { error: errorMessage, ip });

    return NextResponse.json(
      { error: 'Dosya yuklenemedi. Lutfen tekrar deneyin.' },
      { status: 500, headers }
    );
  }
}
