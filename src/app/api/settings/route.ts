/**
 * @fileoverview Settings API Route (Extended)
 * @description Gelişmiş site ayarları API endpoint'i.
 * GET (public) - site ayarlarını okur, POST/PUT (admin only) - site ayarlarını günceller.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Maintenance mode support
 * - SEO settings management
 * - Admin authentication required for mutations
 *
 * @important
 * BU ENDPOINT api/site-settings/route.ts İLE ÇAKIŞIYOR!
 * Gelecekte birleştirme yapılmalıdır.
 *
 * @security
 * - GET: Public endpoint, rate limiting uygulanır
 * - POST/PUT: Admin authentication required (JWT)
 * - Maintenance mode kontrolü
 * - Input sanitization (XSS koruması)
 *
 * @admin-sync
 * Bu endpoint admin paneldeki /admin/ayarlar sayfası tarafından kullanılır.
 * Site başlığı, SEO ayarları, bakım modu vb. yönetilir.
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import { SITE_CONTACT } from '@/config/site-contact';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Default settings for first-time initialization */
const DEFAULT_SETTINGS = {
  siteName: 'Günen Temizlik',
  siteDescription: "İstanbul'un en güvenilir profesyonel temizlik şirketi",
  siteUrl: 'https://gunentemizlik.com',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  phone: SITE_CONTACT.phoneDisplay,
  email: SITE_CONTACT.email,
  address: 'Ataşehir, İstanbul',
  workingHours: '7/24 Hizmet',
  whatsapp: SITE_CONTACT.whatsappDigits,
  facebook: 'https://facebook.com/gunentemizlik',
  instagram: 'https://instagram.com/gunentemizlik',
  twitter: '',
  linkedin: '',
  youtube: '',
  seoTitle: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi | 7/24",
  seoDescription: 'Profesyonel temizlik hizmetleri. İnşaat sonrası, ofis, ev temizliği, koltuk yıkama. 15+ yıl deneyim, 5000+ mutlu müşteri. Ücretsiz keşif!',
  seoKeywords: 'istanbul temizlik şirketi, profesyonel temizlik, ofis temizliği, inşaat sonrası temizlik, koltuk yıkama',
  ogImage: '/og-image.jpg',
  twitterHandle: '@gunentemizlik',
  canonicalUrl: 'https://gunentemizlik.com',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  robotsTxt: 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /\nSitemap: https://gunentemizlik.com/sitemap.xml',
  sitemapEnabled: true,
  maintenanceMode: false,
  customCss: '',
  customJs: '',
  promoBannerJson: null,
  trustBandItemsJson: null,
  messageTemplatesJson: null,
  marketingBannerVariant: 'A',
  consentPolicyVersion: '1',
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
 * Validate hex color format
 * @param color Color string to validate
 * @returns boolean - true if valid hex color
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
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
 * GET handler - Public endpoint for site settings
 * @param request NextRequest object
 * @returns Site settings JSON
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting for public endpoint
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on GET settings', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Fetching site settings', { ip });

    // Get or create settings
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.siteSettings.create({
        data: DEFAULT_SETTINGS,
      });
      console.log('Created default site settings');
    }

    // Check maintenance mode
    if (settings.maintenanceMode) {
      // Return limited settings during maintenance
      return NextResponse.json({
        siteName: settings.siteName,
        maintenanceMode: true,
        maintenanceMessage: 'Site bakım modunda. Lütfen daha sonra tekrar deneyin.',
      }, { headers });
    }

    // Return public settings (exclude sensitive data like GA ID, GTM ID, etc.)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteUrl: settings.siteUrl,
      logo: settings.logo,
      favicon: settings.favicon,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      workingHours: settings.workingHours,
      whatsapp: settings.whatsapp,
      facebook: settings.facebook,
      instagram: settings.instagram,
      twitter: settings.twitter,
      linkedin: settings.linkedin,
      youtube: settings.youtube,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      seoKeywords: settings.seoKeywords,
      ogImage: settings.ogImage,
      twitterHandle: settings.twitterHandle,
      canonicalUrl: settings.canonicalUrl,
      maintenanceMode: settings.maintenanceMode,
      sitemapEnabled: settings.sitemapEnabled,
      customCss: settings.customCss ?? '',
      promoBannerJson: settings.promoBannerJson ?? null,
      trustBandItemsJson: settings.trustBandItemsJson ?? null,
      marketingBannerVariant: settings.marketingBannerVariant ?? 'A',
      consentPolicyVersion: settings.consentPolicyVersion ?? '1',
    };

    return NextResponse.json(publicSettings, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching settings', { error: errorMessage, ip });
    return NextResponse.json({ error: 'Ayarlar yüklenemedi' }, { status: 500, headers });
  }
}

/**
 * POST handler - Update site settings (admin only)
 * @param request NextRequest object
 * @returns Updated settings JSON
 */
export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized site settings update attempt');
    return authError;
  }

  try {
    const body = await request.json();
    console.log('Updating site settings', { updatedFields: Object.keys(body) });

    // Validate color fields if provided
    if (body.primaryColor && !isValidHexColor(body.primaryColor)) {
      return NextResponse.json(
        { error: 'Geçersiz primaryColor formatı' },
        { status: 400, headers }
      );
    }
    if (body.secondaryColor && !isValidHexColor(body.secondaryColor)) {
      return NextResponse.json(
        { error: 'Geçersiz secondaryColor formatı' },
        { status: 400, headers }
      );
    }
    if (body.accentColor && !isValidHexColor(body.accentColor as string)) {
      return NextResponse.json(
        { error: 'Geçersiz accentColor formatı' },
        { status: 400, headers }
      );
    }

    // Get existing settings
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          ...DEFAULT_SETTINGS,
          ...sanitizeSettings(body),
        },
      });
      console.log('Created new site settings', { id: settings.id });
    } else {
      // Update existing settings
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: sanitizeSettings(body),
      });
      console.log('Updated site settings', { id: settings.id });
    }

    return NextResponse.json({
      success: true,
      message: 'Ayarlar güncellendi',
      settings,
    }, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating settings', { error: errorMessage });
    return NextResponse.json(
      { error: 'Ayarlar güncellenemedi' },
      { status: 500, headers }
    );
  }
}

/**
 * PUT handler - Full replacement of site settings (admin only)
 * @param request NextRequest object
 * @returns Updated settings JSON
 */
export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };

  // Admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) {
    console.warn('Unauthorized site settings replacement attempt');
    return authError;
  }

  try {
    const body = await request.json();
    console.log('Replacing all site settings');

    // Validate color fields if provided
    if (body.primaryColor && !isValidHexColor(body.primaryColor)) {
      return NextResponse.json(
        { error: 'Geçersiz primaryColor formatı' },
        { status: 400, headers }
      );
    }
    if (body.secondaryColor && !isValidHexColor(body.secondaryColor)) {
      return NextResponse.json(
        { error: 'Geçersiz secondaryColor formatı' },
        { status: 400, headers }
      );
    }
    if (body.accentColor && !isValidHexColor(body.accentColor as string)) {
      return NextResponse.json(
        { error: 'Geçersiz accentColor formatı' },
        { status: 400, headers }
      );
    }

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          ...DEFAULT_SETTINGS,
          ...sanitizeSettings(body),
        },
      });
      console.log('Created new site settings via PUT', { id: settings.id });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: sanitizeSettings(body),
      });
      console.log('Replaced site settings', { id: settings.id });
    }

    return NextResponse.json({
      success: true,
      message: 'Ayarlar güncellendi',
      settings,
    }, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error replacing settings', { error: errorMessage });
    return NextResponse.json(
      { error: 'Ayarlar güncellenemedi' },
      { status: 500, headers }
    );
  }
}

// Helper function to sanitize settings input
function sanitizeSettings(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const stringFields: { field: string; max: number }[] = [
    { field: 'siteName', max: 120 },
    { field: 'siteDescription', max: 500 },
    { field: 'siteUrl', max: 300 },
    { field: 'logo', max: 800 },
    { field: 'favicon', max: 800 },
    { field: 'primaryColor', max: 20 },
    { field: 'secondaryColor', max: 20 },
    { field: 'accentColor', max: 20 },
    { field: 'phone', max: 40 },
    { field: 'email', max: 120 },
    { field: 'address', max: 500 },
    { field: 'workingHours', max: 120 },
    { field: 'whatsapp', max: 500 },
    { field: 'facebook', max: 500 },
    { field: 'instagram', max: 500 },
    { field: 'twitter', max: 500 },
    { field: 'linkedin', max: 500 },
    { field: 'youtube', max: 500 },
    { field: 'seoTitle', max: 120 },
    { field: 'seoDescription', max: 320 },
    { field: 'seoKeywords', max: 500 },
    { field: 'ogImage', max: 800 },
    { field: 'twitterHandle', max: 80 },
    { field: 'canonicalUrl', max: 500 },
    { field: 'googleAnalyticsId', max: 80 },
    { field: 'googleTagManagerId', max: 80 },
    { field: 'facebookPixelId', max: 80 },
    { field: 'robotsTxt', max: 20000 },
    { field: 'customCss', max: 100000 },
    { field: 'customJs', max: 100000 },
  ];

  for (const { field, max } of stringFields) {
    if (data[field] !== undefined && typeof data[field] === 'string') {
      sanitized[field] = sanitizeInput(data[field] as string).slice(0, max);
    }
  }

  if (typeof data.sitemapEnabled === 'boolean') {
    sanitized.sitemapEnabled = data.sitemapEnabled;
  }
  if (typeof data.maintenanceMode === 'boolean') {
    sanitized.maintenanceMode = data.maintenanceMode;
  }

  return sanitized;
}
