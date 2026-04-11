/**
 * @fileoverview Blog Page
 * @description Blog sayfası - temizlik ipuçları ve bilgiler.
 * SEO optimizasyonu, structured data ve admin-site senkronizasyonu ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (Blog schema)
 * - Dynamic blog posts from admin panel
 * - Content marketing optimized
 *
 * @admin-sync
 * Blog yazıları admin paneldeki /admin/blog sayfasından yönetilir.
 * Kategoriler ve etiketler admin panelden düzenlenir.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { BlogSection } from '@/components/site/BlogSection';
import { BookOpen, ArrowRight, Search } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: "Blog | Günen Temizlik - Temizlik İpuçları ve Bilgiler",
  description: "Profesyonel temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler. Ev temizliği, ofis temizliği ve hijyen hakkında uzman tavsiyeleri.",
  keywords: [
    'temizlik blog',
    'temizlik ipuçları',
    'ev temizliği tavsiyeleri',
    'ofis temizliği rehberi',
    'hijyen önerileri',
    'temizlik sırları',
  ],
  alternates: {
    canonical: 'https://gunentemizlik.com/blog',
  },
  openGraph: {
    title: "Blog | Günen Temizlik",
    description: "Profesyonel temizlik hakkında faydalı bilgiler ve güncel makaleler.",
    url: 'https://gunentemizlik.com/blog',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: 'https://gunentemizlik.com/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Günen Temizlik',
    description: 'Profesyonel temizlik hakkında faydalı bilgiler ve güncel makaleler.',
    images: ['https://gunentemizlik.com/og-blog.jpg'],
  },
};

// ============================================
// JSON-LD STRUCTURED DATA (Blog)
// ============================================

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Günen Temizlik Blog",
  "description": "Profesyonel temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler",
  "url": "https://gunentemizlik.com/blog",
  "publisher": {
    "@type": "Organization",
    "name": "Günen Temizlik Şirketi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://gunentemizlik.com/logo.png"
    }
  },
  "about": {
    "@type": "Thing",
    "name": "Temizlik ve Hijyen"
  }
};

// ============================================
// LOADING FALLBACK
// ============================================

function BlogLoading() {
  return (
    <div className="bg-slate-900 py-16 animate-pulse">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-800" />
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
 * Blog Page Component
 * Blog sayfası - temizlik ipuçları ve makaleler.
 * 
 * @admin-sync Blog yazıları /admin/blog'dan yönetilir
 */
export default function BlogPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <BookOpen
              className="mx-auto mb-6 h-14 w-14 text-emerald-400 sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Blog</h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg">
              Temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler.
              Profesyonel tavsiyelerimizi keşfedin.
            </p>
          </div>
        </section>

        {/* Search Hint */}
        <section className="border-b border-slate-800 bg-slate-900 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 text-center text-slate-300">
              <Search className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
              <span>
                Belirli bir konu hakkında bilgi mi arıyorsunuz?
                <Link
                  href="/sss"
                  className="ml-1 text-emerald-400 hover:underline"
                >
                  SSS sayfamıza göz atın
                </Link>
              </span>
            </div>
          </div>
        </section>

        {/* Blog Section with Suspense */}
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense fallback={<BlogLoading />}>
            <BlogSection paginate pageSize={9} />
          </Suspense>
        </div>

        {/* CTA Section */}
        <section className="flex-1 border-t border-slate-800 bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Profesyonel yardıma mı ihtiyacınız var?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-slate-300">
              Blog yazılarımızda bahsettiğimiz profesyonel temizlik hizmetlerimizden
              yararlanmak için hemen iletişime geçin.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Ücretsiz Keşif Talep Edin
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
        </div>
      </SiteLayout>
    </>
  );
}
