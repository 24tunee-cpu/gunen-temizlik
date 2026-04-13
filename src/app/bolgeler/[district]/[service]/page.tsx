import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteLayout from '../../../site/layout';
import {
  DISTRICT_LANDINGS,
  SERVICE_LANDINGS,
  buildProgrammaticContentVariant,
  getDistrictBySlug,
  getNearbyDistrictSlugs,
  getServiceBySlug,
} from '@/config/programmatic-seo';
import ProgrammaticCtaExperiment from '@/components/site/ProgrammaticCtaExperiment';

type Props = {
  params: Promise<{ district: string; service: string }>;
};

export function generateStaticParams() {
  return DISTRICT_LANDINGS.flatMap((district) =>
    SERVICE_LANDINGS.map((service) => ({
      district: district.slug,
      service: service.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district, service } = await params;
  const districtData = getDistrictBySlug(district);
  const serviceData = getServiceBySlug(service);

  if (!districtData || !serviceData) {
    return { title: 'Sayfa Bulunamadı | Günen Temizlik' };
  }

  const title = `${districtData.name} ${serviceData.name} | Günen Temizlik`;
  const description = `${districtData.name} bölgesinde ${serviceData.name.toLowerCase()} hizmeti için hızlı teklif alın. ${serviceData.shortPitch}`;
  const canonical = `https://gunentemizlik.com/bolgeler/${districtData.slug}/${serviceData.slug}`;
  const contentVariant = buildProgrammaticContentVariant(districtData, serviceData);
  const nearbyDistricts = getNearbyDistrictSlugs(districtData.slug, 3)
    .map((slug) => getDistrictBySlug(slug))
    .filter((d): d is NonNullable<typeof d> => !!d);

  return {
    title,
    description,
    keywords: [districtData.name, serviceData.name, ...serviceData.intentKeywords],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Günen Temizlik',
    },
  };
}

export default async function ProgrammaticLandingPage({ params }: Props) {
  const { district, service } = await params;
  const districtData = getDistrictBySlug(district);
  const serviceData = getServiceBySlug(service);
  if (!districtData || !serviceData) notFound();

  const canonical = `https://gunentemizlik.com/bolgeler/${districtData.slug}/${serviceData.slug}`;
  const contentVariant = buildProgrammaticContentVariant(districtData, serviceData);
  const nearbyDistricts = getNearbyDistrictSlugs(districtData.slug, 3)
    .map((slug) => getDistrictBySlug(slug))
    .filter((d): d is NonNullable<typeof d> => !!d);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${districtData.name} ${serviceData.name}`,
    serviceType: serviceData.name,
    areaServed: districtData.name,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Günen Temizlik',
      url: 'https://gunentemizlik.com',
    },
    url: canonical,
    description: `${districtData.name} bölgesinde ${contentVariant.heroLead}`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: serviceData.faq.map((item) => ({
      '@type': 'Question',
      name: `${districtData.name} ${item.q}`,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

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
      {
        '@type': 'ListItem',
        position: 4,
        name: serviceData.name,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SiteLayout>
        <div className="min-h-screen bg-slate-900 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold sm:text-4xl">{districtData.name} {serviceData.name}</h1>
            <p className="mt-4 text-slate-300">
              {contentVariant.heroLead}
            </p>

            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
              <h2 className="text-xl font-semibold">Neden bu bölgede bizi tercih ediyorlar?</h2>
              <ul className="mt-4 space-y-2 text-slate-300">
                {contentVariant.trustPoints.map((point) => (
                  <li key={point}>- {point}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-400">{contentVariant.localAngle}</p>
            </div>

            <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
              <h2 className="text-xl font-semibold">Hizmet Süreci</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-300">
                {contentVariant.processSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
              <h2 className="text-xl font-semibold">Sık Sorulan Sorular</h2>
              <div className="mt-4 space-y-4">
                {serviceData.faq.map((faq) => (
                  <div key={faq.q}>
                    <h3 className="font-medium text-white">{faq.q}</h3>
                    <p className="mt-1 text-sm text-slate-300">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <ProgrammaticCtaExperiment
              districtName={districtData.name}
              districtSlug={districtData.slug}
              serviceName={serviceData.name}
              serviceSlug={serviceData.slug}
            />

            <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
              <h2 className="text-xl font-semibold">Yakın Bölge Sayfaları</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {nearbyDistricts.map((nearby) => (
                  <Link
                    key={nearby.slug}
                    href={`/bolgeler/${nearby.slug}/${serviceData.slug}`}
                    className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                  >
                    {nearby.name} {serviceData.name}
                  </Link>
                ))}
              </div>
            </section>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/iletisim"
                className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Hemen Teklif Al
              </Link>
              <Link
                href={`/hizmetler/${serviceData.slug}`}
                className="rounded-lg border border-slate-600 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Hizmet Detayını Gör
              </Link>
              <Link
                href={`/bolgeler/${districtData.slug}`}
                className="rounded-lg border border-slate-600 px-5 py-2.5 font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                {districtData.name} Bölge Sayfası
              </Link>
            </div>
          </div>
        </div>
      </SiteLayout>
    </>
  );
}
