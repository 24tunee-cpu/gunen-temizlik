/**
 * @fileoverview About Page
 * @description Hakkımızda sayfası - şirket hikayesi, değerler ve ekip.
 * SEO optimizasyonu, structured data ve admin-site senkronizasyonu ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (Organization schema)
 * - Static content with admin-sync potential
 * - TeamSection integration
 *
 * @admin-sync
 * İstatistikler ve değerler admin panelden dinamik olarak güncellenebilir.
 * Ekip üyeleri /admin/ekip sayfasından yönetilir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { TeamSection } from '../../components/site/TeamSection';
import { SITE_CONTACT } from '@/config/site-contact';
import { canonicalUrl, getSiteUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';
import { Sparkles, Shield, Users, Award, Clock, Heart, ArrowRight } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: "Hakkımızda | Günen Temizlik - İstanbul",
  description:
    "15+ yıllık deneyimle İstanbul'un her bölgesinde profesyonel temizlik hizmetleri sunuyoruz. Güvenilir ekip, şeffaf süreç ve tekrarlayan müşteri memnuniyeti odağı.",
  keywords: keywordsForPage('hakkimizda'),
  alternates: {
    canonical: canonicalUrl('/hakkimizda'),
  },
  openGraph: {
    title: "Hakkımızda | Günen Temizlik",
    description:
      "15+ yıllık deneyim, İstanbul genelinde profesyonel temizlik. Güvenilir ekip ve şeffaf iletişim.",
    url: canonicalUrl('/hakkimizda'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Hakkımızda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hakkımızda | Günen Temizlik",
    description: "15+ yıllık deneyim, İstanbul genelinde profesyonel temizlik.",
    images: [canonicalUrl('/logo.png')],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (Organization)
// ============================================

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Günen Temizlik Şirketi",
  "alternateName": "Günen Temizlik",
  "url": getSiteUrl(),
  "logo": canonicalUrl('/logo.png'),
  "description": "İstanbul'un önde gelen profesyonel temizlik şirketi. 15+ yıllık deneyim ve kurumsal süreklilik odağı.",
  "foundingDate": "2009",
  "founders": [
    {
      "@type": "Person",
      "name": "Günen Temizlik Kurucuları"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": SITE_CONTACT.addressLine,
    "addressLocality": SITE_CONTACT.addressLocality,
    "addressRegion": SITE_CONTACT.addressRegion,
    "postalCode": SITE_CONTACT.postalCode,
    "addressCountry": SITE_CONTACT.addressCountry
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": SITE_CONTACT.phoneE164,
    "email": SITE_CONTACT.email,
    "contactType": "customer service",
    "availableLanguage": ["Turkish"]
  },
  "sameAs": [
    "https://facebook.com/gunentemizlik",
    "https://instagram.com/gunentemizlik"
  ]
};

// ============================================
// CONSTANTS (Admin'den dinamik çekilebilir)
// ============================================

/** İstatistikler - Admin panelden güncellenebilir */
const STATS_CONFIG = [
  { value: '15+', label: 'Yıllık Deneyim', id: 'experience' },
  { value: '5000+', label: 'Mutlu Müşteri', id: 'customers' },
  { value: '50+', label: 'Profesyonel Ekip', id: 'team' },
  { value: '24 saat', label: 'Hizmet', id: 'service' },
] as const;

/** Değerler - Admin panelden güncellenebilir */
const VALUES_CONFIG = [
  { icon: Shield, title: 'Güvenilirlik', desc: 'Müşteri güvenliği bizim için her şeyden önemli', id: 'trust' },
  { icon: Award, title: 'Kalite', desc: 'En yüksek standartlarda temizlik garantisi', id: 'quality' },
  { icon: Clock, title: 'Hız', desc: 'Zamanında ve eksiksiz hizmet', id: 'speed' },
  { icon: Heart, title: 'Memnuniyet', desc: 'Müşteri memnuniyeti odaklı çalışma', id: 'satisfaction' },
] as const;

// ============================================
// LOADING FALLBACK
// ============================================

function TeamLoading() {
  return (
    <div className="py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto mb-12" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
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
 * About Page Component
 * Hakkımızda sayfası - şirket hikayesi, değerler ve ekip.
 * 
 * @admin-sync İçerik admin panelden güncellenebilir
 */
export default function AboutPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <SiteLayout>
        {/* Hero */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <Sparkles className="mx-auto mb-6 h-14 w-14 text-emerald-400 sm:h-16 sm:w-16" aria-hidden="true" />
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Hakkımızda</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
              2009 yılından beri İstanbul'un her bölgesinde profesyonel temizlik hizmetleri
              sunuyoruz. Deneyimli ekibimiz ve modern ekipmanlarımızla evinizi ve
              iş yerinizi pırıl pırıl yapıyoruz.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section
          className="bg-slate-50 dark:bg-slate-800 py-16"
          aria-label="İstatistikler"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STATS_CONFIG.map((stat) => (
                <div key={stat.id} className="text-center p-4">
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</p>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white text-center">
              Hikayemiz
            </h2>
            <article className="space-y-6 text-lg text-slate-600 dark:text-slate-300">
              <p>
                Günen Temizlik, 2009 yılında küçük bir aile işletmesi olarak kuruldu.
                İlk günden itibaren kaliteli hizmet ve müşteri memnuniyeti odaklı çalışma
                prensibiyle yolumuza devam ediyoruz.
              </p>
              <p>
                Yıllar içinde ekibimizi ve hizmet yelpazemizi genişleterek, bugün İstanbul genelinde
                kurumsal ve konut müşterileri tarafından sık tercih edilen temizlik ekiplerinden biri
                olduk. Binlerce tamamlanan operasyon ve tekrarlayan randevu talepleriyle sürekliliğimizi
                sürdürüyoruz.
              </p>
              <p>
                Profesyonel ekibimiz, modern ekipmanlarımız ve çevre dostu ürünlerimizle
                her zaman tutarlı kalite ve şeffaf iletişimle hizmet vermek için çalışıyoruz.
              </p>
            </article>
          </div>
        </section>

        {/* Values */}
        <section
          className="bg-slate-900 dark:bg-slate-950 py-16"
          aria-label="Değerlerimiz"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center text-3xl font-bold text-white">Değerlerimiz</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES_CONFIG.map((value) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.id}
                    className="rounded-2xl bg-slate-800 dark:bg-slate-800/50 p-6 text-center"
                  >
                    <Icon className="mx-auto mb-4 h-10 w-10 text-emerald-400" aria-hidden="true" />
                    <h3 className="mb-2 text-lg font-semibold text-white">{value.title}</h3>
                    <p className="text-slate-400">{value.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section with Suspense */}
        <Suspense fallback={<TeamLoading />}>
          <TeamSection />
        </Suspense>

        {/* CTA Section */}
        <section className="py-16 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Tanışmak ister misiniz?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Profesyonel ekibimiz ve kaliteli hizmetimizle tanışmak için
              hemen iletişime geçin.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Bizimle İletişime Geçin
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
