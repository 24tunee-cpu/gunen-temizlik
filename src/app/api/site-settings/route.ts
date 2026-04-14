/**
 * @fileoverview Site Settings API (admin + public-safe GET)
 * @description Prisma `SiteSettings` ile uyumlu tek kaynak. Admin PUT tam güncelleme;
 * GET: yönetici oturumunda tüm alanlar, aksi halde yalnızca site /api/settings ile uyumlu güvenli alt küme.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import type { SiteSettings as SiteSettingsRow } from '@prisma/client';
import { SITE_CONTACT } from '@/config/site-contact';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 60;

const DEFAULT_ROBOTS = `User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /
Sitemap: https://gunentemizlik.com/sitemap.xml`;

/** Prisma create için varsayılanlar (şema ile birebir) */
function defaultCreateData(): Omit<SiteSettingsRow, 'id' | 'updatedAt'> {
  return {
    siteName: 'Günen Temizlik',
    siteDescription: "İstanbul'un güvenilir profesyonel temizlik şirketi",
    siteUrl: 'https://gunentemizlik.com',
    logo: null,
    favicon: '/favicon.ico',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    phone: SITE_CONTACT.phoneDisplay,
    email: SITE_CONTACT.email,
    address: 'İstanbul, Türkiye',
    workingHours: '7/24 Hizmet',
    whatsapp: SITE_CONTACT.whatsappDigits,
    facebook: null,
    instagram: null,
    twitter: null,
    linkedin: null,
    youtube: null,
    seoTitle: 'Günen Temizlik | Profesyonel Temizlik Hizmetleri',
    seoDescription:
      'Ev, ofis ve endüstriyel temizlik. Profesyonel ekip, şeffaf fiyat, memnuniyet garantisi.',
    seoKeywords: 'temizlik, ofis temizliği, ev temizliği, istanbul temizlik',
    ogImage: '/og-image.jpg',
    twitterHandle: '@gunentemizlik',
    canonicalUrl: 'https://gunentemizlik.com',
    googleAnalyticsId: null,
    googleTagManagerId: null,
    facebookPixelId: null,
    robotsTxt: DEFAULT_ROBOTS,
    sitemapEnabled: true,
    maintenanceMode: false,
    customCss: null,
    customJs: null,
    promoBannerJson: null,
    trustBandItemsJson: null,
    messageTemplatesJson: null,
    marketingBannerVariant: 'A',
    consentPolicyVersion: '1',
  };
}

const STRING_FIELDS = [
  'siteName',
  'siteDescription',
  'siteUrl',
  'logo',
  'favicon',
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'phone',
  'email',
  'address',
  'workingHours',
  'whatsapp',
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'youtube',
  'seoTitle',
  'seoDescription',
  'seoKeywords',
  'ogImage',
  'twitterHandle',
  'canonicalUrl',
  'googleAnalyticsId',
  'googleTagManagerId',
  'facebookPixelId',
  'robotsTxt',
  'customCss',
  'customJs',
] as const;

const MAX_LEN: Record<string, number> = {
  siteName: 120,
  siteDescription: 500,
  siteUrl: 300,
  logo: 800,
  favicon: 800,
  phone: 40,
  email: 120,
  address: 500,
  workingHours: 120,
  whatsapp: 40,
  facebook: 500,
  instagram: 500,
  twitter: 500,
  linkedin: 500,
  youtube: 500,
  seoTitle: 120,
  seoDescription: 320,
  seoKeywords: 500,
  ogImage: 800,
  twitterHandle: 80,
  canonicalUrl: 500,
  googleAnalyticsId: 80,
  googleTagManagerId: 80,
  facebookPixelId: 80,
  robotsTxt: 20000,
  customCss: 100000,
  customJs: 100000,
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (valid.length >= MAX_REQUESTS) return true;
  valid.push(now);
  rateLimitMap.set(ip, valid);
  return false;
}

function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)\.]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/** Ziyaretçi için hassas olmayan alanlar (/api/settings ile uyumlu + accent/linkedin/youtube) */
function publicSubset(row: SiteSettingsRow) {
  return {
    siteName: row.siteName,
    siteDescription: row.siteDescription,
    siteUrl: row.siteUrl,
    logo: row.logo,
    favicon: row.favicon,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor,
    phone: row.phone,
    email: row.email,
    address: row.address,
    workingHours: row.workingHours,
    whatsapp: row.whatsapp,
    facebook: row.facebook,
    instagram: row.instagram,
    twitter: row.twitter,
    linkedin: row.linkedin,
    youtube: row.youtube,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    ogImage: row.ogImage,
    twitterHandle: row.twitterHandle,
    canonicalUrl: row.canonicalUrl,
    maintenanceMode: row.maintenanceMode,
    sitemapEnabled: row.sitemapEnabled,
    customCss: row.customCss ?? '',
  };
}

function sanitizeBody(body: Record<string, unknown>): Partial<SiteSettingsRow> {
  const out: Record<string, unknown> = {};

  for (const key of STRING_FIELDS) {
    const v = body[key];
    if (v === undefined) continue;
    if (v === null) {
      if (key === 'siteName' || key === 'email' || key === 'phone') {
        throw new Error('Zorunlu alanlar null olamaz');
      }
      (out as Record<string, string | null>)[key] = null;
      continue;
    }
    if (typeof v !== 'string') {
      throw new Error(`${key} metin olmalıdır`);
    }
    const trimmed = v.trim();
    if (trimmed === '') {
      if (key === 'siteName' || key === 'email' || key === 'phone') {
        throw new Error(
          key === 'siteName' ? 'Site adı zorunludur' : key === 'email' ? 'E-posta zorunludur' : 'Telefon zorunludur'
        );
      }
      (out as Record<string, string | null>)[key] = null;
      continue;
    }
    const max = MAX_LEN[key] ?? 2000;
    let s = sanitizeInput(trimmed).slice(0, max);

    if (key === 'primaryColor' || key === 'secondaryColor' || key === 'accentColor') {
      if (!isValidHex(s)) throw new Error(`Geçersiz renk: ${key}`);
      s = s.toLowerCase();
    }
    if (key === 'email' && !isValidEmail(s)) throw new Error('Geçersiz e-posta');
    if (key === 'phone' && !isValidPhone(s)) throw new Error('Geçersiz telefon (en az 10 rakam)');
    // whatsapp: numara veya wa.me linki — sadece uzunluk

    (out as Record<string, string>)[key] = s;
  }

  if (body.sitemapEnabled !== undefined) {
    if (typeof body.sitemapEnabled !== 'boolean') throw new Error('sitemapEnabled boolean olmalı');
    out.sitemapEnabled = body.sitemapEnabled;
  }
  if (body.maintenanceMode !== undefined) {
    if (typeof body.maintenanceMode !== 'boolean') throw new Error('maintenanceMode boolean olmalı');
    out.maintenanceMode = body.maintenanceMode;
  }

  return out as Partial<SiteSettingsRow>;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);
  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers });
  }

  try {
    const secret =
      process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production';
    const token = await getToken({ req: request, secret });
    const isAdmin = token?.role === 'ADMIN' || token?.role === 'EDITOR';

    let row = await prisma.siteSettings.findFirst();
    if (!row) {
      row = await prisma.siteSettings.create({ data: defaultCreateData() });
    }

    if (row.maintenanceMode && !isAdmin) {
      return NextResponse.json(
        {
          siteName: row.siteName,
          maintenanceMode: true,
          maintenanceMessage: 'Site bakım modunda. Lütfen daha sonra tekrar deneyin.',
        },
        { headers }
      );
    }

    if (isAdmin) {
      return NextResponse.json(row, { headers });
    }

    return NextResponse.json(publicSubset(row), { headers });
  } catch (e) {
    console.error('GET site-settings', e);
    return NextResponse.json({ error: 'Ayarlar yüklenemedi' }, { status: 500, headers });
  }
}

export async function PUT(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    let patch: Partial<SiteSettingsRow>;
    try {
      patch = sanitizeBody(body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Doğrulama hatası';
      return NextResponse.json({ error: msg }, { status: 400, headers });
    }

    const existing = await prisma.siteSettings.findFirst();
    const nextLogo =
      patch.logo !== undefined ? patch.logo : existing?.logo ?? null;
    let nextFavicon =
      patch.favicon !== undefined ? patch.favicon : existing?.favicon ?? '/favicon.ico';
    if (
      nextFavicon === null ||
      (typeof nextFavicon === 'string' && nextFavicon.trim() === '')
    ) {
      const fromLogo = nextLogo && String(nextLogo).trim();
      nextFavicon = fromLogo || '/favicon.ico';
    }
    patch = { ...patch, favicon: nextFavicon };

    let row: SiteSettingsRow;
    if (existing) {
      row = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: patch,
      });
    } else {
      row = await prisma.siteSettings.create({
        data: { ...defaultCreateData(), ...patch },
      });
    }

    revalidatePath('/', 'layout');

    return NextResponse.json(row, { headers });
  } catch (e) {
    console.error('PUT site-settings', e);
    return NextResponse.json({ error: 'Site ayarları güncellenemedi' }, { status: 500, headers });
  }
}
