/**
 * Root layout JSON-LD — SiteSettings + getSiteUrl ile NAP / sosyal / site içi arama uyumu.
 */
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SITE_CONTACT } from '@/config/site-contact';
import { getSiteUrl, serializeSchemaGraph } from '@/lib/seo';

function toAbsoluteUrl(base: string, pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const t = pathOrUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const path = t.startsWith('/') ? t : `/${t}`;
  return `${base}${path}`;
}

/** Türkiye GSM görünümünden E.164 tahmini; başarısızsa undefined */
function guessE164FromDisplay(phone: string): string | undefined {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('5')) return `+90${d}`;
  if (d.length === 11 && d.startsWith('0')) return `+90${d.slice(1)}`;
  if (d.length >= 12 && d.startsWith('90')) return `+${d}`;
  return undefined;
}

const getCachedSiteSettingsForSchema = unstable_cache(
  async () =>
    prisma.siteSettings.findFirst({
      select: {
        siteName: true,
        siteDescription: true,
        phone: true,
        email: true,
        address: true,
        logo: true,
        ogImage: true,
        facebook: true,
        instagram: true,
        twitter: true,
        linkedin: true,
        youtube: true,
        workingHours: true,
      },
    }),
  ['root-seo-site-settings'],
  { revalidate: 300 }
);

export async function buildRootSchemaGraphJson(): Promise<string> {
  const base = getSiteUrl();
  const settings = await getCachedSiteSettingsForSchema();

  const siteName = settings?.siteName?.trim() || 'Günen Temizlik';
  const description =
    settings?.siteDescription?.trim() ||
    "İstanbul'un önde gelen profesyonel temizlik şirketi. İnşaat sonrası, ofis, ev temizliği ve koltuk yıkama hizmetleri.";
  const email = settings?.email?.trim() || SITE_CONTACT.email;
  const phoneDisplay = settings?.phone?.trim() || SITE_CONTACT.phoneDisplay;
  const telephone =
    guessE164FromDisplay(phoneDisplay) || SITE_CONTACT.phoneE164;
  const addressLine =
    settings?.address?.trim() || 'Ataşehir, İstanbul';

  const logoUrl = toAbsoluteUrl(base, settings?.logo) ?? `${base}/logo.png`;
  const ogUrl = toAbsoluteUrl(base, settings?.ogImage) ?? `${base}/og-image.jpg`;

  const lat = Number(process.env.NEXT_PUBLIC_BUSINESS_LAT ?? '41.0082');
  const lng = Number(process.env.NEXT_PUBLIC_BUSINESS_LNG ?? '28.9784');

  const sameAs = [
    settings?.facebook,
    settings?.instagram,
    settings?.twitter,
    settings?.linkedin,
    settings?.youtube,
  ]
    .map((u) => u?.trim())
    .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)));

  const localBusiness: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${base}/#business`,
    name: siteName,
    url: base,
    logo: logoUrl,
    image: [logoUrl, ogUrl],
    telephone,
    email,
    description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: addressLine,
      addressLocality: 'İstanbul',
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    areaServed: ['İstanbul', 'Ataşehir', 'Kadıköy', 'Üsküdar'],
    priceRange: '₺₺',
    foundingDate: '2010',
    hasMap: `https://www.google.com/maps?q=${lat},${lng}`,
  };

  if (sameAs.length > 0) {
    localBusiness.sameAs = sameAs;
  }

  const webSite: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: `${base}/`,
    name: siteName,
    description: settings?.siteDescription?.trim() || description,
    inLanguage: 'tr-TR',
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: base,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/ara?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return serializeSchemaGraph([localBusiness, webSite]);
}
