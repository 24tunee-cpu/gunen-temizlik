type IntentLink = {
  href: string;
  label: string;
  terms: string[];
};

const DEFAULT_INTENT_LINKS: Omit<IntentLink, 'terms'>[] = [
  { href: '/randevu', label: 'Ucretsiz kesif ve randevu' },
  { href: '/hizmetler', label: 'Tum hizmetler' },
  { href: '/iletisim', label: 'Iletisim ve hizli teklif' },
];

const INTENT_LINKS: IntentLink[] = [
  {
    href: '/hizmetler/ofis-temizligi',
    label: 'Ofis Temizligi Hizmeti',
    terms: ['ofis', 'kurumsal', 'is yeri', 'ofis temizligi'],
  },
  {
    href: '/hizmetler/insaat-sonrasi-temizlik',
    label: 'Insaat Sonrasi Temizlik',
    terms: ['insaat', 'tadilat', 'insaat sonrasi', 'tadilat sonrasi'],
  },
  {
    href: '/hizmetler/koltuk-yikama',
    label: 'Koltuk Yikama Hizmeti',
    terms: ['koltuk', 'yatak', 'yerinde koltuk yikama'],
  },
  {
    href: '/hizmetler/hali-temizligi',
    label: 'Hali Temizligi Hizmeti',
    terms: ['hali', 'hali yikama'],
  },
  {
    href: '/hizmetler/dis-cephe-temizligi',
    label: 'Dis Cephe ve Cam Temizligi',
    terms: ['dis cephe', 'cam temizligi', 'ofis cam'],
  },
  {
    href: '/hizmetler/ev-temizligi',
    label: 'Detayli Ev Temizligi',
    terms: ['ev temizligi', 'bos ev', 'tasinma', 'gunluk temizlikci', 'apartman'],
  },
];

export function resolveIntentLinks(input: string, limit = 4): Array<{ href: string; label: string }> {
  const haystack = input.toLowerCase();
  const matched = INTENT_LINKS.filter((item) => item.terms.some((term) => haystack.includes(term)))
    .slice(0, limit)
    .map(({ href, label }) => ({ href, label }));

  const links = [...matched];
  for (const fallback of DEFAULT_INTENT_LINKS) {
    if (links.find((l) => l.href === fallback.href)) continue;
    links.push(fallback);
    if (links.length >= limit) break;
  }
  return links;
}

