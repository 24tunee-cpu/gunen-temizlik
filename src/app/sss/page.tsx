/**
 * @fileoverview FAQ Page (SSS)
 * @description Sıkça Sorulan Sorular sayfası.
 * SEO optimizasyonu, JSON-LD FAQPage schema ve admin'den dinamik içerik desteği ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (FAQPage schema)
 * - Dynamic FAQ data from admin panel
 * - Suspense boundary for streaming
 *
 * @admin-sync
 * Admin paneldeki SSS yönetiminden içerik otomatik çekilir.
 * /admin/sss sayfasından güncellenebilir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { FAQSection } from '../../components/site/FAQSection';
import { faqPageJsonLdObject } from '@/lib/seed-faq';
import { canonicalUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';
import { HelpCircle } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Temizlik SSS | İstanbul Fiyat ve Hizmet Süreci',
  description:
    'İstanbul temizlik hizmetlerinde fiyat, süreç, randevu, ilçe kapsamı ve hizmet detayları hakkında en sık sorulan sorulara net yanıtlar.',
  keywords: keywordsForPage('sss'),
  alternates: {
    canonical: canonicalUrl('/sss'),
  },
  openGraph: {
    title: 'Temizlik SSS | Günen Temizlik',
    description:
      'İstanbul temizlik fiyatı, hizmet kapsamı, randevu ve ilçe bazlı hizmet akışı hakkında kısa ve net yanıtlar.',
    url: canonicalUrl('/sss'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Sıkça Sorulan Sorular',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Temizlik SSS | Günen Temizlik',
    description:
      'İstanbul temizlik fiyatı, hizmet kapsamı, randevu ve ilçe bazlı hizmet akışı hakkında kısa ve net yanıtlar.',
    images: [canonicalUrl('/logo.png')],
  },
};

const faqStructuredData = faqPageJsonLdObject();

// ============================================
// LOADING FALLBACK
// ============================================

function FAQLoading() {
  return (
    <div className="bg-slate-900 py-16 animate-pulse">
      <div className="mx-auto max-w-3xl px-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-700" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * FAQ Page Component
 * Sıkça sorulan sorular sayfası.
 * 
 * @admin-sync İçerik admin paneldeki /admin/sss sayfasından yönetilir
 */
export default function FAQPage() {
  return (
    <>
      {/* JSON-LD FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <HelpCircle className="mx-auto mb-6 h-14 w-14 text-emerald-400 sm:h-16 sm:w-16" aria-hidden="true" />
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Sıkça Sorulan Sorular
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg">
              Aklınıza takılan soruların cevaplarını burada bulabilirsiniz.
              Başka sorularınız için bize ulaşmaktan çekinmeyin.
            </p>
          </div>
        </section>

        {/* FAQ Section with Suspense */}
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense fallback={<FAQLoading />}>
            <FAQSection />
          </Suspense>
        </div>

        {/* Additional CTA */}
        <section className="flex-1 border-t border-slate-800 bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Sorunuzun cevabını bulamadınız mı?
            </h2>
            <p className="mb-6 text-slate-300">
              Size özel çözümler sunmak için buradayız.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Bize Ulaşın
            </Link>
          </div>
        </section>
        </div>
      </SiteLayout>
    </>
  );
}
