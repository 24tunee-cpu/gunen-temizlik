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

/** Rate limiting map (IP -> timestamp array) */
const rateLimitMap = new Map<string, number[]>();

/** Rate limit window: 10 minutes */
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;

/** Max requests per window: 5 (çok katı limit) */
const MAX_REQUESTS = 5;

// ============================================
// CORS HEADERS
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
 * GET handler - Seed all initial data
 * @param request NextRequest object
 * @returns Seed operation result JSON
 */
export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  // Rate limiting
  if (checkRateLimit(ip)) {
    console.warn('Rate limit exceeded on seed-admin endpoint', { ip });
    return NextResponse.json(
      { error: 'Çok fazla istek. Lütfen 10 dakika bekleyin.' },
      { status: 429, headers }
    );
  }

  // Production environment check
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.warn('Seed endpoint accessed in production environment', { ip });
    // Allow but warn - in real production this should be disabled entirely
  }

  try {
    console.log('Starting seed data creation', { ip, isProduction });

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

    // Check and seed Blog Posts
    const existingBlogs = await prisma.blogPost.count();
    let blogPosts = [];
    if (existingBlogs === 0) {
      blogPosts = await Promise.all([
        prisma.blogPost.create({
          data: {
            title: 'Ev Temizliginde Dikkat Edilmesi Gerekenler',
            slug: 'ev-temizliginde-dikkat-edilmesi-gerekenler',
            excerpt: 'Ev temizligi yaparken nelere dikkat etmelisiniz? Iste size ipuclari.',
            content: 'Ev temizligi yaparken dikkat edilmesi gereken bircok nokta vardir. Oncelikle dogru temizlik malzemelerini secmelisiniz. Kimyasal iceren urunler yerine dogal temizlik urunleri tercih etmeniz hem sagliginiz hem de cevre icin daha iyidir.\n\nTemizlik sirasinda yuksekten asagiya dogru ilerlemek daha verimli olacaktir. Once tavan ve duvarlar, sonra mobilyalar ve en son zemin temizlenmelidir.\n\nDuzenli temizlik yapmak, buyuk temizlikler yerine kucuk duzenli temizlikler daha kolay ve etkili olacaktir.',
            category: 'Temizlik Ipuclari',
            tags: ['ev temizligi', 'ipuclari', 'duzenli temizlik'],
            author: 'Gunen Temizlik',
            published: true,
            views: 0,
          },
        }),
        prisma.blogPost.create({
          data: {
            title: 'Ofis Temizliginin Onemi',
            slug: 'ofis-temizliginin-onemi',
            excerpt: 'Temiz bir ofis calisan verimliligini nasil etkiler?',
            content: 'Temiz bir ofis ortami, calisanlarin verimliligini artiran en onemli faktorlerden biridir. Arastirmalara gore temiz bir calisma ortami, calisanlarin motivasyonunu ve uretkenligini artirmaktadir.\n\nOfis temizliginde dikkat edilmesi gereken noktalar:\n\n1. Duzenli dezenfeksiyon\n2. Hava kalitesinin korunmasi\n3. Ortak alanlarin temizligi\n4. Elektronik cihazlarin temizligi\n\nProfesyonel ofis temizlik hizmetleri almak, is yerinizin her zaman temiz ve saglikli kalmasini saglar.',
            category: 'Isyeri Temizlik',
            tags: ['ofis temizligi', 'isyeri', 'verimlilik'],
            author: 'Gunen Temizlik',
            published: true,
            views: 0,
          },
        }),
        prisma.blogPost.create({
          data: {
            title: 'Koltuk Yikama Neden Onemli?',
            slug: 'koltuk-yikama-neden-onemli',
            excerpt: 'Koltuklarinizi duzenli olarak yikamanin faydalari nelerdir?',
            content: 'Koltuklar evimizin en cok kullanilan mobilyalarindan biridir. Gunluk kullanim nedeniyle koltuklar toz, kir, yag ve cesitli lekelerle kirlenir. Bu kirlilikler sadece goruntu acisindan degil, saglik acisindan da onemlidir.\n\nKoltuk yikamanin faydalari:\n\n1. Alerjenleri azaltir\n2. Kotu kokulari giderir\n3. Koltugun omrunu uzatir\n4. Ev hava kalitesini iyilestirir\n\nProfesyonel koltuk yikama hizmetleri, koltuklarinizin derinlemesine temizlenmesini saglar.',
            category: 'Mobilya Temizlik',
            tags: ['koltuk yikama', 'mobilya', 'hijyen'],
            author: 'Gunen Temizlik',
            published: true,
            views: 0,
          },
        }),
      ]);
    }

    // Check and seed Team Members
    const existingTeam = await prisma.teamMember.count();
    let teamMembers = [];
    if (existingTeam === 0) {
      teamMembers = await Promise.all([
        prisma.teamMember.create({
          data: {
            name: 'Ahmet Yilmaz',
            role: 'Genel Mudur',
            bio: '20 yillik temizlik sektoru deneyimi ile Gunen Temizlik\'in kurucusu.',
            isActive: true,
            order: 1,
          },
        }),
        prisma.teamMember.create({
          data: {
            name: 'Ayse Kaya',
            role: 'Operasyon Muduru',
            bio: 'Profesyonel temizlik ekiplerini yonetmektedir.',
            isActive: true,
            order: 2,
          },
        }),
        prisma.teamMember.create({
          data: {
            name: 'Mehmet Demir',
            role: 'Teknik Sorumlu',
            bio: 'Ozel temizlik ekipmanlari ve teknikleri konusunda uzman.',
            isActive: true,
            order: 3,
          },
        }),
      ]);
    }

    // Check and seed Testimonials
    const existingTestimonials = await prisma.testimonial.count();
    let testimonials = [];
    if (existingTestimonials === 0) {
      testimonials = await Promise.all([
        prisma.testimonial.create({
          data: {
            name: 'Fatma Ozturk',
            location: 'Istanbul',
            rating: 5,
            content: 'Gunen Temizlik ile tanistik tanimadan evim cok daha temiz. Profesyonel ekip ve mukemmel hizmet.',
            service: 'Ev Temizligi',
            isActive: true,
            order: 1,
          },
        }),
        prisma.testimonial.create({
          data: {
            name: 'Ali Cetin',
            location: 'Ankara',
            rating: 5,
            content: 'Ofis temizligi icin Gunen Temizlik\'i tercih ettik. Sonuc muhtesem!',
            service: 'Ofis Temizligi',
            isActive: true,
            order: 2,
          },
        }),
      ]);
    }

    // Check and seed FAQs
    const existingFaqs = await prisma.faq.count();
    let faqs = [];
    if (existingFaqs === 0) {
      faqs = await Promise.all([
        prisma.faq.create({
          data: {
            question: 'Temizlik hizmetleri hangi saatlerde verilmektedir?',
            answer: 'Temizlik hizmetlerimiz 7 gun 24 saat esasina gore verilmektedir. Size uygun saatte randevu alabilirsiniz.',
            category: 'Genel',
            isActive: true,
            order: 1,
          },
        }),
        prisma.faq.create({
          data: {
            question: 'Hangi temizlik malzemelerini kullaniyorsunuz?',
            answer: 'Cevre dostu ve saglik acisindan guvenli temizlik malzemeleri kullaniyoruz. Isterseniz ozel malzeme talebinde bulunabilirsiniz.',
            category: 'Genel',
            isActive: true,
            order: 2,
          },
        }),
        prisma.faq.create({
          data: {
            question: 'Fiyatlar nasil belirleniyor?',
            answer: 'Fiyatlar temizlik yapilacak alanin buyuklugu, temizlik turu ve zorluk derecesine gore belirlenmektedir. Ucretsiz kestirim icin bize ulasin.',
            category: 'Fiyat',
            isActive: true,
            order: 3,
          },
        }),
      ]);
    }

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
        blogPosts: blogPosts.length,
        teamMembers: teamMembers.length,
        testimonials: testimonials.length,
        faqs: faqs.length,
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
      warnings: isProduction
        ? ['⚠️ PRODUCTION ORTAMINDA ÇALIŞIYOR - Bu endpoint productionda devre dışı bırakılmalı!']
        : [],
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
      isProduction,
      createdCounts: responseData.created
    });

    return NextResponse.json(responseData, { headers });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating seed data', { error: errorMessage });
    return NextResponse.json(
      {
        error: 'Seed verileri oluşturulamadı',
        details: errorMessage
      },
      { status: 500, headers }
    );
  }
}
