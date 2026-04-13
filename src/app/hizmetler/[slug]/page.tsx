/**
 * @fileoverview Service Detail Page (Dynamic Route)
 * @description Dinamik hizmet detay sayfası.
 * Prisma'dan veri çeken, SEO optimizasyonlu server component.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Dynamic Route Segment [slug]
 * - Prisma ORM database access
 * - JSON-LD structured data (Service schema)
 * - ISR/SSG compatible
 *
 * @admin-sync
 * Hizmet içerikleri admin paneldeki /admin/hizmetler sayfasından yönetilir.
 * Slug bazlı dinamik routing.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import SiteLayout from '../../site/layout';
import { Sparkles, Check, ArrowRight, Phone, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { DISTRICT_LANDINGS } from '@/config/programmatic-seo';

// ============================================
// TYPES
// ============================================

/** Page props for dynamic route */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Service data with Prisma fields */
interface ServiceData {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string | null;
  metaDesc: string | null;
  metaTitle: string | null;
  image: string | null;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// METADATA GENERATION
// ============================================

/**
 * Generate dynamic metadata for service detail page
 * @param params Route parameters with slug
 * @returns SEO metadata
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const service = await prisma.service.findUnique({
      where: { slug },
    });

    if (!service || !service.isActive) {
      return {
        title: 'Hizmet Bulunamadı | Günen Temizlik',
        description: 'Aradığınız hizmet bulunamadı.'
      };
    }

    return {
      title: service.metaTitle?.trim() || `${service.title} | Günen Temizlik - İstanbul`,
      description: service.metaDesc || service.shortDesc,
      keywords: service.features,
      alternates: {
        canonical: `https://gunentemizlik.com/hizmetler/${service.slug}`,
      },
      openGraph: {
        title: service.title,
        description: service.shortDesc,
        type: 'article',
        url: `https://gunentemizlik.com/hizmetler/${service.slug}`,
        images: service.image ? [
          {
            url: service.image,
            width: 1200,
            height: 630,
            alt: service.title,
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: service.title,
        description: service.shortDesc,
        images: service.image ? [service.image] : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Hizmet Detayı | Günen Temizlik',
      description: 'İstanbul profesyonel temizlik hizmetleri.',
    };
  }
}

// ============================================
// JSON-LD STRUCTURED DATA HELPER
// ============================================

/**
 * Generate JSON-LD structured data for Service schema
 * @param service Service data from Prisma
 * @returns JSON-LD object
 */
function generateServiceSchema(service: ServiceData) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.title,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Günen Temizlik Şirketi",
      "url": "https://gunentemizlik.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "İstanbul",
        "addressCountry": "TR"
      }
    },
    "areaServed": "İstanbul",
    "description": service.description || service.shortDesc,
    "image": service.image || undefined,
  };
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

/**
 * Service Detail Page Component
 * Dinamik hizmet detay sayfası.
 * 
 * @param params Route parameters
 * @returns Service detail page
 * @throws notFound() if service not found or inactive
 */
export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch service data from database
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  // Handle not found or inactive service
  if (!service || !service.isActive) {
    notFound();
  }

  // Generate structured data
  const serviceSchema = generateServiceSchema(service as ServiceData);
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: 'https://gunentemizlik.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Hizmetler',
        item: 'https://gunentemizlik.com/hizmetler',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.title,
        item: `https://gunentemizlik.com/hizmetler/${service.slug}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <SiteLayout>
        {/* Hero Section */}
        <section
          className="bg-slate-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Hizmet başlığı"
        >
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 sm:h-20 sm:w-20">
              <Sparkles className="h-8 w-8 text-emerald-400 sm:h-10 sm:w-10" aria-hidden="true" />
            </div>
            <h1 className="text-balance break-words text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              {service.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              {service.shortDesc}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="bg-white dark:bg-slate-900">
          <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Service Image */}
            {service.image && (
              <figure className="mb-12 aspect-video overflow-hidden rounded-2xl">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={1200}
                  height={630}
                  className="h-full w-full object-cover"
                  priority
                />
              </figure>
            )}

            <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Bu hizmetin verildiği bölgeler</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Bölgenize özel sayfalardan hızlıca teklif alabilir, süreç detaylarını görebilirsiniz.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {DISTRICT_LANDINGS.slice(0, 6).map((district) => (
                  <Link
                    key={district.slug}
                    href={`/bolgeler/${district.slug}/${service.slug}`}
                    className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    {district.name} {service.title}
                  </Link>
                ))}
              </div>
            </section>

            {/* Description */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300">
              {service.description ? (
                <div dangerouslySetInnerHTML={{ __html: service.description }} />
              ) : (
                <p>{service.shortDesc}</p>
              )}
            </div>

            {/* Features */}
            {service.features.length > 0 && (
              <section className="mt-12" aria-label="Hizmet özellikleri">
                <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Hizmet Özellikleri
                </h2>
                <ul className="space-y-4" role="list">
                  {service.features.map((feature: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                      role="listitem"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Trust Indicators */}
            <section className="mt-12 grid gap-4 sm:grid-cols-2" aria-label="Güvenceler">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Shield className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Memnuniyet Garantisi</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">%100 müşteri memnuniyeti</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Clock className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">7/24 Hizmet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Acil durumlar için her zaman</p>
                </div>
              </div>
            </section>

            {/* CTA Buttons */}
            <nav
              className="mt-12 flex flex-col gap-4 sm:flex-row"
              aria-label="Hizmet aksiyonları"
            >
              <Link
                href="/iletisim"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-white font-semibold hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Phone size={20} aria-hidden="true" />
                Hemen Teklif Al
              </Link>
              <Link
                href="/hizmetler"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-8 py-4 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <ArrowRight size={20} aria-hidden="true" />
                Tüm Hizmetler
              </Link>
            </nav>
          </article>
        </main>
      </SiteLayout>
    </>
  );
}
