/**
 * @fileoverview Pricing Page
 * @description Fiyat listesi sayfası - şeffaf ve rekabetçi temizlik fiyatları.
 * SEO optimizasyonu, structured data ve admin-site senkronizasyonu ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (Product/Offer schema)
 * - Dynamic pricing from admin panel
 * - Conversion optimized design
 *
 * @admin-sync
 * Fiyatlar admin paneldeki /admin/fiyatlar sayfasından yönetilir.
 * Paketler ve kampanyalar admin panelden güncellenir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { PricingSection } from '../../components/site/PricingSection';
import { DollarSign, ArrowRight, Phone } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Fiyat Listesi | Günen Temizlik - İstanbul',
  description: 'Şeffaf ve rekabetçi temizlik fiyatlarımız. İnşaat sonrası, ofis, ev temizliği ve daha fazlası. Ücretsiz keşif, uygun fiyat garantisi.',
  keywords: [
    'temizlik fiyatları',
    'istanbul temizlik ücretleri',
    'ofis temizliği fiyatı',
    'ev temizliği fiyatları',
    'inşaat sonrası temizlik fiyatları',
    'koltuk yıkama fiyatları',
    'halı temizliği fiyatları',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/fiyatlar',
  },
  openGraph: {
    title: 'Fiyat Listesi | Günen Temizlik',
    description: 'Şeffaf ve rekabetçi temizlik fiyatlarımız. Ücretsiz keşif, uygun fiyat garantisi.',
    url: 'https://gunentemizlik.com/fiyatlar',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-pricing.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Fiyat Listesi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fiyat Listesi | Günen Temizlik',
    description: 'Şeffaf ve rekabetçi temizlik fiyatlarımız.',
    images: ['https://gunentemizlik.com/og-pricing.jpg'],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (Product/Offer)
// ============================================

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Günen Temizlik Hizmetleri",
  "description": "Profesyonel temizlik hizmetleri - inşaat sonrası, ofis, ev temizliği",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Günen Temizlik Şirketi",
    "url": "https://gunentemizlik.com"
  },
  "areaServed": {
    "@type": "City",
    "name": "İstanbul"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Temizlik Hizmetleri",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Service",
          "name": "Ofis Temizliği",
          "description": "Profesyonel ofis temizliği hizmetleri"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Service",
          "name": "Ev Temizliği",
          "description": "Kapsamlı ev temizliği hizmetleri"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Service",
          "name": "İnşaat Sonrası Temizlik",
          "description": "İnşaat sonrası detaylı temizlik"
        }
      }
    ]
  }
};

// ============================================
// LOADING FALLBACK
// ============================================

function PricingLoading() {
  return (
    <div className="py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"
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
 * Pricing Page Component
 * Fiyat listesi sayfası - rekabetçi ve şeffaf fiyatlar.
 * 
 * @admin-sync Fiyatlar /admin/fiyatlar'dan yönetilir
 */
export default function PricingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />

      <SiteLayout>
        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-32 pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <DollarSign
              className="mx-auto mb-6 h-16 w-16 text-emerald-400"
              aria-hidden="true"
            />
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Fiyat Listesi</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
              Şeffaf ve rekabetçi fiyatlarla profesyonel temizlik hizmetleri.
              Ücretsiz keşif ve uygun fiyat garantisi.
            </p>
          </div>
        </section>

        {/* Pricing Section with Suspense */}
        <Suspense fallback={<PricingLoading />}>
          <PricingSection />
        </Suspense>

        {/* Custom Quote CTA */}
        <section className="py-16 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Size özel bir teklif mi istiyorsunuz?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Projeleriniz için özel fiyatlandırma yapalım.
              Ücretsiz keşif hizmetimizden yararlanın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
                Ücretsiz Keşif Talep Edin
              </Link>
              <a
                href="tel:+905551234567"
                className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                0555 123 45 67
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Link */}
        <section className="py-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Fiyatlandırma hakkında sık sorulan soruların cevaplarını görmek ister misiniz?
            </p>
            <Link
              href="/sss"
              className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
            >
              Sıkça Sorulan Sorular
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
