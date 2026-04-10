/**
 * @fileoverview Site Settings API Route
 * @description Site genel ayarları yönetimi API endpoint'i.
 * GET (public) - site ayarlarını okur, PUT (admin only) - site ayarlarını günceller.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Auto-creation of default settings if not exists
 * - Admin authentication required for mutations
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır
 * - PUT: Admin authentication required (JWT) - KRİTİK!
 * - Input validation and sanitization
 * - Whitelist-based field validation
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/ayarlar sayfası tarafından kullanılır.
 * Site başlığı, renkler, iletişim bilgileri vb. ayarlar admin panelden yönetilir.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Default site settings */
const DEFAULT_SETTINGS = {
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  phone: '0555 123 45 67',
  email: 'info@gunentemizlik.com',
  address: 'İstanbul, Türkiye',
  workingHours: 'Pzt-Cmt: 08:00 - 20:00',
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: '',
  siteTitle: 'Günen Temizlik',
  siteDescription: 'İstanbul\'un önde gelen profesyonel temizlik şirketi',
  customCss: '',
  customJs: '',
} as const;

/** Valid settings fields whitelist */
const VALID_SETTINGS_FIELDS = [
  'primaryColor',
  'secondaryColor',
  'phone',
  'email',
  'address',
  'workingHours',
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'siteTitle',
  'siteDescription',
  'logo',
  'favicon',
  'customCss',
  'customJs',
] as const;

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 1 minute */
const RATE_LIMIT_WINDOW = 60 * 1000;

/** Max requests per window: 60 */
const MAX_REQUESTS = 60;

/** Maximum string lengths for settings fields */
const MAX_LENGTHS: Record<string, number> = {
  phone: 20,
  email: 100,
  address: 200,
  workingHours: 50,
  facebook: 200,
  instagram: 200,
  twitter: 200,
  linkedin: 200,
  siteTitle: 100,
  siteDescription: 200,
  logo: 500,
  favicon: 500,
  customCss: 10000,  // 10KB CSS kodu
  customJs: 10000,  // 10KB JavaScript kodu
};

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================
// TYPES
// ============================================

/** Site settings data type */
interface SiteSettingsData {
  primaryColor?: string;
  secondaryColor?: string;
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  siteTitle?: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  customCss?: string;
  customJs?: string;
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
 * Validate hex color format
 * @param color Color string to validate
 * @returns boolean - true if valid hex color
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate email format
 * @param email Email string to validate
 * @returns boolean - true if valid email
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize and validate settings data
 * @param data Raw settings data from request
 * @returns Sanitized settings data
 * @throws Error if validation fails
 */
function sanitizeSettingsData(data: Record<string, unknown>): SiteSettingsData {
  const sanitized: SiteSettingsData = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip invalid fields (whitelist check)
    if (!VALID_SETTINGS_FIELDS.includes(key as typeof VALID_SETTINGS_FIELDS[number])) {
      console.warn('Invalid settings field attempted', { field: key });
      continue;
    }

    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Ensure value is string
    if (typeof value !== 'string') {
      throw new Error(`Invalid type for field "${key}". Expected string.`);
    }

    // Validate and sanitize based on field type
    switch (key) {
      case 'primaryColor':
      case 'secondaryColor':
        if (!isValidHexColor(value)) {
          throw new Error(`Invalid hex color format for "${key}"`);
        }
        sanitized[key as keyof SiteSettingsData] = value.toLowerCase();
        break;

      case 'email':
        if (value && !isValidEmail(value)) {
          throw new Error('Invalid email format');
        }
        sanitized[key] = sanitizeInput(value);
        break;

      case 'phone':
        // Allow only numbers, spaces, +, -, (, )
        if (!/^[\d\s\+\-\(\)]+$/.test(value)) {
          throw new Error('Invalid phone number format');
        }
        sanitized[key] = value.slice(0, MAX_LENGTHS.phone);
        break;

      default:
        // General string sanitization with length limit
        const maxLength = MAX_LENGTHS[key] || 500;
        sanitized[key as keyof SiteSettingsData] = sanitizeInput(value).slice(0, maxLength);
    }
  }

  return sanitized;
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
 * GET handler - Fetch site settings (public)
 * @param request NextRequest object
 * @returns Site settings JSON
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET site-settings', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching site settings', { ip });

    let settings = await prisma.siteSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      console.log('Creating default site settings');
      settings = await prisma.siteSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    console.log('Site settings retrieved successfully');

    return NextResponse.json(settings, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch site settings', { error: errorMessage, ip });

    // Return default settings on error
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200, headers });
  }
}

/**
 * PUT handler - Update site settings (admin only)
 * @param request NextRequest object
 * @returns Updated site settings JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication - KRİTİK GÜVENLİK KONTROLÜ!
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized site settings update attempt');
    return authError;
  }

  try {
    const body = await request.json();

    console.log('Updating site settings', { fields: Object.keys(body) });

    // Validate and sanitize input data
    let sanitizedData: SiteSettingsData;
    try {
      sanitizedData = sanitizeSettingsData(body);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Validation failed';
      console.warn('Site settings validation failed', { error: message });
      return NextResponse.json(
        { error: message },
        { status: 400, headers }
      );
    }

    // Check if settings exist
    const existing = await prisma.siteSettings.findFirst();

    let settings;
    if (existing) {
      // Update existing settings
      settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: sanitizedData,
      });
      console.log('Site settings updated successfully', { id: existing.id });
    } else {
      // Create new settings with defaults + provided data
      settings = await prisma.siteSettings.create({
        data: { ...DEFAULT_SETTINGS, ...sanitizedData },
      });
      console.log('Site settings created successfully', { id: settings.id });
    }

    return NextResponse.json(settings, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update site settings', { error: errorMessage });
    return NextResponse.json(
      { error: 'Site ayarları güncellenemedi' },
      { status: 500, headers }
    );
  }
}
