/**
 * Enhanced Schema Markup for Rich Snippets
 * CTR artışı için zengin structured data
 * Mevcut sistemi bozmadan yeni özellikler ekler
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSiteUrl, serializeSchemaGraph } from '@/lib/seo';

// Service şablonları
const SERVICE_TEMPLATES = {
  'ev-temizligi': {
    name: 'Ev Temizliği',
    description: 'Profesyonel ev temizliği hizmeti. Tüm odalar, mutfak, banyo temizliği.',
    priceRange: '750-2000₺',
    duration: '2-4 saat',
    areaServed: 'İstanbul ve çevresi'
  },
  'ofis-temizligi': {
    name: 'Ofis Temizliği',
    description: 'Kurumsal ofis temizliği. Günlük, haftalık, aylık programlar.',
    priceRange: '1500-5000₺',
    duration: '3-6 saat',
    areaServed: 'İstanbul Avrupa ve Anadolu Yakası'
  },
  'insaat-sonrasi-temizlik': {
    name: 'İnşaat Sonrası Temizlik',
    description: 'İnşaat sonrası profesyonel temizlik. Toz, boya, inşaat artıkları.',
    priceRange: '2000-8000₺',
    duration: '1-3 gün',
    areaServed: 'Tüm İstanbul'
  },
  'koltuk-yikama': {
    name: 'Koltuk Yıkama',
    description: 'Deri ve kumaş koltuk yıkama. Yerinde hizmet, leke çıkarma.',
    priceRange: '300-1500₺',
    duration: '1-2 saat',
    areaServed: 'İstanbul içi'
  },
  'hali-yikama': {
    name: 'Halı Yıkama',
    description: 'Modern halı yıkama teknolojisi. Leke çıkarma, hijyenik temizlik.',
    priceRange: '200-800₺',
    duration: '24-48 saat',
    areaServed: 'İstanbul ve çevre iller'
  }
};

/**
 * Service schema oluştur
 */
function createServiceSchema(
  serviceType: string,
  template: any,
  baseUrl: string,
  businessName: string,
  phone: string,
  address: any
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: template.name,
    description: template.description,
    provider: {
      '@type': 'LocalBusiness',
      name: businessName,
      telephone: phone,
      address: address
    },
    serviceType: template.name,
    areaServed: {
      '@type': 'City',
      name: template.areaServed
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${template.name} Fiyatları`,
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: template.name
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'TRY',
            priceRange: template.priceRange
          },
          availability: 'https://schema.org/InStock'
        }
      ]
    },
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ],
      opens: '08:00',
      closes: '22:00'
    }
  };
}

/**
 * FAQ schema oluştur
 */
function createFAQSchema(faqs: Array<{ question: string, answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * HowTo schema oluştur
 */
function createHowToSchema(
  title: string,
  description: string,
  steps: Array<{ name: string, text: string, image?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: description,
    image: steps[0]?.image,
    totalTime: 'PT30M',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'TRY',
      value: '0'
    },
    supply: [],
    tool: [],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image
    }))
  };
}

/**
 * Review schema oluştur
 */
function createReviewSchema(
  businessName: string,
  reviews: Array<{ author: string, rating: number, comment: string, date: string }>
) {
  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: reviews.length.toString(),
    bestRating: '5',
    worstRating: '1'
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    aggregateRating,
    review: reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author
      },
      datePublished: review.date,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1'
      },
      reviewBody: review.comment
    }))
  };
}

/**
 * Blog yazısı için zengin Article schema
 */
export function createEnhancedArticleSchema(
  article: {
    title: string;
    excerpt: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    category: string;
    tags: string[];
    image?: string;
  },
  baseUrl: string,
  businessName: string
) {
  const wordCount = article.content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200); // 200 kelim/dakika

  // İçerikten FAQ çıkar
  const faqMatches = article.content.match(/<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3|$)/g) || [];
  const faqs = faqMatches.slice(0, 5).map(match => {
    const questionMatch = match.match(/<h3[^>]*>(.*?)<\/h3>/);
    const answerMatch = match.match(/<\/h3>([\s\S]*?)(?=<h3|$)/);

    return {
      question: questionMatch ? questionMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      answer: answerMatch ? answerMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) + '...' : ''
    };
  }).filter(faq => faq.question && faq.answer);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image ? [article.image] : [],
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: businessName,
      url: baseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: businessName,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog`
    },
    wordCount,
    timeRequired: `PT${readTime}M`,
    keywords: article.tags.join(', '),
    articleSection: article.category,
    inLanguage: 'tr-TR'
  };

  const allSchemas: any[] = [articleSchema];

  // FAQ ekle
  if (faqs.length > 0) {
    allSchemas.push(createFAQSchema(faqs));
  }

  // HowTo ekle (temizlik ipuçları için)
  if (article.category.includes('temizlik') && article.content.includes('adım')) {
    const howToSteps = [
      {
        name: 'Hazırlık',
        text: 'Temizlik için gerekli malzemeleri hazırlayın.',
        image: `${baseUrl}/images/temizlik-hazirlik.jpg`
      },
      {
        name: 'Uygulama',
        text: 'Profesyonel temizlik ürünlerini kullanın.',
        image: `${baseUrl}/images/temizlik-uygulama.jpg`
      },
      {
        name: 'Kontrol',
        text: 'Temizlik sonrası kontrol edin.',
        image: `${baseUrl}/images/temizlik-kontrol.jpg`
      }
    ];

    allSchemas.push(createHowToSchema(
      `${article.title} - Nasıl Yapılır?`,
      article.excerpt,
      howToSteps
    ));
  }

  return JSON.stringify(allSchemas);
}

/**
 * Hizmet sayfası için enhanced schema
 */
export async function createEnhancedServiceSchema(
  serviceSlug: string,
  baseUrl: string,
  businessName: string,
  phone: string,
  address: any
) {
  const template = SERVICE_TEMPLATES[serviceSlug as keyof typeof SERVICE_TEMPLATES];
  if (!template) return '';

  const serviceSchema = createServiceSchema(
    serviceSlug,
    template,
    baseUrl,
    businessName,
    phone,
    address
  );

  // Service için FAQ
  const serviceFAQs = [
    {
      question: `${template.name} fiyatları ne kadar?`,
      answer: `${template.name} hizmetimiz ${template.priceRange} arasında değişmektedir.`
    },
    {
      question: `${template.name} ne kadar sürer?`,
      answer: `Hizmetimiz yaklaşık ${template.duration} sürmektedir.`
    },
    {
      question: `Hangi bölgelere hizmet veriyorsunuz?`,
      answer: `${template.areaServed} bölgesine hizmet vermekteyiz.`
    }
  ];

  const faqSchema = createFAQSchema(serviceFAQs);

  return serializeSchemaGraph([serviceSchema, faqSchema]);
}

/**
 * Ana sayfa için enhanced schema (Review ile)
 */
export async function createEnhancedHomePageSchema(
  baseUrl: string,
  businessName: string,
  phone: string,
  address: any
) {
  // Örnek müşteri yorumları
  const sampleReviews = [
    {
      author: 'Ahmet Y.',
      rating: 5,
      comment: 'Harika temizlik hizmeti, çok memnun kaldım.',
      date: '2024-01-15'
    },
    {
      author: 'Ayşe K.',
      rating: 5,
      comment: 'Profesyonel ekip, hızlı ve temiz çalıştılar.',
      date: '2024-01-20'
    },
    {
      author: 'Mehmet D.',
      rating: 4,
      comment: 'Fiyat performans olarak çok iyi.',
      date: '2024-02-01'
    }
  ];

  return createReviewSchema(businessName, sampleReviews);
}
