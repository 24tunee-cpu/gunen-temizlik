/**
 * @fileoverview Contact Page
 * @description İletişim sayfası - form ve iletişim bilgileri.
 * SEO optimizasyonu, structured data ve müşteri dönüşüm odaklı tasarım.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (Organization + ContactPoint)
 * - Lead generation optimized
 * - Admin'e otomatik bildirim desteği
 *
 * @admin-sync
 * Form gönderimleri admin paneldeki /admin/talepler sayfasına düşer.
 * Bildirim ayarları admin panelden yapılandırılabilir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { ContactForm } from '@/components/site/ContactForm';
import { SITE_CONTACT, toTelHref } from '@/config/site-contact';
import { canonicalUrl, getSiteUrl } from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'İletişim | İstanbul Temizlik Teklif Hattı | Günen',
  description: `İstanbul genelinde temizlik teklifi ve randevu için hemen ulaşın: ${SITE_CONTACT.phoneDisplay}. Ev, ofis, inşaat sonrası ve koltuk-halı temizliği için hızlı geri dönüş alın.`,
  keywords: keywordsForPage('iletisim'),
  alternates: {
    canonical: canonicalUrl('/iletisim'),
  },
  openGraph: {
    title: 'İletişim | İstanbul Temizlik Teklif Hattı | Günen',
    description: 'İstanbul genelinde temizlik teklifi, randevu ve keşif talepleri için hızlı iletişim kanalları.',
    url: canonicalUrl('/iletisim'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - İletişim',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İletişim | İstanbul Temizlik Teklif Hattı | Günen',
    description: 'İstanbul genelinde temizlik teklifi, randevu ve keşif talepleri için hızlı iletişim kanalları.',
    images: [canonicalUrl('/logo.png')],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (ContactPoint)
// ============================================

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Günen Temizlik Şirketi",
  "url": getSiteUrl(),
  "logo": canonicalUrl('/logo.png'),
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": SITE_CONTACT.phoneE164,
      "email": SITE_CONTACT.email,
      "contactType": "customer service",
      "availableLanguage": ["Turkish"],
      "areaServed": "TR",
      "hoursAvailable": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      }
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": SITE_CONTACT.addressLine,
    "addressLocality": SITE_CONTACT.addressLocality,
    "addressRegion": SITE_CONTACT.addressRegion,
    "postalCode": SITE_CONTACT.postalCode,
    "addressCountry": SITE_CONTACT.addressCountry
  }
};

// ============================================
// CONTACT INFO CONFIG
// ============================================

/** İletişim bilgileri - Admin panelden dinamik çekilebilir */
const CONTACT_INFO = {
  phone: {
    label: 'Telefon',
    value: SITE_CONTACT.phoneDisplay,
    href: toTelHref(SITE_CONTACT.phoneE164),
    icon: Phone,
    description: '7/24 ulaşabilirsiniz',
  },
  email: {
    label: 'E-posta',
    value: SITE_CONTACT.email,
    href: `mailto:${SITE_CONTACT.email}`,
    icon: Mail,
    description: '24 saat içinde dönüş yapıyoruz',
  },
  address: {
    label: 'Adres',
    value: SITE_CONTACT.addressLine,
    href: `https://www.google.com/maps?q=${encodeURIComponent(SITE_CONTACT.addressLine)}`,
    icon: MapPin,
    description: 'Tüm İstanbul\'da hizmet veriyoruz',
  },
  hours: {
    label: 'Çalışma Saatleri',
    value: '24 saat açık',
    icon: Clock,
    description: 'Acil durumlar için her zaman hazırız',
  },
} as const;

// ============================================
// LOADING FALLBACK
// ============================================

function ContactLoading() {
  return (
    <div className="bg-slate-900 py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="h-96 rounded-2xl bg-slate-800" />
          <div className="h-96 rounded-2xl bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Contact Page Component
 * İletişim sayfası - form ve bilgiler.
 * 
 * @admin-sync Form gönderimleri /admin/talepler'e düşer
 */
export default function ContactPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />

      <SiteLayout>
        {/* Hero Section */}
        <section
          className="bg-slate-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              İletişim
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              Bize ulaşın, size en uygun temizlik çözümlerini sunalım.
              Ücretsiz keşif için hemen form doldurun.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section
          className="border-t border-slate-800 bg-slate-900 py-12"
          aria-label="İletişim bilgileri"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(CONTACT_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const hasHref = 'href' in info && info.href !== undefined;

                const CardContent = (
                  <>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 transition-colors group-hover:bg-emerald-500/25">
                      <Icon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                    </div>
                    <h2 className="mb-1 text-lg font-semibold text-white">
                      {info.label}
                    </h2>
                    <p className="mb-2 font-medium text-emerald-400">
                      {info.value}
                    </p>
                    <p className="text-center text-sm text-slate-400">
                      {info.description}
                    </p>
                  </>
                );

                const cardClass =
                  'group flex flex-col items-center rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-sm backdrop-blur-sm';

                // Hours item doesn't have href, render as div
                if (!hasHref) {
                  return (
                    <div key={key} className={cardClass}>
                      {CardContent}
                    </div>
                  );
                }

                return (
                  <a
                    key={key}
                    href={info.href as string}
                    className={`${cardClass} transition-shadow hover:border-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  >
                    {CardContent}
                  </a>
                );
              })}
            </div>

            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Hızlı geçiş
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { href: '/randevu', label: 'Randevu Oluştur' },
                  { href: '/hizmetler', label: 'Hizmetlerimiz' },
                  { href: '/hizmetler/ofis-temizligi', label: 'Ofis Temizliği' },
                  { href: '/hizmetler/insaat-sonrasi-temizlik', label: 'İnşaat Sonrası' },
                  { href: '/blog', label: 'Blog Rehberleri' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form with Suspense */}
        <Suspense fallback={<ContactLoading />}>
          <ContactForm variant="dark" />
        </Suspense>
      </SiteLayout>
    </>
  );
}
