import { notFound, permanentRedirect } from 'next/navigation';
import { getDistrictBySlug, getServiceBySlug } from '@/config/programmatic-seo';

type Props = {
  params: Promise<{ district: string; service: string }>;
};

export default async function LegacyDistrictServiceRedirectPage({ params }: Props) {
  const { district, service } = await params;
  const districtData = getDistrictBySlug(district);
  const serviceData = getServiceBySlug(service);

  if (!districtData || !serviceData) notFound();
  permanentRedirect(`/bolgeler/${districtData.slug}/${serviceData.slug}`);
}

