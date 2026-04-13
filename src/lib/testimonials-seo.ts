import { prisma } from '@/lib/prisma';
import { SITE_CONTACT } from '@/config/site-contact';

const BUSINESS_ID = 'https://gunentemizlik.com/#business';
const SITE_ORIGIN = 'https://gunentemizlik.com';

export type PublicTestimonialRow = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  content: string;
  service: string | null;
  createdAt: Date;
  avatar: string | null;
};

/** Google önerisi: JSON-LD’de çok uzun review listeleri yerine makul üst sınır. */
const MAX_REVIEW_ENTITIES = 24;

export async function fetchPublicTestimonialsForSeo(): Promise<PublicTestimonialRow[]> {
  return prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      location: true,
      rating: true,
      content: true,
      service: true,
      createdAt: true,
      avatar: true,
    },
  });
}

export function computeTestimonialAggregate(rows: { rating: number }[]) {
  if (rows.length === 0) return null;
  const sum = rows.reduce((a, r) => a + r.rating, 0);
  const ratingValue = Math.round((sum / rows.length) * 10) / 10;
  return { ratingValue, reviewCount: rows.length };
}

/**
 * Referanslar sayfası için LocalBusiness + gerçek Review[] + AggregateRating.
 * Yorum yoksa aggregate/review eklenmez (yanıltıcı zengin sonuç riski azalır).
 */
export function buildReferanslarLocalBusinessJsonLd(rows: PublicTestimonialRow[]) {
  const agg = computeTestimonialAggregate(rows);
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': BUSINESS_ID,
    name: 'Günen Temizlik Şirketi',
    url: `${SITE_ORIGIN}/referanslar`,
    image: [`${SITE_ORIGIN}/logo.png`, `${SITE_ORIGIN}/og-image.jpg`],
    telephone: SITE_CONTACT.phoneE164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'İstanbul',
      addressCountry: 'TR',
    },
  };

  if (agg && agg.reviewCount > 0) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: agg.ratingValue,
      reviewCount: agg.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
    base.review = rows.slice(0, MAX_REVIEW_ENTITIES).map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.name },
      datePublished: t.createdAt.toISOString().slice(0, 10),
      reviewBody: t.content.slice(0, 8000),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: t.rating,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: { '@id': BUSINESS_ID },
    }));
  }

  return base;
}

export function buildReferanslarBreadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Referanslar',
        item: `${SITE_ORIGIN}/referanslar`,
      },
    ],
  };
}

/** SSS zengin sonuçları için — içerik referanslar temasına özel. */
export function buildReferanslarFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Günen Temizlik müşteri yorumları gerçek mi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Evet. gunentemizlik.com/referanslar sayfasındaki yorumlar yönetim panelinden yayınlanan aktif müşteri referanslarıdır; her yorum için isim ve metin site üzerinde görünür.',
        },
      },
      {
        '@type': 'Question',
        name: 'İstanbul’da hangi temizlik hizmetleri için referans var?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yorumlarda ofis temizliği, ev ve apartman temizliği, inşaat sonrası temizlik, halı ve koltuk yıkama gibi hizmet deneyimleri yer alır. Hizmet etiketi olan yorumlarda ilgili alan belirtilmiştir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Yorum yapmak veya teklif almak için ne yapmalıyım?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Teklif ve randevu için iletişim sayfamızdan veya telefon hattımızdan bize ulaşabilirsiniz. Hizmet sonrası geri bildiriminiz operasyon ekibimizle paylaşılır.',
        },
      },
    ],
  };
}

export function buildReferanslarWebPageJsonLd(
  rows: PublicTestimonialRow[],
  description: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_ORIGIN}/referanslar#webpage`,
    url: `${SITE_ORIGIN}/referanslar`,
    name: 'Referanslar | Günen Temizlik',
    description,
    isPartOf: { '@type': 'WebSite', name: 'Günen Temizlik', url: SITE_ORIGIN },
    about: { '@id': BUSINESS_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rows.length,
      name: 'Müşteri yorumları',
    },
  };
}
