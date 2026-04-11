/**
 * @fileoverview References Page
 * @description Müşteri referansları ve yorumlar sayfası.
 * SEO optimizasyonu, istatistikler ve admin'den dinamik yorumlar ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (AggregateRating schema)
 * - Dynamic testimonials from admin panel
 * - Suspense boundary for streaming
 *
 * @admin-sync
 * Müşteri yorumları admin paneldeki /admin/referanslar sayfasından yönetilir.
 * İstatistikler admin panelden dinamik olarak güncellenebilir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { Testimonials } from '@/components/site/Testimonials';
import { Star, Users, Award } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: "Referanslar | Günen Temizlik - Müşteri Yorumları",
  description: "Günen Temizlik müşteri yorumları ve referansları. 5000+ mutlu müşteri ve %98 memnuniyet oranı. İstanbul'un en güvenilir temizlik şirketi.",
  keywords: [
    'günen temizlik yorumları',
    'istanbul temizlik referansları',
    'müşteri memnuniyeti',
    'temizlik şirketi yorumları',
    'ofis temizliği referans',
    'ev temizliği yorumları',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/referanslar',
  },
  openGraph: {
    title: "Referanslar | Günen Temizlik - Müşteri Yorumları",
    description: "5000+ mutlu müşteri ve %98 memnuniyet oranı. Müşterilerimizin hakkımızda söylediklerini okuyun.",
    url: 'https://gunentemizlik.com/referanslar',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-references.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Müşteri Yorumları ve Referanslar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Referanslar | Günen Temizlik",
    description: "5000+ mutlu müşterimizin yorumlarını okuyun.",
    images: ['https://gunentemizlik.com/og-references.jpg'],
  },
};

// ============================================
// STATISTICS (Admin'den dinamik çekilebilir)
// ============================================

// Bu veriler admin panelden dinamik olarak çekilebilir
const STATS_CONFIG = [
  { icon: Users, value: '5000+', label: 'Mutlu Müşteri' },
  { icon: Star, value: '%98', label: 'Memnuniyet Oranı' },
  { icon: Award, value: '15+', label: 'Yıllık Deneyim' },
] as const;

// ============================================
// JSON-LD STRUCTURED DATA (AggregateRating)
// ============================================

const ratingStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Günen Temizlik Şirketi",
  "image": "https://gunentemizlik.com/logo.png",
  "url": "https://gunentemizlik.com/referanslar",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "5000",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Ahmet Yılmaz" },
      "datePublished": "2024-01-15",
      "reviewBody": "Ofis temizliği için Günen Temizlik'i tercih ettik. Çok profesyonel bir ekip. Herkese tavsiye ederim.",
      "reviewRating": { "@type": "Rating", "ratingValue": "5" }
    },
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Ayşe Kaya" },
      "datePublished": "2024-02-10",
      "reviewBody": "İnşaat sonrası temizlik için geldiler. Titiz çalışıyorlar, her yer pırıl pırıl oldu.",
      "reviewRating": { "@type": "Rating", "ratingValue": "5" }
    }
  ]
};

// ============================================
// COMPONENTS
// ============================================

/**
 * Statistics Section Component
 * @admin-sync Bu istatistikler admin panelden dinamik olarak güncellenebilir
 */
function StatsSection() {
  return (
    <section
      className="bg-slate-50 py-16 dark:bg-slate-800"
      aria-label="İstatistikler"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {STATS_CONFIG.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-white dark:bg-slate-700 shadow-sm"
              >
                <Icon
                  className="mx-auto mb-4 h-12 w-12 text-emerald-500"
                  aria-hidden="true"
                />
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Testimonials Loading Fallback
 */
function TestimonialsLoading() {
  return (
    <div className="py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto mb-12" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"
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
 * References Page Component
 * Müşteri referansları ve yorumlar sayfası.
 * 
 * @admin-sync Yorumlar admin paneldeki /admin/referanslar sayfasından yönetilir
 */
export default function ReferencesPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ratingStructuredData) }}
      />

      <SiteLayout>
        {/* Hero Section */}
        <section
          className="bg-slate-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Referanslar
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Müşterilerimizin bizim hakkımızda söyledikleri.
              Güven ve memnuniyet odaklı çalışıyoruz.
            </p>
          </div>
        </section>

        {/* Statistics */}
        <StatsSection />

        {/* Testimonials with Suspense */}
        <Suspense fallback={<TestimonialsLoading />}>
          <Testimonials />
        </Suspense>

        {/* Trust Indicators */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Siz de memnun müşterilerimiz arasına katılın
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Profesyonel temizlik hizmetimizi deneyimleyin ve farkı görün.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:text-base"
            >
              Ücretsiz Keşif Talep Edin
            </Link>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
