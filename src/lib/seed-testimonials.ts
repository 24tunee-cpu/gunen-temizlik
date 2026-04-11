/**
 * Kanonik müşteri yorumları — doğru Türkçe, SEO anahtar kelimeleri (İstanbul, hizmet türü, profesyonel temizlik).
 * `seedKey` ile upsert; panelden eklenen yorumlarda seedKey kullanılmaz.
 */
import type { PrismaClient } from '@prisma/client';

export type TestimonialSeedRow = {
  seedKey: string;
  name: string;
  location: string;
  rating: number;
  content: string;
  service: string;
  isActive: boolean;
  order: number;
};

export const TESTIMONIAL_SEED_DATA: TestimonialSeedRow[] = [
  {
    seedKey: 'gunen-ref-01',
    name: 'Ahmet Yılmaz',
    location: 'Kadıköy, İstanbul',
    rating: 5,
    service: 'İnşaat Sonrası Temizlik',
    order: 1,
    isActive: true,
    content:
      'İstanbul Anadolu yakasında inşaat sonrası temizlik firması ararken Günen Temizlik ile çalıştık. Dairedeki ince inşaat tozu, çimento ve cam üzerindeki etiket izleri profesyonel ekipmanlarla alındı. Teslime hazır, hijyenik bir eve kavuştuk; fiyat net ve randevu saatine uyuldu.',
  },
  {
    seedKey: 'gunen-ref-02',
    name: 'Elif Demir',
    location: 'Şişli, İstanbul',
    rating: 5,
    service: 'Ofis Temizliği',
    order: 2,
    isActive: true,
    content:
      'Merkez ofisimiz için haftalık kurumsal ofis temizliği anlaşması yaptık. Ortak alanlar, toplantı odaları ve mutfak hijyeni beklentimizi aştı. İstanbul’da düzenli iş yeri temizliği arayan KOBİ’lere şeffaf sözleşme ve güvenilir ekip sunuyorlar.',
  },
  {
    seedKey: 'gunen-ref-03',
    name: 'Mehmet Kaya',
    location: 'Ataşehir, İstanbul',
    rating: 5,
    service: 'Koltuk Yıkama',
    order: 3,
    isActive: true,
    content:
      'L koltuk takımımız için yerinde koltuk yıkama hizmeti aldık. Kumaştaki lekeler ve evcil hayvan kokusu belirgin şekilde azaldı. İstanbul’da profesyonel koltuk ve kanepe temizliği için tekrar tercih edeceğimiz bir ekip.',
  },
  {
    seedKey: 'gunen-ref-04',
    name: 'Zeynep Arslan',
    location: 'Beşiktaş, İstanbul',
    rating: 5,
    service: 'Cam Temizliği',
    order: 4,
    isActive: true,
    content:
      'Boğaz manzaralı dairemizde iç ve balkon cam temizliği yaptırdık. Güvenlik ekipmanları ve iş disiplini çok iyiydi. Kış öncesi İstanbul’da dış cephe ve cam silme hizmeti düşünenlere gönül rahatlığıyla öneririz.',
  },
  {
    seedKey: 'gunen-ref-05',
    name: 'Can Özdemir',
    location: 'Üsküdar, İstanbul',
    rating: 5,
    service: 'Ev Temizliği',
    order: 5,
    isActive: true,
    content:
      'Aylık periyodik ev temizliği paketi kullanıyoruz. Mutfak, banyo ve zeminler detaylı temizleniyor; kullanılan ürünler konusunda bilgilendirdiler. Çocuklu aileler için İstanbul’da güvenilir ev temizlik şirketi arayanlara uygun.',
  },
  {
    seedKey: 'gunen-ref-06',
    name: 'Burcu Şahin',
    location: 'Maltepe, İstanbul',
    rating: 5,
    service: 'Halı Temizliği',
    order: 6,
    isActive: true,
    content:
      'Salon halılarımız için profesyonel halı yıkama ve derinlemesine temizlik sipariş ettik. Yün ve sentetik dokuda renk solması olmadan sonuç aldık. Anadolu yakası halı temizliği ihtiyacımızda yine Günen Temizlik’i arayacağız.',
  },
  {
    seedKey: 'gunen-ref-07',
    name: 'Oğuz Çelik',
    location: 'Bakırköy, İstanbul',
    rating: 5,
    service: 'İnşaat Sonrası Temizlik',
    order: 7,
    isActive: true,
    content:
      'Tadilat sonrası dairemizde fayans derzleri, dolap içleri ve ince toz temizliği gerçekten titiz yapıldı. İstanbul Avrupa yakasında tadilat / renovasyon sonrası detaylı temizlik arayanlar için doğru adres.',
  },
  {
    seedKey: 'gunen-ref-08',
    name: 'Selin Aydın',
    location: 'Sarıyer, İstanbul',
    rating: 5,
    service: 'Ev Temizliği',
    order: 8,
    isActive: true,
    content:
      'Geniş metrekârlı villamız için genel ev temizliği ve hijyen odaklı uygulama istedik. Mutfak-banyo yüzeyleri ve zeminler profesyonel şekilde parlatıldı. İstanbul’da büyük konut temizliği için planlı ve disiplinli çalıştılar.',
  },
  {
    seedKey: 'gunen-ref-09',
    name: 'Emre Yıldız',
    location: 'Kağıthane, İstanbul',
    rating: 5,
    service: 'Ofis Temizliği',
    order: 9,
    isActive: true,
    content:
      'Ofis taşınması öncesi eski lokasyonumuzda detaylı iş yeri temizliği yaptırdık. Kablo kanalları ve klima ızgaraları gibi detaylar da temizlendi. Ticari temizlik ve teslim öncesi ofis temizliği için memnun kaldık.',
  },
  {
    seedKey: 'gunen-ref-10',
    name: 'Deniz Koç',
    location: 'Pendik, İstanbul',
    rating: 4,
    service: 'Cam Temizliği',
    order: 10,
    isActive: true,
    content:
      'Mağaza vitrin camı ve iç mekân zemin bakımı için anlaştık. Yoğun saat dışında esnek randevu vermeleri işimizi kolaylaştırdı. İstanbul’da perakende ve vitrin cam temizliği için profesyonel bir çözüm sunuyorlar.',
  },
  {
    seedKey: 'gunen-ref-11',
    name: 'Ayşe Karaca',
    location: 'Ümraniye, İstanbul',
    rating: 5,
    service: 'Ev Temizliği',
    order: 11,
    isActive: true,
    content:
      'Çocuklu aile olarak düzenli ev temizliği arıyorduk. Alerji hassasiyetimizi dikkate alıp kullanılan ürünleri açıkladılar. İstanbul Ümraniye çevresinde güvenilir periyodik ev temizliği için tavsiye ederim.',
  },
  {
    seedKey: 'gunen-ref-12',
    name: 'Kerem Polat',
    location: 'Beylikdüzü, İstanbul',
    rating: 5,
    service: 'İnşaat Sonrası Temizlik',
    order: 12,
    isActive: true,
    content:
      'Yeni teslim dairemizde ince işçilik tozu ve etiket kalıntıları vardı; tüm odalar ve balkon detaylı temizlendi. Anahtar teslim sonrası İstanbul’da inşaat sonrası temizlik şirketi arayanlara şiddetle öneririm.',
  },
  {
    seedKey: 'gunen-ref-13',
    name: 'Gizem Tunç',
    location: 'Bağcılar, İstanbul',
    rating: 5,
    service: 'Halı Temizliği',
    order: 13,
    isActive: true,
    content:
      'Kiracı çıkışı sonrası dairedeki halıları yıkatmak için ulaştık. Leke çıkarma ve kurutma süreci profesyoneldi. İstanbul’da uygun fiyatlı halı yıkama ve yerinde servis seçenekleri sunuyorlar.',
  },
  {
    seedKey: 'gunen-ref-14',
    name: 'Murat Ersoy',
    location: 'Fatih, İstanbul',
    rating: 5,
    service: 'Ofis Temizliği',
    order: 14,
    isActive: true,
    content:
      'Avukatlık büromuz için haftalık ofis temizliği hizmeti alıyoruz. Müvekkil bekleme alanı ve arşiv odası düzeni korunuyor. İstanbul merkezde kurumsal temizlik ve gizlilik hassasiyeti arayanlara uygun bir firma.',
  },
  {
    seedKey: 'gunen-ref-15',
    name: 'Pınar Yücel',
    location: 'Kartal, İstanbul',
    rating: 5,
    service: 'Koltuk Yıkama',
    order: 15,
    isActive: true,
    content:
      'Ofis bekleme koltuklarımız için toplu koltuk yıkama sipariş ettik. Kumaş tipine göre ürün seçimi yaptıklarını gördük. İstanbul’da iş yeri ve konut koltuk temizliği için hızlı geri dönüş ve net fiyat.',
  },
  {
    seedKey: 'gunen-ref-16',
    name: 'Hakan Öztürk',
    location: 'Esenyurt, İstanbul',
    rating: 4,
    service: 'Ev Temizliği',
    order: 16,
    isActive: true,
    content:
      'Taşınma öncesi detaylı ev temizliği yaptırdık. Dolap içleri ve balkon detayı güzeldi. İstanbul Esenyurt’ta tek seferlik derin ev temizliği için fiyat-performans dengesi iyi; bir sonraki genel temizlikte yine düşüneceğiz.',
  },
  {
    seedKey: 'gunen-ref-17',
    name: 'Seda Kılıç',
    location: 'Beyoğlu, İstanbul',
    rating: 5,
    service: 'Cam Temizliği',
    order: 17,
    isActive: true,
    content:
      'Tarihi binada yüksek tavanlı dairemiz için iç cam temizliği aldık. Merdiven ve koridor camları da dahildi. İstanbul’da boğaz hattı ve eski yapı cam temizliği için deneyimli ve özenli ekip.',
  },
  {
    seedKey: 'gunen-ref-18',
    name: 'Volkan Ateş',
    location: 'Küçükçekmece, İstanbul',
    rating: 5,
    service: 'İnşaat Sonrası Temizlik',
    order: 18,
    isActive: true,
    content:
      'Ofis tadilatı sonrası geniş alan temizliği sipariş ettik. Toz kontrolü ve zemin cilası sonrası çalışmaya hemen dönebildik. İstanbul’da ticari inşaat sonrası temizlik için zamanında teslim ve koordineli ekip.',
  },
  {
    seedKey: 'gunen-ref-19',
    name: 'Derya Işık',
    location: 'Çekmeköy, İstanbul',
    rating: 5,
    service: 'Ev Temizliği',
    order: 19,
    isActive: true,
    content:
      'Bayram öncesi genel ev temizliği için randevu aldık. Fırın, buzdolabı dışı ve banyo fayansları özenle temizlendi. İstanbul Çekmeköy’de özel gün öncesi profesyonel ev temizliği için güvenilir seçenek.',
  },
  {
    seedKey: 'gunen-ref-20',
    name: 'Barış Güneş',
    location: 'Zeytinburnu, İstanbul',
    rating: 5,
    service: 'Halı Temizliği',
    order: 20,
    isActive: true,
    content:
      'Kilim ve halılarımızı aynı gün içinde alıp teslim ettiler. El dokuma kilime özel yıkama yaklaşımı takdire şayan. İstanbul’da halı ve kilim yıkama hizmeti arayanlar için önerilir.',
  },
  {
    seedKey: 'gunen-ref-21',
    name: 'Ceren Bulut',
    location: 'Maslak, İstanbul',
    rating: 5,
    service: 'Ofis Temizliği',
    order: 21,
    isActive: true,
    content:
      'Plaza katında A+ ofis temizliği standartları istiyorduk; cam cephe ve ortak WC’ler düzenli tutuluyor. İstanbul Maslak’ta kurumsal plaza ofis temizliği için referans verebileceğimiz bir hizmet.',
  },
  {
    seedKey: 'gunen-ref-22',
    name: 'Tolga Aksoy',
    location: 'Bahçelievler, İstanbul',
    rating: 5,
    service: 'Cam Temizliği',
    order: 22,
    isActive: true,
    content:
      'Apartman girişi ve daire içi tüm camlar tek seferde temizlendi. İstanbul Bahçelievler’de site içi daire ve ortak alan cam temizliği için komşularıma da tavsiye ettim; lekesiz ve hızlı sonuç.',
  },
];

export async function upsertCanonicalTestimonials(prisma: PrismaClient): Promise<number> {
  for (const row of TESTIMONIAL_SEED_DATA) {
    const { seedKey, ...fields } = row;
    const existing = await prisma.testimonial.findFirst({ where: { seedKey } });
    if (existing) {
      await prisma.testimonial.update({
        where: { id: existing.id },
        data: {
          name: fields.name,
          location: fields.location,
          rating: fields.rating,
          content: fields.content,
          service: fields.service,
          isActive: fields.isActive,
          order: fields.order,
        },
      });
    } else {
      await prisma.testimonial.create({
        data: { seedKey, ...fields },
      });
    }
  }

  await prisma.testimonial.deleteMany({
    where: {
      OR: [
        { name: 'Fatma Ozturk', location: 'Istanbul' },
        { name: 'Ali Cetin', location: 'Ankara' },
      ],
    },
  });

  /** Eski createMany seed ile eklenmiş, seedKey’siz mükerrer satırlar (aynı isimler) */
  await prisma.testimonial.deleteMany({
    where: {
      seedKey: null,
      name: {
        in: [
          'Ahmet Yılmaz',
          'Elif Demir',
          'Mehmet Kaya',
          'Zeynep Arslan',
          'Can Özdemir',
          'Burcu Şahin',
          'Oğuz Çelik',
          'Selin Aydın',
          'Emre Yıldız',
          'Deniz Koç',
          'Ayşe Karaca',
          'Kerem Polat',
        ],
      },
    },
  });

  return TESTIMONIAL_SEED_DATA.length;
}
