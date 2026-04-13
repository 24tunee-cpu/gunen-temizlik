import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteLayout from '../../site/layout';
import {
  DISTRICT_LANDINGS,
  SERVICE_LANDINGS,
  getDistrictBySlug,
} from '@/config/programmatic-seo';

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

  return {
    title: `${districtData.name} Temizlik Hizmetleri | Günen Temizlik`,
    description: `${districtData.name} bölgesinde ofis temizliği, inşaat sonrası temizlik, koltuk yıkama ve daha fazlası için hızlı teklif alın.`,
    alternates: {
      canonical: `https://gunentemizlik.com/bolgeler/${districtData.slug}`,
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
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://gunentemizlik.com/' },
      { '@type': 'ListItem', position: 2, name: 'Bölgeler', item: 'https://gunentemizlik.com/bolgeler' },
      {
        '@type': 'ListItem',
        position: 3,
        name: districtData.name,
        item: `https://gunentemizlik.com/bolgeler/${districtData.slug}`,
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
            <h1 className="text-3xl font-bold sm:text-4xl">{districtData.name} Temizlik Hizmetleri</h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              {districtData.name} için {districtData.populationNote} odağında hizmet veriyoruz. Aşağıdaki hizmet bazlı
              landing sayfalarından doğrudan teklif alabilirsiniz.
            </p>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-300">
              Öne çıkan mahalleler: {districtData.neighborhoods.join(', ')}
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
          </div>
        </div>
      </SiteLayout>
    </>
  );
}
