type ServiceFaq = { question: string; answer: string };

const SERVICE_KEYWORD_MAP: Array<{ matcher: RegExp; keywords: string[] }> = [
  {
    matcher: /ofis/i,
    keywords: [
      'ofis temizliği istanbul',
      'kurumsal ofis temizliği',
      'haftalık ofis temizliği',
      'iş yeri temizliği',
    ],
  },
  {
    matcher: /insaat|tadilat/i,
    keywords: [
      'inşaat sonrası temizlik istanbul',
      'tadilat sonrası temizlik',
      'teslim öncesi temizlik',
      'ince temizlik hizmeti',
    ],
  },
  {
    matcher: /koltuk|yatak/i,
    keywords: [
      'koltuk yıkama istanbul',
      'yerinde koltuk yıkama',
      'yatak temizliği',
      'kumaş koltuk temizliği',
    ],
  },
  {
    matcher: /hal[iı]/i,
    keywords: [
      'halı yıkama istanbul',
      'halı temizliği',
      'derin halı temizliği',
      'yerinde halı temizliği',
    ],
  },
  {
    matcher: /cam|cephe/i,
    keywords: [
      'cam temizliği istanbul',
      'dış cephe cam temizliği',
      'ofis cam temizliği',
      'plaza cam temizliği',
    ],
  },
  {
    matcher: /ev|daire|apartman|villa/i,
    keywords: [
      'ev temizliği istanbul',
      'detaylı ev temizliği',
      'boş ev temizliği',
      'taşınma sonrası ev temizliği',
    ],
  },
];

const BASE_SERVICE_FAQ: ServiceFaq[] = [
  {
    question: 'Hizmet öncesi ücretsiz keşif yapıyor musunuz?',
    answer:
      'Evet. İş kapsamı, alan büyüklüğü ve özel ihtiyaçları netleştirmek için ücretsiz ön değerlendirme yapıyoruz.',
  },
  {
    question: 'Temizlik süresi neye göre belirleniyor?',
    answer:
      'Metrekare, kirlilik seviyesi, hizmet kapsamı ve ekip planına göre süre belirlenir. Net süre teklif sırasında paylaşılır.',
  },
  {
    question: 'İstanbul genelinde hizmet veriyor musunuz?',
    answer:
      'Evet, İstanbul genelinde ilçe bazlı planlama ile hizmet veriyoruz. Uygun tarih ve saat için randevu üzerinden hızlıca talep oluşturabilirsiniz.',
  },
];

export function serviceKeywordsFromTitleAndSlug(input: string): string[] {
  const collected = new Set<string>(['istanbul temizlik hizmeti', 'profesyonel temizlik şirketi']);
  for (const item of SERVICE_KEYWORD_MAP) {
    if (item.matcher.test(input)) {
      item.keywords.forEach((k) => collected.add(k));
    }
  }
  return Array.from(collected).slice(0, 14);
}

export function serviceFaqFromFeatures(features: string[]): ServiceFaq[] {
  const items = [...BASE_SERVICE_FAQ];
  if (features.length > 0) {
    items.push({
      question: 'Hizmet kapsamında neler yer alıyor?',
      answer: `Hizmet planında öne çıkan maddeler: ${features.slice(0, 4).join(', ')}.`,
    });
  }
  return items.slice(0, 4);
}

