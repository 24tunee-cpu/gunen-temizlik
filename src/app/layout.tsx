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
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";
import { getSiteIconHref } from "@/lib/site-branding";
import { canonicalUrl, getSiteUrl } from "@/lib/seo";
import { buildRootSchemaGraphJson } from "@/lib/root-schema";

/** Google Analytics 4 — `NEXT_PUBLIC_GA_MEASUREMENT_ID` ile değiştirilebilir */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-GX9WV429Y3";

const siteRoot = getSiteUrl();

const rootMetadataBase: Metadata = {
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
  metadataBase: new URL(siteRoot),
  alternates: {
    canonical: canonicalUrl("/"),
    languages: {
      "tr-TR": canonicalUrl("/"),
    },
  },
  openGraph: {
    title: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi",
    description: "15+ yıl deneyimli profesyonel temizlik ekibi. İnşaat sonrası, ofis, ev temizliği, koltuk yıkama. Ücretsiz keşif, uygun fiyatlar!",
    type: "website",
    locale: "tr_TR",
    url: canonicalUrl("/"),
    siteName: "Günen Temizlik",
    images: [
      {
        url: canonicalUrl("/og-image.jpg"),
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
    images: [canonicalUrl("/og-image.jpg")],
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

export async function generateMetadata(): Promise<Metadata> {
  const iconHref = await getSiteIconHref();
  const googleVerify = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  return {
    ...rootMetadataBase,
    ...(googleVerify ? { verification: { google: googleVerify } } : {}),
    icons: {
      icon: [{ url: iconHref }],
      shortcut: iconHref,
      apple: [{ url: iconHref }],
    },
  };
}

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
export default async function RootLayout({ children }: RootLayoutProps) {
  const rootSchemaJsonLd = await buildRootSchemaGraphJson();
  return (
    <html
      lang="tr"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="site-root-schema-graph"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: rootSchemaJsonLd }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
        <Providers gaMeasurementId={GA_MEASUREMENT_ID}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
