import { prisma } from '@/lib/prisma';
import { SITE_CONTACT } from '@/config/site-contact';
import { getSiteUrl } from '@/lib/seo';

const SITE_ORIGIN = getSiteUrl();
const BUSINESS_ID = `${SITE_ORIGIN}/#business`;

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
 * Referanslar sayfası JSON-LD (Google uyumlu güvenli sürüm):
 * - LocalBusiness düğümünü temel işletme bilgileriyle verir.
 * - Self-serving review snippet reddi yaşamamak için aggregateRating/review eklenmez.
 *   (Google, işletmenin kendi sitesindeki Organization/LocalBusiness puanlarını
 *    rich result olarak çoğunlukla kabul etmez.)
 */
export function buildReferanslarLocalBusinessJsonLd(rows: PublicTestimonialRow[]) {
  const localBusiness: Record<string, unknown> = {
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
  return localBusiness;
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
          text: `Evet. ${SITE_ORIGIN}/referanslar sayfasındaki yorumlar yönetim panelinden yayınlanan aktif müşteri referanslarıdır; her yorum için isim ve metin site üzerinde görünür.`,
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
