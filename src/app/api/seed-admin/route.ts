/**
 * @fileoverview Seed Admin & Data API Route
 * @description Uygulama başlangıç verilerini (seed data) oluşturan API endpoint'i.
 * Admin kullanıcısı, hizmetler, blog yazıları, ekip üyeleri, referanslar, SSS, fiyatlandırma, galeri ve sertifikaları başlatır.
 *
 * @architecture
 * - Server-Side API Route
 * - Prisma ORM database access
 * - Development/Setup only endpoint
 * - Idempotent operations (tekrar çalıştırılabilir)
 *
 * @important
 * ⚠️ BU ENDPOINT SADECE DEVELOPMENT/SETUP AŞAMASINDA KULLANILMALIDIR!
 * ⚠️ PRODUCTION ORTAMINDA BU ENDPOINT KAPATILMALI VEYA KALDIRILMALIDIR!
 * ⚠️ Herkese açık bir endpoint'tir - admin oluşturma yetkisi vardır!
 *
 * @security
 * - Rate limiting: 5 requests per 10 minutes (çok katı limit)
 * - Production environment check (uyarı verir)
 * - Hardcoded default admin credentials (DEVELOPMENT ONLY)
 *
 * @admin-sync
 * Bu endpoint uygulama ilk kurulumunda çalıştırılır.
 * Oluşturulan admin hesabı ile /admin paneline giriş yapılabilir.
 * @warning Production kullanımı için KESİNLİKLE UYGUN DEĞİLDİR!
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { upsertCanonicalServices } from '@/lib/seed-services';
import { upsertCanonicalTestimonials } from '@/lib/seed-testimonials';
import { upsertCanonicalBlogPosts } from '@/lib/seed-blog';
import { upsertCanonicalTeamMembers } from '@/lib/seed-team';
import { upsertCanonicalFaqs } from '@/lib/seed-faq';
import { checkRateLimit } from '@/lib/security';
import bcrypt from 'bcryptjs';

// ============================================
// CONFIGURATION
// ============================================

/** Logger instance */

/** Default admin credentials - DEVELOPMENT ONLY! */
const DEFAULT_ADMIN = {
  email: 'admin@gunentemizlik.com',
  password: 'admin123', // DEVELOPMENT ONLY - Change immediately after first login!
  name: 'Admin',
} as const;

/** Rate limit window: 10 minutes */
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;

/** Max requests per window: 5 (çok katı limit) */
const MAX_REQUESTS = 5;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
 * GET handler - Seed all initial data
 * @param request NextRequest object
 * @returns Seed operation result JSON
 */
async function runSeed(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  if (process.env.NODE_ENV === 'production') {
    console.warn('Blocked seed-admin in production', { ip });
    return NextResponse.json({ error: 'Not Found' }, { status: 404, headers });
  }

  const setupSecret = process.env.SEED_ADMIN_SECRET?.trim();
  if (!setupSecret) {
    console.error('SEED_ADMIN_SECRET is missing');
    return NextResponse.json(
      { error: 'Seed endpoint is not configured' },
      { status: 500, headers }
    );
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  // Rate limiting
  const limit = checkRateLimit(`seed-admin:${ip}`, MAX_REQUESTS, RATE_LIMIT_WINDOW);
  if (!limit.allowed) {
    console.warn('Rate limit exceeded on seed-admin endpoint', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 10 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  try {
    console.log('Starting seed data creation', { ip });

    // Check if admin exists, create if not
    const existingAdmin = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN.email },
    });

    let admin;
    let adminCreated = false;
    if (existingAdmin) {
      admin = existingAdmin;
      console.log('Admin user already exists', { email: admin.email });
    } else {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
      admin = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN.email,
          name: DEFAULT_ADMIN.name,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      adminCreated = true;
      console.log('Admin user created successfully', { email: admin.email });
    }

    // Hizmetler — prisma seed ile aynı kanonik SEO metinleri (slug upsert)
    const existingServices = await prisma.service.count();
    const servicesUpserted = await upsertCanonicalServices(prisma);

    const existingBlogs = await prisma.blogPost.count();
    const blogPostsUpserted = await upsertCanonicalBlogPosts(prisma);

    const existingTeam = await prisma.teamMember.count();
    const teamMembersUpserted = await upsertCanonicalTeamMembers(prisma);

    const existingTestimonials = await prisma.testimonial.count();
    const testimonialsUpserted = await upsertCanonicalTestimonials(prisma);

    const existingFaqs = await prisma.faq.count();
    const faqsUpserted = await upsertCanonicalFaqs(prisma);

    // Check and seed Pricing
    const existingPricing = await prisma.pricing.count();
    let pricingItems = [];
    if (existingPricing === 0) {
      pricingItems = await Promise.all([
        prisma.pricing.create({
          data: {
            serviceName: 'Ev Temizligi',
            basePrice: 300,
            pricePerSqm: 15,
            unit: 'm2',
            minPrice: 200,
            description: 'Standart ev temizligi',
            features: ['Toz alma', 'Yer silme', 'Banyo temizlik', 'Mutfak temizlik'],
            isActive: true,
            order: 1,
          },
        }),
        prisma.pricing.create({
          data: {
            serviceName: 'Ofis Temizligi',
            basePrice: 500,
            pricePerSqm: 10,
            unit: 'm2',
            minPrice: 300,
            description: 'Gunluk ofis temizligi',
            features: ['Gunluk temizlik', 'Cam silme', 'Lavabo temizlik', 'Cop toplama'],
            isActive: true,
            order: 2,
          },
        }),
      ]);
    }

    // Check and seed Gallery
    const existingGallery = await prisma.gallery.count();
    let galleryItems = [];
    if (existingGallery === 0) {
      galleryItems = await Promise.all([
        prisma.gallery.create({
          data: {
            title: 'Ev Temizligi - Oncesi/Sonrasi',
            description: 'Kapsamli ev temizlik calismasi',
            image: '/images/gallery/ev-temizlik-1.jpg',
            category: 'Temizlik Oncesi/Sonrasi',
            isActive: true,
            order: 1,
          },
        }),
        prisma.gallery.create({
          data: {
            title: 'Ofis Temizligi',
            description: 'Profesyonel ofis temizlik calismasi',
            image: '/images/gallery/ofis-temizlik-1.jpg',
            category: 'Ofis',
            isActive: true,
            order: 2,
          },
        }),
      ]);
    }

    // Check and seed Certificates
    const existingCertificates = await prisma.certificate.count();
    let certificates = [];
    if (existingCertificates === 0) {
      certificates = await Promise.all([
        prisma.certificate.create({
          data: {
            title: 'ISO 9001 Kalite Belgesi',
            description: 'Kalite yonetim sistemi belgesi',
            image: '/images/certificates/iso-9001.jpg',
            issuer: 'TSE',
            isActive: true,
            order: 1,
          },
        }),
        prisma.certificate.create({
          data: {
            title: 'Hijyen Belgesi',
            description: 'Gida hijyeni ve temizlik belgesi',
            image: '/images/certificates/hijyen.jpg',
            issuer: 'Saglik Bakanligi',
            isActive: true,
            order: 2,
          },
        }),
      ]);
    }

    // Build response
    const responseData = {
      message: adminCreated
        ? '✅ Tüm seed verileri başarıyla oluşturuldu!'
        : 'ℹ️ Admin zaten mevcut. Eksik seed verileri oluşturuldu.',
      admin: {
        email: admin.email,
        passwordStatus: adminCreated
          ? '⚠️ Varsayılan şifre: admin123 - Giriş yaptıktan sonra DEĞİŞTİRİN!'
          : '✅ Şifre zaten ayarlanmış',
        created: adminCreated,
      },
      created: {
        services: servicesUpserted,
        blogPosts: blogPostsUpserted,
        teamMembers: teamMembersUpserted,
        testimonials: testimonialsUpserted,
        faqs: faqsUpserted,
        pricing: pricingItems.length,
        gallery: galleryItems.length,
        certificates: certificates.length,
      },
      existingCounts: {
        services: existingServices,
        blogs: existingBlogs,
        team: existingTeam,
        testimonials: existingTestimonials,
        faqs: existingFaqs,
        pricing: existingPricing,
        gallery: existingGallery,
        certificates: existingCertificates,
      },
      warnings: [],
      nextSteps: adminCreated
        ? [
          '1. /admin sayfasına gidin',
          '2. Email: admin@gunentemizlik.com',
          '3. Şifre: admin123',
          '4. Giriş yaptıktan sonra şifrenizi DEĞİŞTİRİN!',
        ]
        : [],
    };

    console.log('Seed data operation completed', {
      adminCreated,
      createdCounts: responseData.created
    });

    return NextResponse.json(responseData, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating seed data', { error: errorMessage });
    return NextResponse.json(
      { error: 'Seed verileri oluşturulamadı' },
      { status: 500, headers }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: CORS_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  return runSeed(request);
}
