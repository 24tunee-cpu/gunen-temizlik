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
import { HelpCircle } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | Günen Temizlik - İstanbul',
  description:
    'İstanbul profesyonel temizlik: fiyatlandırma, ofis ve ev temizliği, inşaat sonrası, koltuk yıkama, randevu ve bölgeler hakkında yanıtlar. Günen Temizlik SSS.',
  keywords: [
    'istanbul temizlik şirketi',
    'profesyonel temizlik istanbul',
    'ofis temizliği fiyat',
    'inşaat sonrası temizlik süresi',
    'koltuk yıkama yerinde',
    'temizlik şirketi nasıl seçilir',
    'günen temizlik sss',
    'ücretsiz keşif temizlik',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/sss',
  },
  openGraph: {
    title: 'Sıkça Sorulan Sorular | Günen Temizlik',
    description:
      'İstanbul temizlik fiyatı, bölgeler, inşaat sonrası, ofis ve ev temizliği, koltuk yıkama ve randevu — kısa ve net yanıtlar.',
    url: 'https://gunentemizlik.com/sss',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-faq.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Sıkça Sorulan Sorular',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sıkça Sorulan Sorular | Günen Temizlik',
    description:
      'İstanbul temizlik fiyatı, bölgeler, inşaat sonrası, ofis ve ev temizliği, koltuk yıkama ve randevu — kısa ve net yanıtlar.',
    images: ['https://gunentemizlik.com/og-faq.jpg'],
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
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-32 pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <HelpCircle className="mx-auto mb-6 h-16 w-16 text-emerald-400" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Sıkça Sorulan Sorular
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
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
