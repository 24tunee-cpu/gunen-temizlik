/**
 * Referanslar — sunucu render yorum arşivi + veritabanından üretilen JSON-LD.
 */

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { Testimonials } from '@/components/site/Testimonials';
import { ReferanslarReviewsArchive } from '@/components/site/ReferanslarReviewsArchive';
import {
  buildReferanslarBreadcrumbJsonLd,
  buildReferanslarFaqJsonLd,
  buildReferanslarLocalBusinessJsonLd,
  buildReferanslarWebPageJsonLd,
  computeTestimonialAggregate,
  fetchPublicTestimonialsForSeo,
} from '@/lib/testimonials-seo';
import { Star, Users, Award } from 'lucide-react';

const getTestimonials = cache(fetchPublicTestimonialsForSeo);

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const rows = await getTestimonials();
  const n = rows.length;
  const agg = computeTestimonialAggregate(rows);
  const description =
    n > 0 && agg
      ? `${n} gerçek müşteri yorumu; ortalama ${agg.ratingValue.toFixed(1)}/5. İstanbul temizlik referansları, ofis ve ev hizmeti deneyimleri — Günen Temizlik.`
      : 'Günen Temizlik müşteri yorumları ve İstanbul temizlik referansları. Profesyonel temizlik hizmeti geri bildirimleri.';

  return {
    title: 'Referanslar | Günen Temizlik — Müşteri Yorumları',
    description,
    keywords: [
      'günen temizlik yorumları',
      'istanbul temizlik referansları',
      'müşteri memnuniyeti',
      'temizlik şirketi yorumları',
      'ofis temizliği referans',
      'ev temizliği yorumları',
      'inşaat sonrası temizlik yorum',
    ],
    alternates: {
      canonical: 'https://gunentemizlik.com/referanslar',
    },
    openGraph: {
      title: 'Referanslar | Günen Temizlik',
      description,
      url: 'https://gunentemizlik.com/referanslar',
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Günen Temizlik',
      images: [
        {
          url: 'https://gunentemizlik.com/og-references.jpg',
          width: 1200,
          height: 630,
          alt: 'Günen Temizlik müşteri yorumları',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Referanslar | Günen Temizlik',
      description,
      images: ['https://gunentemizlik.com/og-references.jpg'],
    },
  };
}

function StatsSection({ reviewCount, avgDisplay }: { reviewCount: number; avgDisplay: string }) {
  const stats = [
    { icon: Users, value: reviewCount > 0 ? String(reviewCount) : '—', label: 'Yayında yorum' },
    { icon: Star, value: avgDisplay, label: 'Ortalama puan (5 üzerinden)' },
    { icon: Award, value: '15+', label: 'Yıllık deneyim' },
  ] as const;

  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-800" aria-label="Özet istatistikler">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-white p-6 text-center shadow-sm dark:bg-slate-700"
              >
                <Icon className="mx-auto mb-4 h-12 w-12 text-emerald-500" aria-hidden />
                <p className="text-4xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default async function ReferencesPage() {
  const rows = await getTestimonials();
  const agg = computeTestimonialAggregate(rows);
  const metaDescription =
    rows.length > 0 && agg
      ? `${rows.length} gerçek müşteri yorumu; ortalama ${agg.ratingValue.toFixed(1)}/5. İstanbul temizlik referansları — Günen Temizlik.`
      : 'Günen Temizlik müşteri yorumları ve İstanbul temizlik referansları.';

  const localBusinessLd = buildReferanslarLocalBusinessJsonLd(rows);
  const breadcrumbLd = buildReferanslarBreadcrumbJsonLd();
  const faqLd = buildReferanslarFaqJsonLd();
  const webPageLd = buildReferanslarWebPageJsonLd(rows, metaDescription);

  const carouselInitial = rows.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location ?? '',
    rating: t.rating,
    content: t.content,
    avatar: t.avatar ?? undefined,
    service: t.service ?? undefined,
    isActive: true as const,
  }));

  const avgDisplay = agg ? agg.ratingValue.toFixed(1) : '—';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />

      <SiteLayout>
        <section
          className="bg-slate-900 pb-12 pt-24 sm:pt-28 sm:pb-14 md:pb-16 md:pt-32"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Müşteri yorumları ve referanslar
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              İstanbul&apos;da profesyonel temizlik hizmeti alan müşterilerimizin gerçek ifadeleri. Aşağıda tam metinler
              arama motorları ve ziyaretçiler için aynı anda sunulur.
            </p>
          </div>
        </section>

        <StatsSection reviewCount={rows.length} avgDisplay={avgDisplay} />

        <Testimonials initialTestimonials={carouselInitial} />

        <ReferanslarReviewsArchive items={rows} />

        <section className="bg-white py-16 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
              Siz de memnun müşterilerimiz arasına katılın
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-slate-600 dark:text-slate-300">
              Profesyonel temizlik hizmetimizi deneyimleyin; görüşleriniz bu sayfada paylaşılabilir.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:text-base"
            >
              Ücretsiz keşif talep edin
            </Link>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
