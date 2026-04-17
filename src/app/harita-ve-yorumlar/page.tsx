import type { Metadata } from 'next';
import { SITE_CONTACT } from '@/config/site-contact';
import SiteLayout from '../site/layout';
import { canonicalUrl } from '@/lib/seo';

const address = SITE_CONTACT.addressLine;
// Kullanıcının doğrudan Google işletme linkleri
const GOOGLE_MAPS_PLACE = 'https://maps.app.goo.gl/Q2Sp2mRcEdFQMnog7';
const GOOGLE_REVIEW_URL = 'https://g.page/r/CS2Mx2c1UpqwEBM/review';

const utmBase = {
  utm_source: 'website',
  utm_medium: 'gmb',
};

function withUtm(path: string, extra: Record<string, string>) {
  const params = new URLSearchParams({ ...utmBase, ...extra });
  return `${path}?${params.toString()}`;
}

// Embed: adres + marka ismi ile, sayfa içinde konumu gösteriyoruz
const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `Günen Temizlik, ${address}`
)}&output=embed`;
// Haritada Aç: kullanıcıdan gelen Google Maps kısa linki
const mapsOpenHref = withUtm(GOOGLE_MAPS_PLACE, { utm_campaign: 'gmb-harita' });

// Yorum Yaz: doğrudan Google yorum isteme linki
const reviewHref = withUtm(GOOGLE_REVIEW_URL, { utm_campaign: 'gmb-yorum' });

const directionsHref = withUtm(
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
  { utm_campaign: 'gmb-yol-tarifi' }
);

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const title = 'Google Harita ve Müşteri Yorumları | İstanbul | Günen';
  const description = `${SITE_CONTACT.addressLocality} konumumuzu haritada görüntüleyin, gerçek müşteri yorumlarını inceleyin ve doğrudan yol tarifi alın.`;
  const canonical = canonicalUrl('/harita-ve-yorumlar');

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      siteName: SITE_CONTACT.companyName,
    },
  };
}

export default function MapsAndReviewsPage() {
  const telHref = `tel:${SITE_CONTACT.phoneE164}`;
  const whatsappHref = `https://wa.me/${SITE_CONTACT.whatsappDigits}`;
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONTACT.companyName,
    url: canonicalUrl('/'),
    image: canonicalUrl('/logo.png'),
    telephone: SITE_CONTACT.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONTACT.addressLine,
      addressLocality: SITE_CONTACT.addressLocality,
      addressRegion: SITE_CONTACT.addressRegion,
      postalCode: SITE_CONTACT.postalCode,
      addressCountry: 'TR',
    },
    hasMap: mapsOpenHref,
    sameAs: [mapsOpenHref, reviewHref],
    areaServed: 'İstanbul',
  };

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <div className="min-h-screen bg-slate-900 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold sm:text-4xl">Google Harita & Yorumlar</h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              Kağıthane konumumuzu haritada görün. Son günlerde gelen yorumları okuyun ve dilerseniz
              Google üzerinde yorum bırakın.
            </p>
          </header>

          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/30">
            <div className="aspect-[16/10] w-full">
              <iframe
                title="Günen Temizlik Google Harita"
                src={mapsEmbedSrc}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-800 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-emerald-200">Aksiyonlar</h2>
            <p className="mt-2 text-sm text-slate-300">
              Harita, yorum ve yol tarifi için tek tıkla açabilirsiniz.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href={mapsOpenHref}
                data-source="gmb_map_click"
                className="flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                Haritada Aç
              </a>
              <a
                href={reviewHref}
                data-source="gmb_review_click"
                className="flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                Yorum Yaz
              </a>
              <a
                href={directionsHref}
                data-source="gmb_directions_click"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/30 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                Yol Tarifi Al
              </a>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={telHref}
                data-source="gmb_phone_cta"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/20 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800/40 transition-colors"
              >
                {SITE_CONTACT.phoneDisplay} ile Ara
              </a>
              <a
                href={whatsappHref}
                data-source="gmb_whatsapp_cta"
                className="flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/20 p-5">
            <h2 className="text-sm font-semibold text-slate-200">İşletme Bilgileri</h2>
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-200">Adres: </span>
              {SITE_CONTACT.addressLine}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-200">Telefon: </span>
              {SITE_CONTACT.phoneDisplay}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-200">Çalışma: </span>
              24 saat açık
            </p>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

