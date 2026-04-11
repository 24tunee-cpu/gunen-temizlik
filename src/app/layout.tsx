/**
 * @fileoverview Root Layout
 * @description Tüm uygulamayı saran root layout.
 * SEO metadata, schema.org JSON-LD, font optimization ve tema desteği ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Schema.org structured data (LocalBusiness, FAQ, WebSite)
 * - Next.js Font Optimization (Google Fonts)
 * - ThemeProvider ile dark/light mode desteği
 * - Admin panel ile site ayarları senkronizasyonu
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";

/** Google Analytics 4 — `NEXT_PUBLIC_GA_MEASUREMENT_ID` ile değiştirilebilir */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-GX9WV429Y3";

// ============================================
// FONT CONFIGURATION
// ============================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Mono font daha az kritik
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi | 7/24 Hizmet",
    template: "%s | Günen Temizlik",
  },
  description: "İstanbul'un önde gelen profesyonel temizlik şirketi. İnşaat sonrası, ofis, koltuk yıkama, halı temizliği. 15+ yıl deneyim, 5000+ mutlu müşteri, %100 memnuniyet garantisi. Hemen fiyat alın!",
  keywords: [
    "istanbul temizlik şirketi",
    "profesyonel temizlik hizmetleri",
    "ofis temizliği istanbul",
    "inşaat sonrası temizlik",
    "koltuk yıkama hizmeti",
    "halı temizliği",
    "ev temizliği şirketi",
    "kurumsal temizlik firması",
    "ataşehir temizlik",
    "kadıköy temizlik",
    "7/24 temizlik hizmeti",
    "acil temizlik",
  ],
  authors: [{ name: "Günen Temizlik" }],
  creator: "Günen Temizlik",
  publisher: "Günen Temizlik",
  metadataBase: new URL("https://gunentemizlik.com"),
  alternates: {
    canonical: "https://gunentemizlik.com",
    languages: {
      "tr-TR": "https://gunentemizlik.com",
    },
  },
  openGraph: {
    title: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi",
    description: "15+ yıl deneyimli profesyonel temizlik ekibi. İnşaat sonrası, ofis, ev temizliği, koltuk yıkama. Ücretsiz keşif, uygun fiyatlar!",
    type: "website",
    locale: "tr_TR",
    url: "https://gunentemizlik.com",
    siteName: "Günen Temizlik",
    images: [
      {
        url: "https://gunentemizlik.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Günen Temizlik - İstanbul Profesyonel Temizlik Hizmetleri",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi",
    description: "Profesyonel temizlik hizmetleri. 7/24 hizmet, ücretsiz keşif!",
    images: ["https://gunentemizlik.com/og-image.jpg"],
    creator: "@gunentemizlik",
    site: "@gunentemizlik",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "business",
  classification: "Cleaning Services",
  other: {
    "msapplication-TileColor": "#10b981",
  },
};

// Viewport metadata (separate export for Next.js 14+)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

// ============================================
// SCHEMA.ORG JSON-LD (Static - Performance)
// ============================================

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "CleaningService",
  "@id": "https://gunentemizlik.com/#business",
  "name": "Günen Temizlik Şirketi",
  "image": [
    "https://gunentemizlik.com/logo.png",
    "https://gunentemizlik.com/og-image.jpg",
  ],
  "url": "https://gunentemizlik.com",
  "telephone": "+905551234567",
  "email": "info@gunentemizlik.com",
  "priceRange": "₺₺",
  "description": "İstanbul'un önde gelen profesyonel temizlik şirketi. İnşaat sonrası, ofis, ev temizliği ve koltuk yıkama hizmetleri.",
  "foundingDate": "2010",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "527",
    "bestRating": "5",
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Atatürk Mah. Turgut Özal Bulvarı No:123",
    "addressLocality": "Ataşehir",
    "addressRegion": "İstanbul",
    "postalCode": "34758",
    "addressCountry": "TR",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.0082,
    "longitude": 28.9784,
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59",
    },
  ],
  "areaServed": [
    { "@type": "City", "name": "İstanbul" },
    { "@type": "AdministrativeArea", "name": "Ataşehir" },
    { "@type": "AdministrativeArea", "name": "Kadıköy" },
    { "@type": "AdministrativeArea", "name": "Üsküdar" },
  ],
  "sameAs": [
    "https://facebook.com/gunentemizlik",
    "https://instagram.com/gunentemizlik",
  ],
  "hasMap": "https://www.google.com/maps?q=41.0082,28.9784",
} as const;

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "İstanbul temizlik şirketi fiyatları ne kadar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "İstanbul'da temizlik şirketi fiyatları hizmet türüne göre değişir. Ofis temizliği 300-800₺, ev temizliği 400-1000₺, inşaat sonrası temizlik 500-1500₺ arasında değişmektedir. Detaylı fiyat için ücretsiz keşif hizmetimizden yararlanabilirsiniz.",
      },
    },
    {
      "@type": "Question",
      "name": "Günen Temizlik hangi bölgelerde hizmet veriyor?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Tüm İstanbul'da hizmet vermekteyiz. Ataşehir, Kadıköy, Üsküdar, Beşiktaş, Şişli, Maltepe, Pendik ve tüm ilçelerde 7/24 profesyonel temizlik hizmeti sunuyoruz.",
      },
    },
    {
      "@type": "Question",
      "name": "İnşaat sonrası temizlik ne kadar sürer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "İnşaat sonrası temizlik süresi alanın büyüklüğüne göre değişir. 100m² bir daire ortalama 4-6 saat, 200m² bir ofis 6-8 saat sürmektedir.",
      },
    },
  ],
} as const;

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://gunentemizlik.com/#website",
  "url": "https://gunentemizlik.com",
  "name": "Günen Temizlik",
  "description": "İstanbul'un önde gelen profesyonel temizlik şirketi",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://gunentemizlik.com/arama?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
} as const;

// ============================================
// TYPES
// ============================================

/** RootLayout component props */
interface RootLayoutProps {
  /** Uygulama içeriği */
  children: React.ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Root Layout Component
 * Tüm uygulamayı saran ana layout.
 * SEO, fonts, schema.org ve theme desteği ile.
 * 
 * @param children Uygulama içeriği
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
        />
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
