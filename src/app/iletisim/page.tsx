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
import SiteLayout from '../site/layout';
import { ContactForm } from '@/components/site/ContactForm';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: "İletişim | Günen Temizlik - İstanbul",
  description: "Günen Temizlik ile iletişime geçin. İstanbul'un her bölgesinde profesyonel temizlik hizmetleri için hemen arayın: 0555 123 45 67. Ücretsiz keşif, uygun fiyatlar.",
  keywords: [
    'istanbul temizlik iletişim',
    'günen temizlik telefon',
    'temizlik şirketi istanbul',
    'ofis temizliği fiyat al',
    'ev temizliği randevu',
    'temizlik hizmeti talep',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/iletisim',
  },
  openGraph: {
    title: "İletişim | Günen Temizlik - İstanbul",
    description: "Profesyonel temizlik hizmetleri için bize ulaşın. Ücretsiz keşif, 7/24 hizmet.",
    url: 'https://gunentemizlik.com/iletisim',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - İletişim',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "İletişim | Günen Temizlik",
    description: "Profesyonel temizlik hizmetleri için hemen iletişime geçin.",
    images: ['https://gunentemizlik.com/og-contact.jpg'],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (ContactPoint)
// ============================================

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Günen Temizlik Şirketi",
  "url": "https://gunentemizlik.com",
  "logo": "https://gunentemizlik.com/logo.png",
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+90-555-123-4567",
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
    "streetAddress": "Atatürk Mah. Turgut Özal Bulvarı No:123",
    "addressLocality": "Ataşehir",
    "addressRegion": "İstanbul",
    "postalCode": "34758",
    "addressCountry": "TR"
  }
};

// ============================================
// CONTACT INFO CONFIG
// ============================================

/** İletişim bilgileri - Admin panelden dinamik çekilebilir */
const CONTACT_INFO = {
  phone: {
    label: 'Telefon',
    value: '0555 123 45 67',
    href: 'tel:+905551234567',
    icon: Phone,
    description: '7/24 ulaşabilirsiniz',
  },
  email: {
    label: 'E-posta',
    value: 'info@gunentemizlik.com',
    href: 'mailto:info@gunentemizlik.com',
    icon: Mail,
    description: '24 saat içinde dönüş yapıyoruz',
  },
  address: {
    label: 'Adres',
    value: 'Atatürk Mah. Turgut Özal Bulvarı No:123, Ataşehir/İstanbul',
    href: 'https://maps.google.com/?q=41.0082,28.9784',
    icon: MapPin,
    description: 'Tüm İstanbul\'da hizmet veriyoruz',
  },
  hours: {
    label: 'Çalışma Saatleri',
    value: '7/24 Hizmet',
    icon: Clock,
    description: 'Acil durumlar için her zaman hazırız',
  },
} as const;

// ============================================
// LOADING FALLBACK
// ============================================

function ContactLoading() {
  return (
    <div className="py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
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
          className="bg-slate-900 pt-32 pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              İletişim
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Bize ulaşın, size en uygun temizlik çözümlerini sunalım.
              Ücretsiz keşif için hemen form doldurun.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section
          className="bg-slate-50 dark:bg-slate-800 py-12"
          aria-label="İletişim bilgileri"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(CONTACT_INFO).map(([key, info]) => {
                const Icon = info.icon;
                const hasHref = 'href' in info && info.href !== undefined;

                const CardContent = (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition-colors">
                      <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {info.label}
                    </h2>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                      {info.value}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                      {info.description}
                    </p>
                  </>
                );

                // Hours item doesn't have href, render as div
                if (!hasHref) {
                  return (
                    <div
                      key={key}
                      className="group flex flex-col items-center p-6 bg-white dark:bg-slate-700 rounded-xl shadow-sm"
                    >
                      {CardContent}
                    </div>
                  );
                }

                return (
                  <a
                    key={key}
                    href={info.href as string}
                    className="group flex flex-col items-center p-6 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CardContent}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form with Suspense */}
        <Suspense fallback={<ContactLoading />}>
          <ContactForm />
        </Suspense>
      </SiteLayout>
    </>
  );
}
