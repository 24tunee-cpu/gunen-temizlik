import { Metadata } from 'next';
import { FAQ_SEED_DATA } from './seed-faq';

// ============================================
// GÜNEN TEMİZLİK - ULTIMATE SEO STRATEGY
// ============================================

// Anahtar Kelime Stratejisi - 2024
export const KEYWORD_STRATEGY = {
  // Ana (Seed) Anahtar Kelimeler - Yüksek Hacim
  primary: [
    'istanbul temizlik şirketi',
    'profesyonel temizlik hizmetleri',
    'ofis temizliği istanbul',
    'inşaat sonrası temizlik',
    'koltuk yıkama hizmeti',
    'halı temizliği',
    'ev temizliği şirketi',
    'kurumsal temizlik firması',
  ],
  
  // Uzun Kuyruklu (Long-tail) Anahtar Kelimeler - Yüksek Dönüşüm
  longTail: [
    'istanbul da en iyi temizlik şirketi',
    'ataşehir temizlik şirketi 7/24 hizmet',
    'inşaat sonrası detaylı temizlik fiyatları',
    'ofis temizliği aylık sözleşme fiyatları',
    'koltuk yıkama yerinde hizmet istanbul',
    'profesyonel halı temizliği garantili',
    'ev temizliği saatlik ücret 2024',
    'son dakika temizlik hizmeti istanbul',
    'dezenfeksiyon hizmeti covid sertifikalı',
    'cam temizliği dış cephe iş güvenliği',
  ],
  
  // Lokal SEO Anahtar Kelimeler - Bölgesel
  local: [
    'ataşehir temizlik şirketi',
    'kadıköy temizlik firması',
    'üsküdar ev temizliği',
    'beşiktaş ofis temizliği',
    'şişli temizlik hizmeti',
    'maltepe koltuk yıkama',
    'pendik halı temizliği',
    'bostancı temizlik şirketi',
    'kozyatağı profesyonel temizlik',
    'göztepe ev temizliği hizmeti',
  ],
  
  // Hizmet Bazlı Anahtar Kelimeler
  serviceBased: {
    insaat: [
      'inşaat sonrası temizlik',
      'tadilat sonrası temizlik',
      'yeni ev temizliği',
      'mantolama sonrası temizlik',
    ],
    ofis: [
      'ofis temizliği',
      'iş yeri temizliği',
      'kurumsal temizlik',
      'fabrika temizliği',
    ],
    ev: [
      'ev temizliği',
      'villa temizliği',
      'daire temizliği',
      'apartman temizliği',
    ],
    ozel: [
      'koltuk yıkama',
      'halı yıkama',
      'yatak temizliği',
      'stor perde temizliği',
    ],
  },
};

// ============================================
// SEO META GENERATOR - ENHANCED VERSION
// ============================================

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'service' | 'localBusiness';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  breadcrumbs?: { name: string; url: string }[];
  faqs?: { question: string; answer: string }[];
}

export function generateSEO({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.jpg',
  canonical,
  noIndex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Günen Temizlik',
  breadcrumbs,
  faqs,
}: SEOProps): Metadata {
  // Merge with primary keywords
  const allKeywords = [...KEYWORD_STRATEGY.primary, ...keywords];
  
  return {
    title: `${title} | Günen Temizlik`,
    description: description.slice(0, 160),
    keywords: allKeywords.join(', '),
    authors: [{ name: author }],
    creator: 'Günen Temizlik',
    publisher: 'Günen Temizlik',
    metadataBase: new URL('https://gunentemizlik.com'),
    alternates: {
      canonical: canonical || 'https://gunentemizlik.com',
      languages: {
        'tr-TR': canonical || 'https://gunentemizlik.com',
      },
    },
    openGraph: {
      title: `${title} | Günen Temizlik`,
      description: description.slice(0, 160),
      type: type === 'article' ? 'article' : 'website',
      locale: 'tr_TR',
      url: canonical || 'https://gunentemizlik.com',
      siteName: 'Günen Temizlik',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: [author],
        tags: keywords,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Günen Temizlik`,
      description: description.slice(0, 160),
      images: [ogImage],
      creator: '@gunentemizlik',
      site: '@gunentemizlik',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
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
    verification: {
      google: 'YOUR_GOOGLE_VERIFICATION_CODE',
      yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
      yahoo: 'YOUR_YAHOO_VERIFICATION_CODE',
      me: ['YOUR_OTHER_VERIFICATION_CODES'],
    },
    category: 'business',
    classification: 'Cleaning Services',
    other: {
      'msapplication-TileColor': '#10b981',
      'msapplication-TileImage': '/ms-icon-144x144.png',
      'theme-color': '#10b981',
      'google-site-verification': 'YOUR_VERIFICATION',
      'fb:app_id': 'YOUR_FACEBOOK_APP_ID',
      'og:locale:alternate': ['en_US'],
    },
  };
}

// ============================================
// SCHEMA.ORG - RICH STRUCTURED DATA
// ============================================

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CleaningService', // Daha spesifik LocalBusiness alt tipi
    '@id': 'https://gunentemizlik.com/#business',
    name: 'Günen Temizlik Şirketi',
    image: [
      'https://gunentemizlik.com/logo.png',
      'https://gunentemizlik.com/hero-image.jpg',
      'https://gunentemizlik.com/team-photo.jpg',
    ],
    url: 'https://gunentemizlik.com',
    telephone: '+905551234567',
    email: 'info@gunentemizlik.com',
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    description: 'İstanbul\'un önde gelen profesyonel temizlik şirketi. İnşaat sonrası, ofis, ev temizliği ve koltuk yıkama hizmetleri.',
    foundingDate: '2010',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '527',
      bestRating: '5',
      worstRating: '1',
    },
    address: {
      '@type': 'PostalAddress',
      '@id': 'https://gunentemizlik.com/#address',
      streetAddress: 'Atatürk Mah. Turgut Özal Bulvarı No:123',
      addressLocality: 'Ataşehir',
      addressRegion: 'İstanbul',
      postalCode: '34758',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      '@id': 'https://gunentemizlik.com/#geo',
      latitude: '41.0082',
      longitude: '28.9784',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
        description: '7/24 Acil Temizlik Hizmeti',
      },
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'İstanbul',
        '@id': 'https://www.wikidata.org/wiki/Q406',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Ataşehir',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Kadıköy',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Üsküdar',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Temizlik Hizmetleri',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'İnşaat Sonrası Temizlik',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ofis Temizliği',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Koltuk Yıkama',
          },
        },
      ],
    },
    sameAs: [
      'https://facebook.com/gunentemizlik',
      'https://instagram.com/gunentemizlik',
      'https://linkedin.com/company/gunentemizlik',
      'https://google.com/maps/place/Günen+Temizlik',
    ],
    hasMap: 'https://www.google.com/maps?q=41.0082,28.9784',
    isAccessibleForFree: false,
    publicAccess: true,
    amenityFeature: [
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Otopark',
        value: true,
      },
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Engelli Erişimi',
        value: true,
      },
    ],
  };
}

export function generateServiceSchema(service: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  priceRange?: string;
  duration?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `https://gunentemizlik.com/hizmetler/${service.slug}/#service`,
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'CleaningService',
      name: 'Günen Temizlik',
      '@id': 'https://gunentemizlik.com/#business',
    },
    url: `https://gunentemizlik.com/hizmetler/${service.slug}`,
    image: service.image,
    areaServed: {
      '@type': 'City',
      name: 'İstanbul',
    },
    serviceType: 'Temizlik Hizmeti',
    ...(service.priceRange && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'TRY',
        priceRange: service.priceRange,
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(service.duration && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'TRY',
        value: service.priceRange,
      },
    }),
  };
}

export function generateArticleSchema(post: {
  title: string;
  excerpt: string;
  slug: string;
  image?: string;
  author: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://gunentemizlik.com/blog/${post.slug}/#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://gunentemizlik.com/blog/${post.slug}`,
    },
    headline: post.title,
    description: post.excerpt,
    image: {
      '@type': 'ImageObject',
      url: post.image,
      width: 1200,
      height: 630,
    },
    author: {
      '@type': 'Person',
      name: post.author,
      '@id': 'https://gunentemizlik.com/#author',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Günen Temizlik',
      '@id': 'https://gunentemizlik.com/#business',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gunentemizlik.com/logo.png',
        width: 400,
        height: 400,
      },
    },
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    keywords: post.tags?.join(', ') || 'temizlik, istanbul',
    articleSection: 'Temizlik İpuçları',
    inLanguage: 'tr-TR',
    ...(post.tags && {
      about: post.tags.map(tag => ({
        '@type': 'Thing',
        name: tag,
      })),
    }),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': 'https://gunentemizlik.com/#breadcrumbs',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
      '@id': `${item.url}/#breadcrumb`,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://gunentemizlik.com/#faq',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateReviewSchema(reviews: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}[]) {
  return reviews.map(review => ({
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
    datePublished: review.datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'Günen Temizlik',
    },
  }));
}

export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; url?: string }[];
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime || 'PT2H',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'TRY',
      value: 'Değişken',
    },
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
    })),
  };
}

// ============================================
// PAGE-SPECIFIC SEO CONFIGURATIONS
// ============================================

export const PAGE_SEO = {
  home: {
    title: 'İstanbul Profesyonel Temizlik Şirketi | 7/24 Hizmet',
    description: 'İstanbul\'un en iyi temizlik şirketi. İnşaat sonrası, ofis, koltuk yıkama, halı temizliği. 15+ yıl deneyim, 5000+ mutlu müşteri. Hemen fiyat alın!',
    keywords: ['istanbul temizlik', 'temizlik şirketi', 'profesyonel temizlik', 'ofis temizliği', 'inşaat sonrası temizlik', 'koltuk yıkama'],
  },
  hizmetler: {
    title: 'Profesyonel Temizlik Hizmetleri | Tüm İstanbul',
    description: 'İstanbul genelinde inşaat sonrası, ofis, ev temizliği, koltuk ve halı yıkama hizmetleri. Garantili temizlik, profesyonel ekip. Ücretsiz keşif!',
    keywords: ['temizlik hizmetleri', 'istanbul temizlik', 'ofis temizliği', 'ev temizliği', 'koltuk yıkama', 'halı temizliği'],
  },
  blog: {
    title: 'Temizlik İpuçları ve Blog | Günen Temizlik',
    description: 'Profesyonel temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler. Ev temizliği, ofis bakımı ve daha fazlası.',
    keywords: ['temizlik ipuçları', 'temizlik blog', 'ev temizliği', 'ofis bakımı'],
  },
  iletisim: {
    title: 'İletişim | Ücretsiz Keşif ve Fiyat Teklifi',
    description: 'İstanbul temizlik hizmetleri için bizi arayın. 7/24 destek, ücretsiz keşif, uygun fiyatlar. Hemen temizlik teklifi alın!',
    keywords: ['temizlik fiyatları', 'istanbul temizlik şirketi', 'ücretsiz keşif'],
  },
  hakkimizda: {
    title: 'Hakkımızda | 15+ Yıllık Deneyim | Günen Temizlik',
    description: '2010\'dan beri İstanbul\'da profesyonel temizlik hizmetleri. Deneyimli ekibimiz ve modern ekipmanlarımızla kaliteli hizmet garantisi.',
    keywords: ['temizlik şirketi hakkında', 'istanbul temizlik firması', 'profesyonel temizlik ekibi'],
  },
};

// ============================================
// RICH RESULTS & FEATURED SNIPPETS OPTIMIZATION
// ============================================

export const FAQ_CONTENT = [...FAQ_SEED_DATA]
  .filter((f) => f.isActive)
  .sort((a, b) => a.order - b.order)
  .map((f) => ({ question: f.question, answer: f.answer }));

// ============================================
// SITEMAP & ROBOTS HELPERS
// ============================================

export const STATIC_ROUTES = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/hizmetler', priority: 0.9, changefreq: 'weekly' },
  { url: '/blog', priority: 0.8, changefreq: 'daily' },
  { url: '/iletisim', priority: 0.8, changefreq: 'monthly' },
  { url: '/hakkimizda', priority: 0.7, changefreq: 'monthly' },
  { url: '/referanslar', priority: 0.7, changefreq: 'weekly' },
];

export const SERVICES_ROUTES = [
  { url: '/hizmetler/insaat-sonrasi-temizlik', priority: 0.9 },
  { url: '/hizmetler/ofis-temizligi', priority: 0.9 },
  { url: '/hizmetler/koltuk-yikama', priority: 0.9 },
  { url: '/hizmetler/hali-yikama', priority: 0.8 },
  { url: '/hizmetler/ev-temizligi', priority: 0.9 },
  { url: '/hizmetler/villa-temizligi', priority: 0.8 },
  { url: '/hizmetler/cam-temizligi', priority: 0.7 },
  { url: '/hizmetler/dezenfeksiyon', priority: 0.8 },
];

export const BLOG_ROUTES = [
  { url: '/blog/temizlik-ipuclari', priority: 0.7 },
  { url: '/blog/koltuk-yikama-rehberi', priority: 0.7 },
  { url: '/blog/insaat-sonrasi-temizlik-nasil-yapilir', priority: 0.7 },
  { url: '/blog/ofis-temizligi-onemli-noktalar', priority: 0.7 },
  { url: '/blog/halı-temizliği-püf-noktaları', priority: 0.6 },
];
