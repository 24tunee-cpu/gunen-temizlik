export type DistrictLanding = {
  slug: string;
  name: string;
  populationNote: string;
  neighborhoods: string[];
};

export type ServiceLanding = {
  slug: string;
  name: string;
  shortPitch: string;
  intentKeywords: string[];
  faq: Array<{ q: string; a: string }>;
};

export const DISTRICT_LANDINGS: DistrictLanding[] = [
  {
    slug: 'atasehir',
    name: 'Ataşehir',
    populationNote: 'yoğun site yaşamı ve kurumsal ofis trafiği',
    neighborhoods: ['Atatürk', 'Küçükbakkalköy', 'İçerenköy'],
  },
  {
    slug: 'kadikoy',
    name: 'Kadıköy',
    populationNote: 'yüksek konut yoğunluğu ve hızlı randevu ihtiyacı',
    neighborhoods: ['Göztepe', 'Kozyatağı', 'Erenköy'],
  },
  {
    slug: 'uskudar',
    name: 'Üsküdar',
    populationNote: 'konut + ofis karışımı bölgelerde düzenli temizlik talebi',
    neighborhoods: ['Acıbadem', 'Altunizade', 'Çengelköy'],
  },
  {
    slug: 'besiktas',
    name: 'Beşiktaş',
    populationNote: 'yüksek tempolu iş merkezleri ve butik ofis yapısı',
    neighborhoods: ['Levent', 'Etiler', 'Ortaköy'],
  },
  {
    slug: 'sisli',
    name: 'Şişli',
    populationNote: 'plaza ve apartman temizliklerinde süreklilik beklentisi',
    neighborhoods: ['Mecidiyeköy', 'Fulya', 'Nişantaşı'],
  },
  {
    slug: 'bakirkoy',
    name: 'Bakırköy',
    populationNote: 'aile konutlarında periyodik temizlik ihtiyacı',
    neighborhoods: ['Ataköy', 'Yeşilköy', 'Florya'],
  },
  {
    slug: 'bahcelievler',
    name: 'Bahçelievler',
    populationNote: 'orta-yoğun konut alanlarında uygun fiyat beklentisi',
    neighborhoods: ['Yenibosna', 'Şirinevler', 'Soğanlı'],
  },
  {
    slug: 'pendik',
    name: 'Pendik',
    populationNote: 'geniş ilçe ölçeğinde planlı ekip yönlendirme ihtiyacı',
    neighborhoods: ['Kurtköy', 'Çamçeşme', 'Kaynarca'],
  },
];

export const SERVICE_LANDINGS: ServiceLanding[] = [
  {
    slug: 'insaat-sonrasi-temizlik',
    name: 'İnşaat Sonrası Temizlik',
    shortPitch: 'İnce inşaat tozu, moloz kalıntısı ve yüzey detay temizliğini profesyonel ekip ile tamamlarız.',
    intentKeywords: ['inşaat sonrası temizlik fiyatı', 'inşaat sonrası detay temizlik', 'taşınma öncesi temizlik'],
    faq: [
      {
        q: 'İnşaat sonrası temizlik ne kadar sürer?',
        a: 'Alan büyüklüğü ve kirlilik seviyesine göre değişir; keşif sonrası net süre paylaşırız.',
      },
      {
        q: 'Malzeme ve ekipman sizden mi geliyor?',
        a: 'Evet, yüzeye uygun profesyonel ekipman ve ürünlerle hizmet veriyoruz.',
      },
    ],
  },
  {
    slug: 'ofis-temizligi',
    name: 'Ofis Temizliği',
    shortPitch: 'Günlük, haftalık ve aylık planlarla ofisinizde hijyen standardını kesintisiz koruruz.',
    intentKeywords: ['ofis temizlik şirketi', 'kurumsal ofis temizliği', 'düzenli ofis temizlik hizmeti'],
    faq: [
      {
        q: 'Mesai dışı ofis temizliği yapıyor musunuz?',
        a: 'Evet, operasyonunuza uygun saatlerde mesai dışı planlama yapabiliyoruz.',
      },
      {
        q: 'Sözleşmeli hizmet verebiliyor musunuz?',
        a: 'Kurumsal müşteriler için periyodik hizmet sözleşmesi sunuyoruz.',
      },
    ],
  },
  {
    slug: 'koltuk-yikama',
    name: 'Koltuk Yıkama',
    shortPitch: 'Yerinde koltuk yıkama ile kumaşa uygun uygulama yapar, kuruma süresini optimize ederiz.',
    intentKeywords: ['yerinde koltuk yıkama', 'koltuk yıkama fiyatları', 'profesyonel koltuk temizliği'],
    faq: [
      {
        q: 'Koltuk yıkama sonrası kuruma süresi ne kadar?',
        a: 'Kumaş türüne ve hava şartına bağlı olarak ortalama 4-12 saat arasıdır.',
      },
      {
        q: 'Leke çıkarma garantisi veriyor musunuz?',
        a: 'Leke tipine göre başarı oranını önceden bildirir, maksimum sonucu hedefleriz.',
      },
    ],
  },
  {
    slug: 'hali-temizligi',
    name: 'Halı Temizliği',
    shortPitch: 'Halı tipine göre doğru ürün ve teknikle derinlemesine hijyen sağlarız.',
    intentKeywords: ['halı temizliği istanbul', 'profesyonel halı yıkama', 'yerinde halı temizleme'],
    faq: [
      {
        q: 'Her halı türü için aynı yöntem mi uygulanıyor?',
        a: 'Hayır, halının dokusuna ve iplik yapısına göre yöntem seçiyoruz.',
      },
      {
        q: 'Evde halı temizliği hizmeti veriyor musunuz?',
        a: 'Evet, uygun halı türlerinde yerinde hizmet planlanabilir.',
      },
    ],
  },
  {
    slug: 'dis-cephe-temizligi',
    name: 'Dış Cephe Temizliği',
    shortPitch: 'Cam ve cephe yüzeylerinde iş güvenliği odaklı, ekipmanlı dış cephe temizliği sunarız.',
    intentKeywords: ['dış cephe temizliği', 'plaza cam temizliği', 'yüksek kat cam temizliği'],
    faq: [
      {
        q: 'Yüksek kat cephe temizliği güvenli mi?',
        a: 'Ekiplerimiz güvenlik standartlarına uygun ekipman ve prosedürlerle çalışır.',
      },
      {
        q: 'Ne sıklıkla dış cephe temizliği gerekir?',
        a: 'Bina konumu ve kirlilik durumuna göre periyot belirlenir, genelde sezonluk plan önerilir.',
      },
    ],
  },
];

export function getDistrictBySlug(slug: string) {
  return DISTRICT_LANDINGS.find((d) => d.slug === slug);
}

export function getServiceBySlug(slug: string) {
  return SERVICE_LANDINGS.find((s) => s.slug === slug);
}

export function allProgrammaticLandingPaths(): string[] {
  const paths: string[] = ['/bolgeler'];
  for (const d of DISTRICT_LANDINGS) {
    paths.push(`/bolgeler/${d.slug}`);
    for (const s of SERVICE_LANDINGS) {
      paths.push(`/bolgeler/${d.slug}/${s.slug}`);
    }
  }
  return paths;
}
