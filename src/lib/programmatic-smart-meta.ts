import {
  DISTRICT_LANDINGS,
  SERVICE_LANDINGS,
  type DistrictLanding,
  type ServiceLanding,
} from '@/config/programmatic-seo';

const BRAND_SHORT = 'Günen Temizlik';

function sidePhrase(d: DistrictLanding): string {
  if (d.side === 'anadolu') return 'İstanbul Anadolu yakasında';
  if (d.side === 'avrupa') return 'İstanbul Avrupa yakasında';
  return 'İstanbul’da';
}

function trimEndEllipsis(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1).trimEnd();
  return `${cut}…`;
}

/**
 * Programatik ilçe + hizmet sayfaları için tutarlı, SEO odaklı title/description.
 * Admin toplu otomasyon ve önizlemede kullanılır.
 */
export function buildSmartMetaForPair(
  district: DistrictLanding,
  service: ServiceLanding
): { title: string; description: string } {
  let title = `${district.name} ${service.name} | ${BRAND_SHORT}`;
  if (title.length > 58) {
    title = `${district.name} ${service.name} · Günen`;
  }
  title = trimEndEllipsis(title, 58);

  const hoods = district.neighborhoods.slice(0, 3).join(', ');
  const blurb =
    district.regionBlurb?.trim() ||
    `${sidePhrase(district)} ${district.populationNote} ile planlı hizmet.`;

  let description = `${district.name} ${service.name.toLowerCase()}: ${service.shortPitch} ${hoods ? `${hoods} ve yakın mahalleler. ` : ''}${blurb} Ücretsiz keşif için arayın.`;
  description = trimEndEllipsis(description, 158);

  const fallbackKw = service.intentKeywords[0] ?? service.name.toLowerCase();
  return {
    title,
    description:
      description ||
      `${district.name} ${service.name.toLowerCase()}: ${fallbackKw}. ${BRAND_SHORT}.`,
  };
}

export function allProgrammaticPairs(): Array<{ district: DistrictLanding; service: ServiceLanding; key: string }> {
  return DISTRICT_LANDINGS.flatMap((district) =>
    SERVICE_LANDINGS.map((service) => ({
      district,
      service,
      key: `${district.slug}/${service.slug}`,
    }))
  );
}
