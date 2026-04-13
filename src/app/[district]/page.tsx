import { notFound, permanentRedirect } from 'next/navigation';
import { getDistrictBySlug } from '@/config/programmatic-seo';

type Props = {
  params: Promise<{ district: string }>;
};

export default async function LegacyDistrictRedirectPage({ params }: Props) {
  const { district } = await params;
  const districtData = getDistrictBySlug(district);
  if (!districtData) notFound();
  permanentRedirect(`/bolgeler/${districtData.slug}`);
}

