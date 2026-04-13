import type { Metadata } from 'next';
import ServicesPageClient from '@/components/site/ServicesPageClient';

export const metadata: Metadata = {
  title: 'Hizmetlerimiz | Günen Temizlik - İstanbul',
  description:
    'İstanbul genelinde profesyonel ofis temizliği, inşaat sonrası temizlik, koltuk yıkama, halı temizliği ve detaylı hijyen hizmetlerimizi keşfedin.',
  keywords: [
    'istanbul temizlik hizmetleri',
    'ofis temizliği istanbul',
    'inşaat sonrası temizlik',
    'koltuk yıkama istanbul',
    'halı temizliği hizmeti',
    'profesyonel temizlik şirketi',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/hizmetler',
  },
  openGraph: {
    title: 'Hizmetlerimiz | Günen Temizlik',
    description:
      'İstanbul için profesyonel temizlik çözümleri: ofis, inşaat sonrası, koltuk ve halı temizliği.',
    url: 'https://gunentemizlik.com/hizmetler',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-services.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik Hizmetleri',
      },
    ],
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

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ServicesPageClient />
    </>
  );
}
