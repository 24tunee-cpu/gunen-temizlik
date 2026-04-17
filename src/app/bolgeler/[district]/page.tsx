import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteLayout from '../../site/layout';
import {
  DISTRICT_LANDINGS,
  SERVICE_LANDINGS,
  formatDistrictSide,
  getDistrictBySlug,
} from '@/config/programmatic-seo';
import { canonicalUrl } from '@/lib/seo';

type Props = {
  params: Promise<{ district: string }>;
};

export function generateStaticParams() {
  return DISTRICT_LANDINGS.map((district) => ({ district: district.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const districtData = getDistrictBySlug(district);
  if (!districtData) return { title: 'Bölge Bulunamadı | Günen Temizlik' };

  const descBase =
    districtData.regionBlurb ||
    `${districtData.name} bölgesinde ofis temizliği, inşaat sonrası temizlik, koltuk yıkama ve daha fazlası için hızlı teklif alın.`;
  const description =
    descBase.length > 158 ? `${descBase.slice(0, 155).trimEnd()}…` : descBase;

  return {
    title: `${districtData.name} Temizlik Hizmetleri | Günen Temizlik`,
    description,
    openGraph: {
      title: `${districtData.name} Temizlik Hizmetleri | Günen Temizlik`,
      description,
      url: canonicalUrl(`/bolgeler/${districtData.slug}`),
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Günen Temizlik',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${districtData.name} Temizlik Hizmetleri | Günen Temizlik`,
      description,
    },
    alternates: {
      canonical: canonicalUrl(`/bolgeler/${districtData.slug}`),
    },
  };
}

export default async function DistrictPage({ params }: Props) {
  const { district } = await params;
  const districtData = getDistrictBySlug(district);
  if (!districtData) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: canonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Bölgeler', item: canonicalUrl('/bolgeler') },
      {
        '@type': 'ListItem',
        position: 3,
        name: districtData.name,
        item: canonicalUrl(`/bolgeler/${districtData.slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SiteLayout>
        <div className="min-h-screen bg-slate-900 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold sm:text-4xl">{districtData.name} Temizlik Hizmetleri</h1>
              {formatDistrictSide(districtData) && (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {formatDistrictSide(districtData)}
                </span>
              )}
            </div>
            <p className="mt-4 max-w-3xl text-slate-300">
              {districtData.regionBlurb ? (
                <>
                  {districtData.regionBlurb}{' '}
                  <span className="text-slate-400">
                    ({districtData.populationNote})
                  </span>
                </>
              ) : (
                <>
                  {districtData.name} için {districtData.populationNote} odağında hizmet veriyoruz.
                </>
              )}{' '}
              Aşağıdaki hizmet sayfalarından doğrudan teklif alabilirsiniz.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-100">Yakın bölgeler</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Komşu ilçelerde de aynı hizmet kalitesiyle çalışıyoruz; ilgili bölge sayfasına geçebilirsiniz.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DISTRICT_LANDINGS.filter((d) => d.slug !== districtData.slug)
                  .slice(0, 8)
                  .map((d) => (
                    <Link
                      key={d.slug}
                      href={`/bolgeler/${d.slug}`}
                      className="rounded-full border border-emerald-400/40 bg-slate-900/40 px-3 py-1 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20"
                    >
                      {d.name}
                    </Link>
                  ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-sm font-medium text-white">Hizmet verdiğimiz mahalle ve semtler</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {districtData.neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-slate-600 bg-slate-800/60 px-3 py-1 text-xs text-slate-200"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_LANDINGS.map((service) => (
                <Link
                  key={service.slug}
                  href={`/bolgeler/${districtData.slug}/${service.slug}`}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
                >
                  <p className="font-medium">{service.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{service.shortPitch}</p>
                </Link>
              ))}
            </section>

            <section className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <h2 className="text-lg font-semibold text-emerald-200">Google Harita & Yorumlar</h2>
              <p className="mt-2 text-sm text-emerald-100/80">
                Kağıthane ve İstanbul genelindeki konumumuzu haritada görün, yorumlarınızı okuyun.
              </p>
              <div className="mt-4">
                <Link
                  href="/harita-ve-yorumlar"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Haritayı Aç
                </Link>
              </div>
            </section>
          </div>
        </div>
      </SiteLayout>
    </>
  );
}
