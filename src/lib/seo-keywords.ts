type PageKey =
  | 'root'
  | 'home'
  | 'hizmetler'
  | 'blog'
  | 'randevu'
  | 'iletisim'
  | 'hakkimizda'
  | 'galeri'
  | 'sss';

const CORE = [
  'istanbul temizlik şirketi',
  'profesyonel temizlik hizmetleri',
  'temizlik şirketleri',
  'ev temizliği',
  'ofis temizliği',
  'inşaat sonrası temizlik',
];

const LOCAL = [
  'ataşehir temizlik',
  'kadıköy temizlik',
  'üsküdar temizlik',
  'beşiktaş temizlik',
  'şişli temizlik',
  'maltepe temizlik',
  'pendik temizlik',
];

const CONVERSION = [
  'temizlik şirketi fiyatları istanbul',
  'ücretsiz keşif temizlik',
  'aynı gün temizlik hizmeti',
  'güvenilir temizlik şirketi istanbul',
  'kurumsal temizlik şirketi istanbul',
];

const PAGE_KEYWORDS: Record<PageKey, string[]> = {
  root: [...CORE, ...LOCAL, ...CONVERSION, '7/24 temizlik hizmeti'],
  home: [...CORE, ...LOCAL, ...CONVERSION, 'istanbul ev temizliği', 'istanbul ofis temizliği'],
  hizmetler: [
    'istanbul temizlik hizmetleri',
    'ofis temizliği istanbul',
    'inşaat sonrası temizlik istanbul',
    'koltuk yıkama istanbul',
    'halı yıkama istanbul',
    'detaylı ev temizliği istanbul',
    'apartman temizliği istanbul',
  ],
  blog: [
    'temizlik rehberi',
    'istanbul temizlik ipuçları',
    'temizlik şirketi seçimi',
    'ev temizliği önerileri',
    'ofis hijyen rehberi',
  ],
  randevu: [
    'temizlik randevu',
    'ücretsiz keşif',
    'istanbul temizlik talebi',
    'temizlik hizmeti fiyat teklifi',
    'aynı gün temizlik randevusu',
  ],
  iletisim: [
    'temizlik şirketi iletişim',
    'istanbul temizlik telefonu',
    'temizlik hizmeti talep',
    'temizlik fiyat al',
    'günen temizlik iletişim',
  ],
  hakkimizda: [
    'güvenilir temizlik şirketi',
    'kurumsal temizlik firması istanbul',
    'profesyonel temizlik ekibi',
    'istanbul temizlik referans',
  ],
  galeri: [
    'temizlik öncesi sonrası',
    'istanbul temizlik örnekleri',
    'temizlik hizmet görselleri',
    'ofis temizlik görselleri',
  ],
  sss: [
    'temizlik şirketi sık sorulan sorular',
    'temizlik fiyatları nasıl hesaplanır',
    'ev temizliği ne kadar sürer',
    'ofis temizliği kaç saatte biter',
  ],
};

function uniqueKeywords(items: string[]): string[] {
  return [...new Set(items.map((i) => i.trim().toLowerCase()).filter(Boolean))];
}

export function keywordsForPage(page: PageKey, extras: string[] = []): string[] {
  return uniqueKeywords([...PAGE_KEYWORDS[page], ...extras]).slice(0, 18);
}

