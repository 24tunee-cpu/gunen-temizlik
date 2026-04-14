/**
 * @fileoverview Home Page
 * @description Ana sayfa - Günen Temizlik kurumsal web sitesi giriş sayfası.
 * SEO optimizasyonu, structured data ve lazy loading ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Suspense boundaries ile streaming
 * - Dynamic imports ile code splitting
 * - JSON-LD structured data ile zengin SEO
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import SiteLayout from './site/layout';
import { canonicalUrl } from '@/lib/seo';

// ============================================
// DYNAMIC IMPORTS (Code Splitting)
// ============================================

const Hero = dynamic(() => import('@/components/site/Hero').then(mod => mod.Hero), {
  loading: () => <div className="min-h-[100dvh] min-h-screen bg-slate-100 animate-pulse" />,
});

const Services = dynamic(() => import('@/components/site/Services').then(mod => mod.Services), {
  loading: () => <div className="h-96 bg-slate-50 animate-pulse" />,
});

const Testimonials = dynamic(() => import('@/components/site/Testimonials').then(mod => mod.Testimonials), {
  loading: () => <div className="h-80 bg-white animate-pulse" />,
});

const BlogSection = dynamic(() => import('@/components/site/BlogSection').then(mod => mod.BlogSection), {
  loading: () => <div className="h-96 bg-slate-50 animate-pulse" />,
});

const ContactForm = dynamic(() => import('@/components/site/ContactForm').then(mod => mod.ContactForm), {
  loading: () => <div className="h-[600px] bg-white animate-pulse" />,
});

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: "İstanbul'un En İyi Temizlik Şirketi | 7/24 Profesyonel Hizmet",
  description: "İstanbul'un önde gelen temizlik şirketi. İnşaat sonrası, ofis, koltuk yıkama, halı temizliği. 15+ yıl deneyim, 5000+ mutlu müşteri, %100 memnuniyet garantisi. Ücretsiz keşif!",
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
  ],
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    title: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi",
    description: "15+ yıl deneyimli profesyonel temizlik ekibi. İnşaat sonrası, ofis, ev temizliği. Ücretsiz keşif, uygun fiyatlar!",
    url: canonicalUrl('/'),
    siteName: "Günen Temizlik",
    images: [
      {
        url: canonicalUrl('/og-image.jpg'),
        width: 1200,
        height: 630,
        alt: "Günen Temizlik - İstanbul Profesyonel Temizlik",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ============================================
// LOADING FALLBACKS
// ============================================

function SectionLoading({ height = "h-96" }: { height?: string }) {
  return (
    <div className={`${height} bg-slate-100 animate-pulse flex items-center justify-center`}>
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Home Page Component
 * Ana sayfa - tüm bileşenleri Suspense ile sarmalar.
 * Her bileşen ayrı ayrı yüklenir (streaming).
 */
export default function HomePage() {
  return (
    <>
      <SiteLayout>
        {/* Hero - First Contentful Paint için öncelikli */}
        <Suspense fallback={<SectionLoading height="h-screen" />}>
          <Hero />
        </Suspense>

        {/* Services */}
        <Suspense fallback={<SectionLoading height="h-96" />}>
          <Services />
        </Suspense>

        {/* Testimonials */}
        <Suspense fallback={<SectionLoading height="h-80" />}>
          <Testimonials />
        </Suspense>

        {/* Blog Section */}
        <Suspense fallback={<SectionLoading height="h-96" />}>
          <BlogSection />
        </Suspense>

        {/* Contact Form - En altta, daha az kritik */}
        <Suspense fallback={<SectionLoading height="h-[600px]" />}>
          <ContactForm />
        </Suspense>
      </SiteLayout>
    </>
  );
}
