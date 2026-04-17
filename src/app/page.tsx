/**
 * @fileoverview Home Page
 * @description Ana sayfa - Günen Temizlik kurumsal web sitesi giriş sayfası.
 * SEO optimizasyonu, structured data ve lazy loading ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Suspense boundaries ile streaming
 * - Dynamic imports ile code splitting
 * - JSON-LD structured data ile zengin SEO
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import SiteLayout from './site/layout';
import { canonicalUrl } from '@/lib/seo';
import DeferredHomeSections from '@/components/site/DeferredHomeSections';
import { keywordsForPage } from '@/lib/seo-keywords';

// ============================================
// DYNAMIC IMPORTS (Code Splitting)
// ============================================

const Hero = dynamic(() => import('@/components/site/Hero').then(mod => mod.Hero), {
  loading: () => <div className="min-h-[100dvh] min-h-screen bg-slate-100 animate-pulse" />,
});

const Services = dynamic(() => import('@/components/site/Services').then(mod => mod.Services), {
  loading: () => <div className="h-96 bg-slate-50 animate-pulse" />,
});

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'İstanbul Temizlik Şirketi | Ev, Ofis, İnşaat Sonrası | Günen',
  description:
    'İstanbul genelinde ev temizliği, ofis temizliği, inşaat sonrası temizlik, koltuk ve halı temizliği. Hızlı teklif, 7/24 destek ve ücretsiz keşif.',
  keywords: keywordsForPage('home'),
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    title: "Günen Temizlik | İstanbul'da Profesyonel Temizlik Hizmetleri",
    description:
      'İstanbul genelinde ev, ofis ve inşaat sonrası temizlik çözümleri. Hızlı teklif ve 7/24 destek ile randevunuzu oluşturun.',
    url: canonicalUrl('/'),
    siteName: "Günen Temizlik",
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: "Günen Temizlik - İstanbul Profesyonel Temizlik",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  robots: {
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

// ============================================
// LOADING FALLBACKS
// ============================================

function SectionLoading({ height = "h-96" }: { height?: string }) {
  return (
    <div className={`${height} bg-slate-100 animate-pulse flex items-center justify-center`}>
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Home Page Component
 * Ana sayfa - tüm bileşenleri Suspense ile sarmalar.
 * Her bileşen ayrı ayrı yüklenir (streaming).
 */
export default function HomePage() {
  return (
    <>
      <SiteLayout>
        {/* Hero - First Contentful Paint için öncelikli */}
        <Suspense fallback={<SectionLoading height="h-screen" />}>
          <Hero />
        </Suspense>

        {/* Services */}
        <Suspense fallback={<SectionLoading height="h-96" />}>
          <Services />
        </Suspense>

        {/* Below-the-fold sections (client-only deferred) */}
        <DeferredHomeSections />
      </SiteLayout>
    </>
  );
}
