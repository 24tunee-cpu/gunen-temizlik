export type DistrictLanding = {
  slug: string;
  name: string;
  populationNote: string;
  neighborhoods: string[];
  /** Yerel SEO ve meta metinlerinde yaka bağlamı */
  side?: 'anadolu' | 'avrupa';
  /** Kısa tanıtım cümlesi (mahalle + operasyon odağı) */
  regionBlurb?: string;
};

export type ServiceLanding = {
  slug: string;
  name: string;
  shortPitch: string;
  intentKeywords: string[];
  blogTagHints: string[];
  faq: Array<{ q: string; a: string }>;
};

export type ProgrammaticContentVariant = {
  heroLead: string;
  trustPoints: string[];
  processSteps: string[];
  localAngle: string;
};

type ProgrammaticMetaOverride = {
  title?: string;
  description?: string;
};

import metaOverrides from '@/config/programmatic-meta-overrides.json';

export const DISTRICT_LANDINGS: DistrictLanding[] = [
  {
    slug: 'atasehir',
    name: 'Ataşehir',
    side: 'anadolu',
    populationNote: 'yoğun site yaşamı ve kurumsal ofis trafiği',
    regionBlurb:
      'Finans ve iş merkezi yoğunluğu yüksek; plaza, AVM ve rezidanslarda düzenli operasyon planları kuruyoruz.',
    neighborhoods: ['Atatürk', 'Küçükbakkalköy', 'İçerenköy', 'Barbaros', 'Yenişehir', 'Mustafa Kemal'],
  },
  {
    slug: 'kadikoy',
    name: 'Kadıköy',
    side: 'anadolu',
    populationNote: 'yüksek konut yoğunluğu ve hızlı randevu ihtiyacı',
    regionBlurb:
      'Merkezi konum ve çok çeşitli konut/ofis dokusu; aynı gün veya ertesi gün ekip yönlendirmesi yapıyoruz.',
    neighborhoods: ['Göztepe', 'Kozyatağı', 'Erenköy', 'Moda', 'Fenerbahçe', 'Bostancı', 'Suadiye'],
  },
  {
    slug: 'uskudar',
    name: 'Üsküdar',
    side: 'anadolu',
    populationNote: 'konut + ofis karışımı bölgelerde düzenli temizlik talebi',
    regionBlurb:
      'Boğaz hattı ve iç bölgelerde apartman, villa ve işyeri temizliklerinde esnek saatler sunuyoruz.',
    neighborhoods: ['Acıbadem', 'Altunizade', 'Çengelköy', 'Bulgurlu', 'Ünalan', 'Kısıklı'],
  },
  {
    slug: 'besiktas',
    name: 'Beşiktaş',
    side: 'avrupa',
    populationNote: 'yüksek tempolu iş merkezleri ve butik ofis yapısı',
    regionBlurb:
      'Levent ve çevresinde kurumsal hijyen, butik ofis ve rezidans projelerinde deneyimli ekipler.',
    neighborhoods: ['Levent', 'Etiler', 'Ortaköy', 'Bebek', 'Arnavutköy', 'Abbasağa'],
  },
  {
    slug: 'sisli',
    name: 'Şişli',
    side: 'avrupa',
    populationNote: 'plaza ve apartman temizliklerinde süreklilik beklentisi',
    regionBlurb:
      'Plaza, rezidans ve perakende hatlarında gece veya mesai dışı temizlik planlaması yapıyoruz.',
    neighborhoods: ['Mecidiyeköy', 'Fulya', 'Nişantaşı', 'Harbiye', 'Osmanbey', 'Bomonti'],
  },
  {
    slug: 'bakirkoy',
    name: 'Bakırköy',
    side: 'avrupa',
    populationNote: 'aile konutlarında periyodik temizlik ihtiyacı',
    regionBlurb:
      'Sahil ve iç mahallelerde konut, ofis ve mağaza temizliklerinde düzenli sözleşmeli hizmet veriyoruz.',
    neighborhoods: ['Ataköy', 'Yeşilköy', 'Florya', 'Zeytinlik', 'Kartaltepe', 'Şenlikköy'],
  },
  {
    slug: 'bahcelievler',
    name: 'Bahçelievler',
    side: 'avrupa',
    populationNote: 'orta-yoğun konut alanlarında uygun fiyat beklentisi',
    regionBlurb:
      'Geniş apartman dokusunda periyodik ev temizliği ve taşınma öncesi/sonrası paketler sunuyoruz.',
    neighborhoods: ['Yenibosna', 'Şirinevler', 'Soğanlı', 'Kocasinan', 'Çobançeşme', 'Bahçelievler Merkez'],
  },
  {
    slug: 'pendik',
    name: 'Pendik',
    side: 'anadolu',
    populationNote: 'geniş ilçe ölçeğinde planlı ekip yönlendirme ihtiyacı',
    regionBlurb:
      'Havalimanı ve sanayi çevresi dahil geniş coğrafyada rota bazlı ekip planlaması yapıyoruz.',
    neighborhoods: ['Kurtköy', 'Çamçeşme', 'Kaynarca', 'Velibaba', 'Pendik Merkez', 'Güzelyalı'],
  },
  {
    slug: 'umraniye',
    name: 'Ümraniye',
    side: 'anadolu',
    populationNote: 'site ve iş merkezi yoğunluğu ile hızlı büyüyen talep',
    regionBlurb:
      'Finans Merkezi ve çevresinde ofis, mağaza ve rezidans temizliklerinde yoğun operasyon kapasitesi.',
    neighborhoods: ['İnkılap', 'Şerifali', 'Atakent', 'Çakmak', 'Site', 'Parseller'],
  },
  {
    slug: 'maltepe',
    name: 'Maltepe',
    side: 'anadolu',
    populationNote: 'sahil şeridi ve konut projelerinde düzenli hizmet ihtiyacı',
    regionBlurb:
      'Sahil hattı ve iç mahallelerde daire, dubleks ve işyeri temizliklerinde hızlı randevu.',
    neighborhoods: ['Cevizli', 'Feyzullah', 'Gülsuyu', 'Altıntepe', 'Bağlarbaşı', 'İdealtepe'],
  },
  {
    slug: 'kartal',
    name: 'Kartal',
    side: 'anadolu',
    populationNote: 'konut + OSB çevresinde çeşitli temizlik senaryoları',
    regionBlurb:
      'Yakın çevre sanayi ve konut bölgelerinde inşaat sonrası ve periyodik temizlik paketleri.',
    neighborhoods: ['Yakacık', 'Soğanlık', 'Uğur Mumcu', 'Hürriyet', 'Orhantepe', 'Topselvi'],
  },
  {
    slug: 'sariyer',
    name: 'Sarıyer',
    side: 'avrupa',
    populationNote: 'villa, site ve yüksek gelir segmentinde detay beklentisi',
    regionBlurb:
      'Boğaz hattı ve orman içi yerleşimlerde hijyen ve güven odaklı, titiz uygulama sunuyoruz.',
    neighborhoods: ['Maslak', 'Zekeriyaköy', 'Tarabya', 'Yeniköy', 'Bahçeköy', 'Rumelihisarı'],
  },
  {
    slug: 'kagithane',
    name: 'Kağıthane',
    side: 'avrupa',
    populationNote: 'kentsel dönüşüm ve yeni projelerde yoğun talep',
    regionBlurb:
      'Yeni rezidans ve ofis projelerinde inşaat sonrası teslim ve düzenli temizlik hizmeti veriyoruz.',
    neighborhoods: ['Çağlayan', 'Gürsel', 'Seyrantepe', 'Merkez', 'Hamidiye', 'Sultan Selim'],
  },
  {
    slug: 'eyupsultan',
    name: 'Eyüpsultan',
    side: 'avrupa',
    populationNote: 'geleneksel konut ve yeni konut karışımı',
    regionBlurb:
      'Tarihi semt ve yeni yerleşimlerde aile konutlarına uygun fiyatlı periyodik paketler sunuyoruz.',
    neighborhoods: ['Alibeyköy', '5. Levent', 'Göktürk', 'Kemerburgaz', 'Çırçır', 'Ram'],
  },
  {
    slug: 'bayrampasa',
    name: 'Bayrampaşa',
    side: 'avrupa',
    populationNote: 'sanayi ve konut yakınlığında pratik hizmet beklentisi',
    regionBlurb:
      'İşyeri, depo ve konut temizliklerinde kısa süreli ekip çıkışı ve net kapsam sunuyoruz.',
    neighborhoods: ['Yıldırım', 'Muratpaşa', 'Kartaltepe', 'İsmet Paşa', 'Vatan', 'Terazidere'],
  },
  {
    slug: 'gaziosmanpasa',
    name: 'Gaziosmanpaşa',
    side: 'avrupa',
    populationNote: 'yoğun apartman dokusunda fiyat-duyarlı segment',
    regionBlurb:
      'Apartman ve site içi ortak alan + daire temizliklerinde şeffaf süre ve fiyat politikası.',
    neighborhoods: ['Bağlarbaşı', 'Karayolları', 'Yıldıztabya', 'Fevzi Çakmak', 'Habibler', 'Şemsipaşa'],
  },
  {
    slug: 'zeytinburnu',
    name: 'Zeytinburnu',
    side: 'avrupa',
    populationNote: 'sanayi, lojistik ve konut iç içe',
    regionBlurb:
      'İşyeri, atölye ve konut temizliklerinde esnek vardiya ve hızlı teklif süreci.',
    neighborhoods: ['Maltepe', 'Veliefendi', 'Kazlıçeşme', 'Merkezefendi', 'Telsiz', 'Yeşiltepe'],
  },
  {
    slug: 'fatih',
    name: 'Fatih',
    side: 'avrupa',
    populationNote: 'tarihi yapı ve dar sokaklarda özel dikkat gerektiren alanlar',
    regionBlurb:
      'Dar sokak ve tarihi çevrede apartman, pansiyon ve küçük işyeri temizliklerinde deneyimli ekip.',
    neighborhoods: ['Balat', 'Fener', 'Sultanahmet', 'Aksaray', 'Çarşamba', 'Kocamustafapaşa'],
  },
];

export const SERVICE_LANDINGS: ServiceLanding[] = [
  {
    slug: 'insaat-sonrasi-temizlik',
    name: 'İnşaat Sonrası Temizlik',
    shortPitch: 'İnce inşaat tozu, moloz kalıntısı ve yüzey detay temizliğini profesyonel ekip ile tamamlarız.',
    intentKeywords: ['inşaat sonrası temizlik fiyatı', 'inşaat sonrası detay temizlik', 'taşınma öncesi temizlik'],
    blogTagHints: ['inşaat', 'temizlik', 'ev temizliği'],
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
    blogTagHints: ['ofis', 'kurumsal', 'hijyen'],
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
    slug: 'ev-temizligi',
    name: 'Ev Temizliği',
    shortPitch:
      'Mutfak, banyo ve yaşam alanlarında derinlemesine hijyen; tek seferlik veya düzenli paketlerle güvenilir ev temizliği.',
    intentKeywords: ['ev temizliği istanbul', 'profesyonel ev temizliği', 'daire temizliği', 'genel ev temizliği'],
    blogTagHints: ['ev temizliği', 'temizlik', 'hijyen'],
    faq: [
      {
        q: 'Ev temizliği ne kadar sürer?',
        a: 'Metrekare, kirlilik ve talep edilen kapsama göre değişir; keşif sonrası net süre paylaşırız.',
      },
      {
        q: 'Malzemeleri siz mi getiriyorsunuz?',
        a: 'Evet, yüzeye uygun profesyonel ürün ve ekipmanlarla hizmet veriyoruz.',
      },
    ],
  },
  {
    slug: 'koltuk-yikama',
    name: 'Koltuk Yıkama',
    shortPitch: 'Yerinde koltuk yıkama ile kumaşa uygun uygulama yapar, kuruma süresini optimize ederiz.',
    intentKeywords: ['yerinde koltuk yıkama', 'koltuk yıkama fiyatları', 'profesyonel koltuk temizliği'],
    blogTagHints: ['koltuk', 'ev temizliği', 'hijyen'],
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
    blogTagHints: ['halı', 'ev temizliği', 'hijyen'],
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
    blogTagHints: ['cam', 'dış cephe', 'ofis'],
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
  {
    slug: 'cam-temizligi',
    name: 'Cam Temizliği',
    shortPitch:
      'İç ve dış cephe cam, vitrin ve yüksek erişim gerektiren yüzeylerde lekesiz parlaklık ve düzenli bakım paketleri.',
    intentKeywords: ['cam temizliği istanbul', 'ofis cam silme', 'vitrin cam temizliği', 'yüksek cam temizliği'],
    blogTagHints: ['cam', 'ofis', 'hijyen'],
    faq: [
      {
        q: 'Dış cephe cam ile iç mekan cam aynı gün yapılabilir mi?',
        a: 'Erişim, güvenlik ve hava koşullarına göre planlanır; keşif sonrası en uygun sırayı öneririz.',
      },
      {
        q: 'Periyodik cam temizliği paketi var mı?',
        a: 'Evet, işletme ve site yönetimleri için haftalık/aylık planlar oluşturabiliyoruz.',
      },
    ],
  },
];

export function getDistrictBySlug(slug: string) {
  return DISTRICT_LANDINGS.find((d) => d.slug === slug);
}

/** Arayüz ve meta için kısa yaka etiketi */
export function formatDistrictSide(district: DistrictLanding): string {
  if (district.side === 'anadolu') return 'Anadolu yakası';
  if (district.side === 'avrupa') return 'Avrupa yakası';
  return '';
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

const HERO_TEMPLATES = [
  '{district} bölgesinde {serviceLower} ihtiyacında hızlı ekip yönlendirmesi ve net iş planı sunuyoruz.',
  '{district} için planlı {serviceLower} hizmetinde keşif sonrası kapsamı şeffaf biçimde paylaşıyoruz.',
  '{district} içinde {serviceLower} arayan kullanıcılar için hızlı randevu ve profesyonel uygulama sağlıyoruz.',
  '{district}: {regionHint} {serviceLower} kapsamını adresinize göre netleştiriyoruz.',
];

const LOCAL_ANGLES = [
  '{district} bölgesindeki {neighborhood} çevresinde yoğun talep saatlerine göre ekip planlaması yapıyoruz.',
  '{district} için mahalle bazlı rota planı ile bekleme süresini azaltıyoruz ({neighborhood} dahil).',
  '{district} tarafında özellikle {neighborhood} hattında düzenli operasyon tecrübemiz bulunuyor.',
];

const TRUST_POINT_TEMPLATES = [
  'İş öncesi kapsam netliği: hangi alanların temizleneceği baştan belirlenir.',
  'Yüzeye uygun ürün seçimi ve kontrol listesi ile standart kalite sağlanır.',
  'Tamamlanan iş sonrası kontrol adımı ile eksik noktalar hızlıca kapatılır.',
];

const PROCESS_STEP_TEMPLATES = [
  'İhtiyaç bilgisi alınır ve keşif/brief ile iş kapsamı netleştirilir.',
  'Ekip planlaması yapılarak bölgeye en uygun saat aralığı belirlenir.',
  'Uygulama tamamlandıktan sonra kalite kontrol ile teslim yapılır.',
];

function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function fillTemplate(
  template: string,
  district: DistrictLanding,
  service: ServiceLanding,
  neighborhoodPick: string
): string {
  const regionHint = district.regionBlurb || district.populationNote;
  return template
    .replaceAll('{district}', district.name)
    .replaceAll('{service}', service.name)
    .replaceAll('{serviceLower}', service.name.toLowerCase())
    .replaceAll('{neighborhood}', neighborhoodPick)
    .replaceAll('{regionHint}', regionHint);
}

export function buildProgrammaticContentVariant(
  district: DistrictLanding,
  service: ServiceLanding
): ProgrammaticContentVariant {
  const seed = hashKey(`${district.slug}:${service.slug}`);
  const nh =
    district.neighborhoods[seed % Math.max(1, district.neighborhoods.length)] ??
    district.name;

  const heroLead = fillTemplate(HERO_TEMPLATES[seed % HERO_TEMPLATES.length], district, service, nh);
  const localAngle = fillTemplate(LOCAL_ANGLES[(seed + 1) % LOCAL_ANGLES.length], district, service, nh);

  const trustPoints = TRUST_POINT_TEMPLATES.map((t) => fillTemplate(t, district, service, nh));
  const processSteps = PROCESS_STEP_TEMPLATES.map((t) => fillTemplate(t, district, service, nh));

  return {
    heroLead,
    trustPoints,
    processSteps,
    localAngle,
  };
}

export function getNearbyDistrictSlugs(currentSlug: string, count = 3): string[] {
  const index = DISTRICT_LANDINGS.findIndex((d) => d.slug === currentSlug);
  if (index === -1) return DISTRICT_LANDINGS.slice(0, count).map((d) => d.slug);
  const results: string[] = [];
  for (let i = 1; i <= DISTRICT_LANDINGS.length && results.length < count; i++) {
    const d = DISTRICT_LANDINGS[(index + i) % DISTRICT_LANDINGS.length];
    if (d.slug !== currentSlug) results.push(d.slug);
  }
  return results;
}

export function getProgrammaticMetaOverride(
  districtSlug: string,
  serviceSlug: string
): ProgrammaticMetaOverride | null {
  const key = `${districtSlug}/${serviceSlug}`;
  const map = metaOverrides as Record<string, ProgrammaticMetaOverride>;
  if (!map[key]) return null;
  const raw = map[key];
  const hasValue = Boolean(raw?.title?.trim() || raw?.description?.trim());
  return hasValue ? raw : null;
}
