/**
 * @fileoverview SEO ve Yapısal Veri (Structured Data) Yardımcıları
 * @description Next.js Metadata oluşturma, JSON-LD schema üretimi,
 * ve Google rich results optimizasyonu.
 *
 * @example
 * // Metadata oluşturma
 * export const metadata = generateSEO({
 *   title: 'Halı Yıkama Hizmeti',
 *   description: 'Profesyonel halı yıkama...',
 *   ogImage: '/images/hali-yikama.jpg',
 * });
 *
 * // JSON-LD schema
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{
 *     __html: serializeSchema(generateLocalBusinessSchema())
 *   }}
 * />
 */

import { Metadata } from 'next';
import type { SEOProps } from '@/types';
import { SITE_CONTACT } from '@/config/site-contact';

// ============================================
// SITE CONFIGURATION
// ============================================

/** Kanonik host standardı: www */
const DEFAULT_SITE_URL = 'https://www.gunentemizlik.com';

function normalizeSiteUrl(raw?: string): string {
  const input = raw?.trim();
  if (!input) return DEFAULT_SITE_URL;

  try {
    const withProtocol = input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`;
    const parsed = new URL(withProtocol);

    // Alan adında tek kanonik host kullan: www.gunentemizlik.com
    if (parsed.hostname === 'gunentemizlik.com') {
      parsed.hostname = 'www.gunentemizlik.com';
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Site domain - ortama göre değişebilir, ancak kanonik olarak normalize edilir. */
const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * Kanonik site kökü (sonunda `/` yok). Sitemap ve robots için kullanılır.
 * `VERCEL_URL` kullanılmaz: önizleme/proje adresi (*.vercel.app) olsa bile GSC
 * yalnızca mülk alan adıyla eşleşen URL’lere izin verir.
 */
export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

/**
 * Tam kanonik sayfa URL’si — `metadata.alternates.canonical` ile JSON-LD `@id` aynı kaynaktan üretilir.
 */
export function canonicalUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p === '/') return `${base}/`;
  return `${base}${p}`;
}

/** Varsayılan OG görseli */
const DEFAULT_OG_IMAGE = '/og-image.jpg';

/** Site bilgileri */
const SITE_CONFIG = {
  name: 'Günen Temizlik',
  description: 'İstanbul\'un önde gelen profesyonel temizlik şirketi',
  locale: 'tr_TR',
  language: 'tr',
  telephone: SITE_CONTACT.phoneE164,
  email: SITE_CONTACT.email,
  address: {
    street:
      'Gültepe Mahallesi, Talatpaşa Caddesi, Bıldırcın Sokağı No:13 kat -1',
    locality: 'Kağıthane',
    region: 'İstanbul',
    postalCode: '34000',
    country: 'TR',
  },
  geo: {
    latitude: 41.080921,
    longitude: 28.993809,
  },
  social: {
    facebook: 'https://facebook.com/gunentemizlik',
    instagram: 'https://instagram.com/gunentemizlik',
  },
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
} as const;

// ============================================
// METADATA GENERATION
// ============================================

/**
 * Next.js Metadata oluştur
 * @param props SEOProps türünden parametreler
 * @returns Next.js Metadata objesi
 *
 * @example
 * export const metadata = generateSEO({
 *   title: 'Hizmetlerimiz',
 *   description: 'Tüm temizlik hizmetlerimiz...',
 *   canonical: '/hizmetler',
 * });
 */
export function generateSEO({
  title,
  description,
  keywords = [],
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noIndex = false,
}: SEOProps): Metadata {
  // Validation
  if (!title || title.length < 3) {
    console.warn('SEO: Title too short or missing:', title);
  }
  if (!description || description.length < 50) {
    console.warn('SEO: Description too short (min 50 chars recommended):', description);
  }

  // Full URL oluştur
  const fullCanonical = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${SITE_URL}${canonical}`
    : SITE_URL;

  // OG image full URL
  const fullOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${SITE_URL}${ogImage}`;

  return {
    title: {
      default: title,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: fullCanonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: SITE_CONFIG.locale,
      url: fullCanonical,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImage],
    },
    robots: noIndex
      ? {
        index: false,
        follow: false,
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
  };
}

// ============================================
// JSON-LD UTILITIES
// ============================================

/**
 * Schema objesini JSON string'e çevir
 * HTML script tag'i için kullanılır
 *
 * @example
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{
 *     __html: serializeSchema(generateLocalBusinessSchema())
 *   }}
 * />
 */
export function serializeSchema(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}

/**
 * Birden fazla şemayı tek `application/ld+json` içinde `@graph` olarak birleştirir (öğelerdeki `@context` atılır).
 */
export function serializeSchemaGraph(nodes: Record<string, unknown>[]): string {
  const graph = nodes.map((n) => {
    if (!n || typeof n !== 'object') return n;
    const { ['@context']: _ctx, ...rest } = n as Record<string, unknown> & { '@context'?: unknown };
    return rest;
  });
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}

/**
 * LocalBusiness schema oluştur (Google Business Profile)
 * @returns Schema.org LocalBusiness yapısal verisi
 */
export function generateLocalBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONFIG.name,
    image: `${SITE_URL}/logo.png`,
    '@id': SITE_URL,
    url: SITE_URL,
    telephone: SITE_CONFIG.telephone,
    email: SITE_CONFIG.email,
    priceRange: '₺₺',
    description: SITE_CONFIG.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.locality,
      addressRegion: SITE_CONFIG.address.region,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.geo.latitude,
      longitude: SITE_CONFIG.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SITE_CONFIG.openingHours.days,
        opens: SITE_CONFIG.openingHours.opens,
        closes: SITE_CONFIG.openingHours.closes,
      },
    ],
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
    ].filter(Boolean),
  };
}

/**
 * Service schema oluştur
 * @param service - Hizmet bilgileri
 * @returns Schema.org Service yapısal verisi
 */
export function generateServiceSchema(service: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  priceRange?: string;
}): Record<string, unknown> {
  const fullUrl = `${SITE_URL}/hizmetler/${service.slug}`;
  const fullImage = service.image
    ? service.image.startsWith('http')
      ? service.image
      : `${SITE_URL}${service.image}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: SITE_CONFIG.name,
      '@id': SITE_URL,
    },
    url: fullUrl,
    image: fullImage,
    ...(service.priceRange && { priceRange: service.priceRange }),
    areaServed: 'İstanbul',
    serviceType: 'Temizlik Hizmetleri',
  };
}

/**
 * Article/BlogPosting schema oluştur
 * @param post - Blog yazısı bilgileri
 * @returns Schema.org Article yapısal verisi
 */
export function generateArticleSchema(post: {
  title: string;
  excerpt: string;
  slug: string;
  image?: string;
  author: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): Record<string, unknown> {
  const fullUrl = `${SITE_URL}/blog/${post.slug}`;
  const fullImage = post.image
    ? post.image.startsWith('http')
      ? post.image
      : `${SITE_URL}${post.image}`
    : `${SITE_URL}${DEFAULT_OG_IMAGE}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: fullImage,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    url: fullUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    inLanguage: SITE_CONFIG.language,
  };
}

/**
 * BreadcrumbList schema oluştur
 * @param items - Breadcrumb öğeleri
 * @returns Schema.org BreadcrumbList yapısal verisi
 *
 * @example
 * generateBreadcrumbSchema([
 *   { name: 'Ana Sayfa', url: '/' },
 *   { name: 'Hizmetler', url: '/hizmetler' },
 *   { name: 'Halı Yıkama', url: '/hizmetler/hali-yikama' },
 * ]);
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  if (items.length === 0) {
    console.warn('SEO: Empty breadcrumb items');
    return {};
  }

  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const path = item.url.startsWith('/') ? item.url : `/${item.url}`;
      const absolute = item.url.startsWith('http')
        ? item.url
        : path === '/'
          ? `${base}/`
          : `${base}${path}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absolute,
      };
    }),
  };
}

/**
 * Genel içerik sayfaları için WebPage + WebSite ilişkisi (randevu, rehber, site içi arama vb.).
 */
export function generateWebPageSchema(params: {
  path: string;
  title: string;
  description: string;
}): Record<string, unknown> {
  const base = getSiteUrl();
  const path = params.path.startsWith('/') ? params.path : `/${params.path}`;
  const pageUrl = path === '/' || path === '' ? `${base}/` : `${base}${path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: params.title,
    description: params.description,
    inLanguage: SITE_CONFIG.language,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: `${base}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: `${base}/`,
    },
  };
}

// ============================================
// ADDITIONAL SCHEMAS
// ============================================

/**
 * FAQPage schema oluştur
 * Google FAQ rich results için
 *
 * @example
 * generateFAQSchema([
 *   { question: 'Fiyat nedir?', answer: '500 TL'den başlar' },
 *   { question: 'Süre ne kadar?', answer: '2-3 saat' },
 * ]);
 */
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  if (faqs.length === 0) {
    console.warn('SEO: Empty FAQ items');
    return {};
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Review schema oluştur (Testimonials için)
 *
 * @example
 * generateReviewSchema({
 *   author: 'Ahmet Yılmaz',
 *   rating: 5,
 *   reviewBody: 'Harika hizmet!',
 *   datePublished: '2024-01-15',
 * });
 */
export function generateReviewSchema(review: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string | Date;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
    },
    reviewBody: review.reviewBody,
    datePublished: new Date(review.datePublished).toISOString(),
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
    },
  };
}

/**
 * AggregateRating schema oluştur (Yıldız derecelendirmesi)
 *
 * @example
 * generateAggregateRatingSchema({
 *   ratingValue: 4.8,
 *   reviewCount: 127,
 * });
 */
export function generateAggregateRatingSchema(rating: {
  ratingValue: number;
  reviewCount: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: rating.ratingValue,
    bestRating: 5,
    reviewCount: rating.reviewCount,
  };
}

/**
 * WebSite schema oluştur (Site search için)
 */
export function generateWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_URL,
  };
}

// ============================================
// BULK SCHEMA GENERATION
// ============================================

/**
 * Birden fazla schema'yı birleştir
 * @param schemas - Schema objeleri dizisi
 * @returns @graph formatında combined schema
 *
 * @example
 * generateCombinedSchema([
 *   generateLocalBusinessSchema(),
 *   generateBreadcrumbSchema([...]),
 * ]);
 */
export function generateCombinedSchema(
  schemas: Record<string, unknown>[]
): Record<string, unknown> {
  const validSchemas = schemas.filter(
    (s) => s && Object.keys(s).length > 0
  );

  if (validSchemas.length === 0) {
    return {};
  }

  if (validSchemas.length === 1) {
    return validSchemas[0];
  }

  return {
    '@context': 'https://schema.org',
    '@graph': validSchemas,
  };
}
