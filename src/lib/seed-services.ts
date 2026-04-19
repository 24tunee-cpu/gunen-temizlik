/**
 * Kanonik hizmet seed verisi — doğru Türkçe ve SEO odaklı metinler.
 * `prisma/seed.ts` ve `api/seed-admin` aynı kaynağı kullanır.
 */
import type { Prisma, PrismaClient } from '@prisma/client';

export type ServiceSeedRow = Omit<Prisma.ServiceCreateInput, 'id'> & {
  slug: string;
};

export const SERVICE_SEED_DATA: ServiceSeedRow[] = [
  {
    title: 'Ev Temizliği',
    slug: 'ev-temizligi',
    shortDesc:
      'İstanbul’da profesyonel ev temizliği: mutfak, banyo ve yaşam alanlarında derinlemesine hijyen. Tek seferlik veya düzenli paketlerle güvenilir hizmet.',
    description: `İstanbul’un tüm ilçelerinde sunduğumuz ev temizliği hizmetiyle yaşam alanınızı sağlıklı ve ferah tutuyoruz. Mutfak tezgâhları, dolap önleri, banyo fayansları, klozet ve duş kabinleri; toz alma, süpürme, silme ve zemin bakımı profesyonel ekipmanlarla yapılır.

Düzenli ev temizliği paketleri (haftalık, iki haftada bir veya aylık) ile yoğun tempoda bile evinizin standartını koruyabilirsiniz. Tek seferlik genel temizlik, taşınma öncesi/sonrası veya özel gün öncesi detaylı temizlik taleplerinize uygun planlama sunuyoruz.

Çocuklu aileler ve alerji hassasiyeti olanlar için yüzey uyumlu, güvenli ürün seçimi ve gerektiğinde dezenfeksiyon uygulamalarıyla hijyeni ön planda tutuyoruz. Ücretsiz keşif ve şeffaf fiyatlandırma ile Günen Temizlik’e hemen ulaşın.`,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    icon: 'Home',
    features: [
      'Mutfak ve banyo detay temizliği',
      'Toz alma ve zemin bakımı',
      'Düzenli veya tek seferlik paketler',
      'İstanbul geneli hızlı randevu',
      'Hijyen ve dezenfeksiyon desteği',
    ],
    priceRange: '400 TL – 1.800 TL (metrekareye göre)',
    order: 1,
    isActive: true,
    metaTitle: 'Ev Temizliği İstanbul | Profesyonel Ev Temizlik Şirketi',
    metaDesc:
      'İstanbul’da profesyonel ev temizliği. Derinlemesine mutfak, banyo ve genel temizlik; düzenli paketler, uygun fiyat. Hemen randevu alın.',
  },
  {
    title: 'Ofis Temizliği',
    slug: 'ofis-temizligi',
    shortDesc:
      'Kurumsal ofis temizliği ve İstanbul iş yeri hijyeni: günlük, haftalık veya aylık planlar. Çalışan sağlığı ve marka imajınız için düzenli profesyonel ekip.',
    description: `Ofis temizliği, çalışan verimliliği, iş güvenliği ve müşterilerinize yansıyan kurumsal imaj için kritik öneme sahiptir. Açık ofis, yönetici odaları, toplantı salonları, ortak mutfak ve WC alanlarında standartlara uygun temizlik protokolleri uyguluyoruz.

Günlük yüzey temizliği, haftalık detay çalışması veya aylık derin temizlik seçenekleriyle ihtiyacınıza göre esnek sözleşmeler sunuyoruz. Zemin cinsi (halı, parke, seramik), cam yüzeyler ve elektronik ekipman çevresi için güvenli yöntemler kullanıyoruz.

İstanbul’daki işletmelere yönelik kurumsal temizlik çözümlerimizle KVKK ve işyeri hijyeni beklentilerine uyumlu, kayıt altına alınabilir hizmet yapısı sağlıyoruz. Keşif sonrası sabit fiyat veya metrekare bazlı teklif ile şeffaf çalışıyoruz.`,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    icon: 'Building2',
    features: [
      'Günlük / haftalık / aylık planlar',
      'Ortak alan ve WC hijyeni',
      'Cam ve zemin profesyonel bakım',
      'Kurumsal sözleşme ve raporlama',
      'İstanbul geneli ekip desteği',
    ],
    priceRange: '350 TL – 3.500 TL (alan ve sıklığa göre)',
    order: 2,
    isActive: true,
    metaTitle: 'Ofis Temizliği İstanbul | Kurumsal İş Yeri Temizliği',
    metaDesc:
      'İstanbul ofis temizliği ve kurumsal iş yeri hijyeni. Esnek günlük/haftalık planlar, profesyonel ekip. Teklif için iletişime geçin.',
  },
  {
    title: 'Koltuk Yıkama',
    slug: 'koltuk-yikama',
    shortDesc:
      'Koltuk, kanepe ve sandalye yıkama: leke çıkarma, koku giderme ve kumaş tipine özel derinlemesine temizlik. Ev ve ofis için yerinde profesyonel hizmet.',
    description: `Koltuk ve kanepe yıkama hizmetimizle oturma gruplarınızın ömrünü uzatırken yaşam kalitesini artırıyoruz. Gıda lekeleri, evcil hayvan izleri, toz akarları ve kötü kokulara karşı kumaş analiziyle uygun deterjan ve ekstraksiyon yöntemi seçiyoruz.

Profesyonel makinelerle derinlemesine yıkama, emiş gücü yüksek vakumlama ve kontrollü kurutma süreçleri uygulanır. Deri, süet, keten veya sentetik döşemelerde yüzeye zarar vermeden çalışıyoruz.

İstanbul içinde yerinde hizmet ile mobilyalarınızı taşıma zorunluluğu olmadan evinizde veya ofisinizde temizliyoruz. Periyodik yıkama önerileri ve leke önleyici bakım tavsiyeleriyle uzun vadede tasarruf sağlamanıza yardımcı oluyoruz.`,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    icon: 'Sofa',
    features: [
      'Leke ve koku giderme',
      'Kumaş tipine özel ürün seçimi',
      'Ekstraksiyon ile derinlemesine yıkama',
      'Yerinde servis (İstanbul)',
      'Hızlı kuruma süreci',
    ],
    priceRange: '180 TL – 650 TL (parça ve kumaşa göre)',
    order: 3,
    isActive: true,
    metaTitle: 'Koltuk Yıkama İstanbul | Kanepe ve Döşeme Temizliği',
    metaDesc:
      'Profesyonel koltuk yıkama ve kanepe temizliği İstanbul’da. Leke çıkarma, koku giderme, yerinde hizmet. Hemen fiyat alın.',
  },
  {
    title: 'Halı Temizliği',
    slug: 'hali-temizligi',
    shortDesc:
      'Halı ve kilim yıkama: makine ve el dokuma halılara özel yöntemler, alerjen ve toz giderme. İstanbul’da yerinde veya fabrika tipi profesyonel temizlik.',
    description: `Halı ve kilimlerinizde biriken toz, alerjen, leke ve kötü kokulara karşı profesyonel halı temizliği sunuyoruz. Makine halılarından el dokuma ürünlere kadar lif yapısına uygun sıcaklık, deterjan ve kurutma süreçleri uygulanır.

Derinlemesine yıkama ile halı ömrünü uzatırken iç mekan hava kalitesini iyileştirirsiniz. Ofis ve ev tipi halılarda ayrı iş akışları; gerekirse yerinde ön işlem veya toplama–teslimat seçenekleriyle esnek hizmet veriyoruz.

İstanbul’da halı yıkama ve halı temizliği arayan müşterilerimize şeffaf metrekare fiyatları ve ücretsiz bilgilendirme sunuyoruz. Lekeli bölgeler için ön değerlendirme ve renk sabitliği testleriyle güvenli sonuç hedefliyoruz.`,
    image: 'https://images.unsplash.com/photo-1558317374-a354d5f6d40b?w=800',
    icon: 'Square',
    features: [
      'Makine ve el halısına özel işlem',
      'Alerjen ve toz giderme',
      'Leke ön işlem ve derin yıkama',
      'Kontrollü kurutma',
      'İstanbul geneli hizmet',
    ],
    priceRange: '120 TL – 1.200 TL (m² ve halı tipine göre)',
    order: 4,
    isActive: true,
    metaTitle: 'Halı Temizliği İstanbul | Profesyonel Halı Yıkama',
    metaDesc:
      'İstanbul halı temizliği ve halı yıkama. El dokuma ve makine halısına özel yöntemler, leke ve alerjen giderme. Ücretsiz bilgi için arayın.',
  },
  {
    title: 'İnşaat Sonrası Temizlik',
    slug: 'insaat-sonrasi-temizlik',
    shortDesc:
      'Tadilat ve inşaat sonrası detaylı temizlik: inşaat tozu, boya ve sıva izleri, cam ve zemin. Teslime hazır, yaşanabilir mekan için profesyonel ekip.',
    description: `Yeni yapılan veya tadilat görmüş mekânlarda inşaat tozu, boya sıçramaları, çimento ve seramik artıkları ciddi hijyen ve estetik sorunu yaratır. İnşaat sonrası temizlik hizmetimizle daire, villa, ofis veya ticari alanları yaşanabilir seviyeye getiriyoruz.

Endüstriyel süpürgeler, yüzey uyumlu kimyasallar ve detay fırçaları ile fayans derzleri, pimapenler, iç camlar ve teknik hacimler dahil kapsamlı temizlik yapıyoruz. Gerekirse birden fazla gün ve ekip ile teslim tarihine uygun planlama sunuyoruz.

İstanbul’da inşaat sonrası temizlik şirketi arayan müteahhit, ev sahibi ve kiracılara deneyimli kadro ve sigortalı çalışma ile güvence veriyoruz. Teslim öncesi kontrol listesi ile eksiksiz sonuç hedefliyoruz.`,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    icon: 'HardHat',
    features: [
      'İnşaat tozu ve artık giderme',
      'Boya / sıva lekesi temizliği',
      'Cam, zemin ve banyo detayı',
      'Teslime hazır teslim',
      'İstanbul geneli proje desteği',
    ],
    priceRange: '600 TL – 6.000 TL (metrekare ve kirliliğe göre)',
    order: 5,
    isActive: true,
    metaTitle: 'İnşaat Sonrası Temizlik İstanbul | Tadilat Sonrası Detaylı Temizlik',
    metaDesc:
      'İstanbul inşaat sonrası temizlik ve tadilat temizliği. Toz, boya ve inşaat artığı giderme; profesyonel ekip, net teslim. Keşif için arayın.',
  },
  {
    title: 'Cam Temizliği',
    slug: 'cam-temizligi',
    shortDesc:
      'İç ve dış cephe cam temizliği, vitrin ve yüksek cam güvenli erişim. İstanbul’da iş yeri ve konut için parlak, lekesiz sonuç ve düzenli bakım paketleri.',
    description: `Cam yüzeylerinizin iç ve dış cephe temizliğinde hem estetik hem güvenlik standartlarına uygun çalışıyoruz. Ofis katları, mağaza vitrinleri, konut balkonları ve cephe camlarında profesyonel silecek, uzatma sistemleri ve gerektiğinde yüksek erişim ekipmanları kullanıyoruz.

Çerçeve ve doğrama bölgelerinde biriken toz ve yağmur izlerini gidererek uzun süreli parlaklık sağlıyoruz. Periyodik cam temizliği paketleri ile işletmenizin vitrin görünürlüğünü ve çalışma alanlarınızın ışık kalitesini koruyabilirsiniz.

İstanbul’da dış cephe cam temizliği ve iç mekan cam silme hizmetlerinde sigortalı ekip ve iş güvenliği prosedürleriyle hizmet veriyoruz. Metrekare ve erişim zorluğuna göre net fiyatlandırma sunuyoruz.`,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    icon: 'PanelTop',
    features: [
      'İç ve dış cephe cam',
      'Vitrin ve ofis yüzeyleri',
      'Güvenli yüksek erişim',
      'Çerçeve ve doğrama temizliği',
      'Düzenli bakım paketleri',
    ],
    priceRange: '250 TL – 2.500 TL (yükseklik ve alana göre)',
    order: 6,
    isActive: true,
    metaTitle: 'Cam Temizliği İstanbul | Dış Cephe ve Ofis Cam Silme',
    metaDesc:
      'İstanbul cam temizliği: iç/dış cephe, vitrin ve yüksek cam. Profesyonel ekip, güvenli erişim, düzenli paketler. Teklif alın.',
  },
  {
    title: 'Dış Cephe Temizliği',
    slug: 'dis-cephe-temizligi',
    shortDesc:
      'Dış cephe cam ve cephe yüzeylerinde güvenli erişimle profesyonel temizlik. İş güvenliği prosedürleriyle düzenli bakım hizmeti.',
    description: `Dış cephe cam ve cephe yüzeylerinde biriken kir, yağmur izi ve zamanla oluşan matlaşma görüntüsünü profesyonel ekipmanlarla gideriyoruz.

Yüksek erişim gerektiren alanlarda iş güvenliği prosedürlerine uygun şekilde çalışır; uygun kimyasal ve temizleme yöntemiyle yüzeye zarar vermeden net ve parlak sonuç hedefleriz.

Düzenli dış cephe cam temizliği paketleriyle işletmenizin vitrin görünürlüğünü ve bina estetiğini korumanıza yardımcı oluyoruz. İş kapsamı keşif sonrası netleştirilir, buna göre şeffaf bir plan ve fiyatlendirme yapılır.`,
    image: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800',
    icon: 'Droplets',
    features: [
      'Dış cephe cam ve cephe yüzey temizliği',
      'Yüksek erişim için güvenli çalışma düzeni',
      'Su izi, lekelenme ve kir giderimi',
      'İş güvenliği prosedürleri ve kontrol adımları',
      'Düzenli bakım planı ile zaman kazanımı',
    ],
    priceRange: '350 TL – 3.500 TL (erişim ve metrekareye göre)',
    order: 7,
    isActive: true,
    metaTitle: 'Dış Cephe Temizliği | İstanbul',
    metaDesc:
      'İstanbul dış cephe temizliği ve dış cephe cam silme hizmeti. Güvenli erişim, su izi/yağmur izi giderme ve düzenli bakım planları. Teklif al.',
  },
];

const LEGACY_SLUGS_TO_DEACTIVATE = ['hali-yikama'] as const;

export async function upsertCanonicalServices(prisma: PrismaClient): Promise<number> {
  for (const row of SERVICE_SEED_DATA) {
    const { slug, ...rest } = row;
    await prisma.service.upsert({
      where: { slug },
      create: { slug, ...rest },
      update: {
        title: rest.title,
        description: rest.description,
        shortDesc: rest.shortDesc,
        image: rest.image ?? null,
        icon: rest.icon,
        features: rest.features,
        priceRange: rest.priceRange ?? null,
        order: rest.order,
        isActive: rest.isActive,
        metaTitle: rest.metaTitle ?? null,
        metaDesc: rest.metaDesc ?? null,
      },
    });
  }

  await prisma.service.updateMany({
    where: { slug: { in: [...LEGACY_SLUGS_TO_DEACTIVATE] } },
    data: { isActive: false },
  });

  return SERVICE_SEED_DATA.length;
}
