import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | KVKK ve Veri Güvenliği | Günen',
  description:
    'Günen Temizlik gizlilik politikası: İstanbul temizlik hizmetlerinde kişisel verilerin işlenmesi, KVKK kapsamı ve veri güvenliği yaklaşımı.',
  alternates: {
    canonical: canonicalUrl('/gizlilik'),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Gizlilik Politikası | Günen Temizlik',
    description:
      'Kişisel veriler, KVKK uyumu ve veri güvenliği süreçleri hakkında güncel gizlilik politikamızı inceleyin.',
    url: canonicalUrl('/gizlilik'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Gizlilik Politikası',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gizlilik Politikası | Günen Temizlik',
    description: 'KVKK ve veri güvenliği süreçlerimiz hakkında detaylı bilgi alın.',
    images: [canonicalUrl('/logo.png')],
  },
};

export default function GizlilikLayout({ children }: { children: ReactNode }) {
  return children;
}
