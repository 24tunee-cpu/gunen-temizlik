import type { Metadata } from 'next';
import ServicesPageClient from '@/components/site/ServicesPageClient';
import { prisma } from '@/lib/prisma';
import { canonicalUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';

export const metadata: Metadata = {
  title: 'İstanbul Temizlik Hizmetleri | Ev, Ofis, İnşaat Sonrası | Günen',
  description:
    'İstanbul genelinde ev temizliği, ofis temizliği, inşaat sonrası temizlik, koltuk-halı yıkama ve dış cephe dahil profesyonel hizmetleri inceleyin.',
  keywords: keywordsForPage('hizmetler'),
  alternates: {
    canonical: canonicalUrl('/hizmetler'),
  },
  openGraph: {
    title: 'İstanbul Temizlik Hizmetleri | Günen',
    description:
      'İstanbul genelinde ev, ofis, inşaat sonrası, koltuk-halı ve dış cephe temizlik çözümlerini karşılaştırın.',
    url: canonicalUrl('/hizmetler'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik Hizmetleri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İstanbul Temizlik Hizmetleri | Günen',
    description:
      'İstanbul genelinde ev, ofis, inşaat sonrası, koltuk-halı ve dış cephe temizlik çözümlerini karşılaştırın.',
    images: [canonicalUrl('/logo.png')],
  },
};

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Hizmetlerimiz',
  url: canonicalUrl('/hizmetler'),
  about: 'Profesyonel temizlik hizmetleri',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Ana Sayfa',
      item: canonicalUrl('/'),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Hizmetlerimiz',
      item: canonicalUrl('/hizmetler'),
    },
  ],
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      shortDesc: true,
      features: true,
    },
  });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: service.title,
      url: canonicalUrl(`/hizmetler/${service.slug}`),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <ServicesPageClient services={services} />
    </>
  );
}
