import type { Metadata } from 'next';
import ServicesPageClient from '@/components/site/ServicesPageClient';
import { prisma } from '@/lib/prisma';
import { canonicalUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';

export const metadata: Metadata = {
  title: 'Hizmetlerimiz | Günen Temizlik - İstanbul',
  description:
    'İstanbul genelinde profesyonel ofis temizliği, inşaat sonrası temizlik, koltuk yıkama, halı temizliği ve detaylı hijyen hizmetlerimizi keşfedin.',
  keywords: keywordsForPage('hizmetler'),
  alternates: {
    canonical: canonicalUrl('/hizmetler'),
  },
  openGraph: {
    title: 'Hizmetlerimiz | Günen Temizlik',
    description:
      'İstanbul için profesyonel temizlik çözümleri: ofis, inşaat sonrası, koltuk ve halı temizliği.',
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
    title: 'Hizmetlerimiz | Günen Temizlik',
    description:
      'İstanbul için profesyonel temizlik çözümleri: ofis, inşaat sonrası, koltuk ve halı temizliği.',
    images: [canonicalUrl('/logo.png')],
  },
};

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Hizmetlerimiz',
  url: 'https://gunentemizlik.com/hizmetler',
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
      item: 'https://gunentemizlik.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Hizmetlerimiz',
      item: 'https://gunentemizlik.com/hizmetler',
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
      url: `https://gunentemizlik.com/hizmetler/${service.slug}`,
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
