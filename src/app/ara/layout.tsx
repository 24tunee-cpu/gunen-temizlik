import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemaGraph,
} from '@/lib/seo';

const araTitle = 'Sitede ara | Günen Temizlik';
const araDescription = 'Blog, hizmetler ve sık sorulan sorularda arama yapın.';

export const metadata: Metadata = {
  title: araTitle,
  description: araDescription,
  alternates: { canonical: canonicalUrl('/ara') },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  openGraph: {
    title: araTitle,
    description: araDescription,
    url: canonicalUrl('/ara'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Site içi arama',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: araTitle,
    description: araDescription,
    images: [canonicalUrl('/logo.png')],
  },
};

const araJsonLd = serializeSchemaGraph([
  generateWebPageSchema({
    path: '/ara',
    title: araTitle,
    description: araDescription,
  }),
  generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Sitede ara', url: '/ara' },
  ]) as Record<string, unknown>,
]);

export default function AraLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: araJsonLd }} />
      {children}
    </>
  );
}
