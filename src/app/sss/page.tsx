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
import SiteLayout from '../site/layout';
import { FAQSection } from '../../components/site/FAQSection';
import { HelpCircle } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | Günen Temizlik - İstanbul',
  description: 'İstanbul temizlik hizmetlerimiz hakkında sıkça sorulan sorular ve detaylı cevapları. Fiyatlar, hizmet bölgeleri, randevu ve daha fazlası.',
  keywords: [
    'temizlik fiyatları',
    'istanbul temizlik ücretleri',
    'ofis temizliği ne kadar',
    'inşaat sonrası temizlik fiyatları',
    'temizlik şirketi nasıl seçilir',
    'günen temizlik ssb',
    'temizlik hizmetleri istanbul',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/sss',
  },
  openGraph: {
    title: 'Sıkça Sorulan Sorular | Günen Temizlik',
    description: 'Temizlik hizmetlerimiz hakkında merak edilen tüm soruların cevapları burada.',
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
    description: 'Temizlik hizmetlerimiz hakkında merak edilen tüm soruların cevapları.',
    images: ['https://gunentemizlik.com/og-faq.jpg'],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (FAQPage Schema)
// ============================================

// Bu veriler admin panelden dinamik olarak çekilebilir
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "İstanbul temizlik şirketi fiyatları ne kadar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "İstanbul'da temizlik şirketi fiyatları hizmet türüne göre değişir. Ofis temizliği 300-800₺, ev temizliği 400-1000₺, inşaat sonrası temizlik 500-1500₺ arasında değişmektedir. Detaylı fiyat için ücretsiz keşif hizmetimizden yararlanabilirsiniz."
      }
    },
    {
      "@type": "Question",
      "name": "Günen Temizlik hangi bölgelerde hizmet veriyor?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Tüm İstanbul'da hizmet vermekteyiz. Ataşehir, Kadıköy, Üsküdar, Beşiktaş, Şişli, Maltepe, Pendik ve tüm ilçelerde 7/24 profesyonel temizlik hizmeti sunuyoruz."
      }
    },
    {
      "@type": "Question",
      "name": "İnşaat sonrası temizlik ne kadar sürer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "İnşaat sonrası temizlik süresi alanın büyüklüğüne göre değişir. 100m² bir daire ortalama 4-6 saat, 200m² bir ofis 6-8 saat sürmektedir."
      }
    },
    {
      "@type": "Question",
      "name": "Randevu almak için ne yapmalıyım?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Web sitemizdeki iletişim formunu doldurabilir, 0850 123 45 67 numaralı telefondan bizi arayabilir veya WhatsApp üzerinden yazabilirsiniz. 7/24 hizmet vermekteyiz."
      }
    },
    {
      "@type": "Question",
      "name": "Kullandığınız temizlik malzemeleri güvenli mi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Evet, kullandığımız tüm temizlik malzemeleri insan sağlığına ve çevreye zararsız, sertifikalı ürünlerdir. Özellikle hassas alerjisi olan kişiler için de güvenlidir."
      }
    }
  ]
};

// ============================================
// LOADING FALLBACK
// ============================================

function FAQLoading() {
  return (
    <div className="py-16 animate-pulse">
      <div className="mx-auto max-w-3xl px-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
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
        <Suspense fallback={<FAQLoading />}>
          <FAQSection />
        </Suspense>

        {/* Additional CTA */}
        <section className="py-16 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Sorunuzun cevabını bulamadınız mı?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Size özel çözümler sunmak için buradayız.
            </p>
            <a
              href="/iletisim"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Bize Ulaşın
            </a>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
