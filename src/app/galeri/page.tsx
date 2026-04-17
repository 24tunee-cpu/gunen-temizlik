/**
 * @fileoverview Gallery Page
 * @description Galeri sayfası - çalışma örnekleri ve before/after görselleri.
 * SEO optimizasyonu, structured data ve admin-site senkronizasyonu ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (ImageGallery schema)
 * - Lazy loading optimized images
 * - Admin'den yönetilen dinamik galeri
 *
 * @admin-sync
 * Galeri görselleri admin paneldeki /admin/galeri sayfasından yönetilir.
 * Before/after karşılaştırmaları admin panelden eklenebilir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { GallerySection } from '../../components/site/GallerySection';
import { ImageIcon, ArrowRight } from 'lucide-react';
import { canonicalUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Temizlik Öncesi/Sonrası Galeri | İstanbul | Günen',
  description:
    'İstanbul genelindeki temizlik uygulamalarımızdan önce/sonra görselleri inceleyin. Ev, ofis ve inşaat sonrası projelerden örnekler.',
  keywords: keywordsForPage('galeri'),
  alternates: {
    canonical: canonicalUrl('/galeri'),
  },
  openGraph: {
    title: 'Temizlik Öncesi/Sonrası Galeri | Günen',
    description:
      'İstanbul genelindeki temizlik uygulamalarımızdan önce/sonra görsellerini inceleyerek hizmet kalitesini değerlendirin.',
    url: canonicalUrl('/galeri'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Galeri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temizlik Öncesi/Sonrası Galeri | Günen',
    description: 'İstanbul temizlik projelerinden önce/sonra görsellerini inceleyin.',
    images: [canonicalUrl('/logo.png')],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (ImageGallery)
// ============================================

const gallerySchema = {
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "name": "Günen Temizlik Galeri",
  "description": "Temizlik çalışmalarımızdan örnekler ve before/after görselleri",
  "url": canonicalUrl('/galeri'),
  "isPartOf": {
    "@type": "WebSite",
    "name": "Günen Temizlik",
    "url": canonicalUrl('/')
  },
  "about": {
    "@type": "CleaningService",
    "name": "Günen Temizlik Şirketi"
  }
};

// ============================================
// LOADING FALLBACK
// ============================================

function GalleryLoading() {
  return (
    <div className="bg-slate-900 py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-700 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Gallery Page Component
 * Galeri sayfası - çalışma örnekleri.
 * 
 * @admin-sync Görseller /admin/galeri'den yönetilir
 */
export default function GalleryPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <ImageIcon
              className="mx-auto mb-6 h-14 w-14 text-emerald-400 sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Galeri</h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg">
              Çalışmalarımızdan örnekler ve başarı hikayelerimiz.
              Profesyonel temizlik hizmetlerimizin sonuçlarını görün.
            </p>
          </div>
        </section>

        {/* Gallery Section with Suspense */}
        <Suspense fallback={<GalleryLoading />}>
          <GallerySection />
        </Suspense>

        {/* CTA Section */}
        <section className="flex-1 border-t border-slate-800 bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Siz de memnun müşterilerimiz arasına katılın
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Profesyonel temizlik hizmetimizi deneyimleyin ve farkı kendi gözlerinizle görün.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Ücretsiz Keşif Talep Edin
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
        </div>
      </SiteLayout>
    </>
  );
}
