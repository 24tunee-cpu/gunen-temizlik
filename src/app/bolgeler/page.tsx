import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';
import { canonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'İstanbul İlçe Bazlı Temizlik Hizmetleri | Günen',
  description:
    'İstanbul ilçelerine özel temizlik hizmet sayfalarından bölgenize en uygun ev, ofis, inşaat sonrası ve diğer hizmetleri tek tek inceleyin.',
  alternates: {
    canonical: canonicalUrl('/bolgeler'),
  },
  openGraph: {
    title: 'İstanbul İlçe Bazlı Temizlik Hizmetleri | Günen',
    description:
      'İstanbul ilçelerine özel ev, ofis, inşaat sonrası ve koltuk-halı temizlik sayfalarını karşılaştırın, hızlı teklif alın.',
    url: canonicalUrl('/bolgeler'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - İstanbul bölge hizmetleri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İstanbul İlçe Bazlı Temizlik Hizmetleri | Günen',
    description:
      'İstanbul ilçelerine özel temizlik sayfalarında hizmet kapsamını karşılaştırın ve randevu oluşturun.',
    images: [canonicalUrl('/logo.png')],
  },
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'İstanbul İlçe Bazlı Temizlik Hizmetleri',
  url: canonicalUrl('/bolgeler'),
  description: 'İlçe ve hizmet bazlı temizlik landing sayfaları.',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: canonicalUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Bölgeler', item: canonicalUrl('/bolgeler') },
  ],
};

export default function RegionsHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SiteLayout>
        <div className="min-h-screen bg-slate-900 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold sm:text-4xl">İstanbul İlçe + Hizmet Sayfaları</h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              Arama niyetine uygun içeriklerle hazırlanan bu sayfalar, ilçe bazlı temizlik ihtiyacınıza hızlıca ulaşmanızı sağlar.
            </p>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">İlçeler</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {DISTRICT_LANDINGS.map((district) => (
                  <Link
                    key={district.slug}
                    href={`/bolgeler/${district.slug}`}
                    className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
                  >
                    <p className="font-medium">{district.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{district.populationNote}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-semibold">Odak Hizmetler</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICE_LANDINGS.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/hizmetler/${service.slug}`}
                    className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{service.shortPitch}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </SiteLayout>
    </>
  );
}
