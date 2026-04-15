import { PrismaClient } from '@prisma/client';

type Topic = {
  keyword: string;
  title: string;
  category: string;
  tags: string[];
  focus: string;
};

const TARGET_COUNT = 80;
const AUTHOR = 'Günen Temizlik';
const DEFAULT_IMAGE = '/logo.png';

const DISTRICTS = [
  'Kadikoy',
  'Uskudar',
  'Besiktas',
  'Sisli',
  'Atasehir',
  'Maltepe',
  'Kartal',
  'Pendik',
  'Bakirkoy',
  'Bahcelievler',
];

const TOPICS: Topic[] = [
  {
    keyword: 'Temizlik Şirketleri',
    title: 'Istanbul Temizlik Sirketleri Rehberi: Dogru Firma Secimi Icin 12 Kriter',
    category: 'Temizlik Sirketi Rehberi',
    tags: ['temizlik sirketleri', 'istanbul temizlik', 'dogru firma secimi', 'kurumsal temizlik'],
    focus: 'Istanbul genelinde temizlik sirketleri arasinda kalite, guven ve fiyat dengesini kurmak.',
  },
  {
    keyword: 'Ev Temizligi',
    title: 'Istanbul Ev Temizligi: Hangi Paket Size Uygun, Nelere Dikkat Etmelisiniz?',
    category: 'Ev Temizligi',
    tags: ['ev temizligi', 'istanbul ev temizligi', 'detayli ev temizligi', 'hijyen'],
    focus: 'Ev temizligi hizmetinde kapsam, sure, ekip plani ve kontrol listesi.',
  },
  {
    keyword: 'Ofis Temizligi',
    title: 'Istanbul Ofis Temizligi: Verimliligi Artiran Kurumsal Temizlik Plani',
    category: 'Ofis Temizligi',
    tags: ['ofis temizligi', 'kurumsal temizlik', 'istanbul ofis temizligi', 'is yeri hijyeni'],
    focus: 'Ofislerde calisan sagligi ve is verimini destekleyen temizlik operasyonu.',
  },
  {
    keyword: 'Insaat Sonrasi Temizlik',
    title: 'Istanbul Insaat Sonrasi Temizlik: Teslim Oncesi Profesyonel Kontrol Rehberi',
    category: 'Insaat Sonrasi',
    tags: ['insaat sonrasi temizlik', 'tadilat sonrasi', 'kaba temizlik', 'ince temizlik'],
    focus: 'Insaat ve tadilat sonrasi ince temizlikte adim adim operasyon plani.',
  },
  {
    keyword: 'Istanbul Temizlik Sirketi',
    title: 'Istanbul Temizlik Sirketi Secerken Satis Oncesi Sorulmasi Gereken 15 Soru',
    category: 'Temizlik Sirketi Rehberi',
    tags: ['istanbul temizlik sirketi', 'fiyat teklifi', 'hizmet alimi', 'temizlik firmasi'],
    focus: 'Hizmet almadan once risk azaltan soru seti ve teklif karsilastirma yontemi.',
  },
  {
    keyword: 'Istanbul Ev Temizligi',
    title: 'Istanbul Ev Temizligi Fiyatlarini Etkileyen 10 Faktor ve Dogru Butceleme',
    category: 'Ev Temizligi',
    tags: ['istanbul ev temizligi', 'ev temizligi fiyat', 'detayli temizlik', 'randevu'],
    focus: 'Ev temizligi fiyatlarinda metrekare, kapsam ve ekip planlamasi etkisi.',
  },
  {
    keyword: 'Istanbul Ofis Temizligi',
    title: 'Istanbul Ofis Temizligi Icin Haftalik ve Aylik Program Nasil Kurulur?',
    category: 'Ofis Temizligi',
    tags: ['istanbul ofis temizligi', 'haftalik plan', 'aylik plan', 'kurumsal hijyen'],
    focus: 'Ofis temizlik periyotlari ve operasyon kalitesini yuksek tutma.',
  },
  {
    keyword: 'Istanbul Insaat Sonrasi Temizlik',
    title: 'Istanbul Insaat Sonrasi Temizlikte Ince Iscilik: Cam, Derz ve Yuzey Koruma',
    category: 'Insaat Sonrasi',
    tags: ['istanbul insaat sonrasi temizlik', 'cam temizligi', 'derz temizligi', 'yuzey koruma'],
    focus: 'Insaat sonrasi hassas yuzeylerin zarar gormeden temizlenmesi.',
  },
  {
    keyword: 'Profesyonel Temizlik Sirketi Istanbul',
    title: 'Profesyonel Temizlik Sirketi Istanbul: Standart Is Plani Nasil Okunur?',
    category: 'Temizlik Sirketi Rehberi',
    tags: ['profesyonel temizlik', 'is plani', 'hizmet standardi', 'istanbul'],
    focus: 'Profesyonel hizmette is plani, kalite kontrol ve sorumluluk sinirlari.',
  },
  {
    keyword: 'Guvenilir Temizlik Sirketi Istanbul',
    title: 'Guvenilir Temizlik Sirketi Istanbul Icin Referans ve Sozlesme Kontrolu',
    category: 'Temizlik Sirketi Rehberi',
    tags: ['guvenilir temizlik sirketi', 'referans kontrolu', 'sozlesme', 'istanbul'],
    focus: 'Guvenilirlik degerlendirmesinde referans, sigorta ve denetim basliklari.',
  },
  {
    keyword: 'Kurumsal Temizlik Sirketi Istanbul',
    title: 'Kurumsal Temizlik Sirketi Istanbul: SLA ve Performans Takibi Nasil Yapilir?',
    category: 'Ofis Temizligi',
    tags: ['kurumsal temizlik sirketi', 'sla', 'performans takibi', 'ofis'],
    focus: 'Kurumsal anlasmalarda olculebilir hizmet kalitesi icin KPI yapisi.',
  },
  {
    keyword: 'Bos Ev Temizligi Istanbul',
    title: 'Bos Ev Temizligi Istanbul: Kiralama ve Satis Oncesi Hazirlik Listesi',
    category: 'Ev Temizligi',
    tags: ['bos ev temizligi', 'kiralik ev', 'satis oncesi temizlik', 'istanbul'],
    focus: 'Bos ev temizliginde ilk izlenimi guclendiren detaylar.',
  },
  {
    keyword: 'Tasinma Sonrasi Temizlik Istanbul',
    title: 'Tasinma Sonrasi Temizlik Istanbul: Eve Yerlesmeden Once Yapilacaklar',
    category: 'Ev Temizligi',
    tags: ['tasinma sonrasi temizlik', 'yeni ev', 'derin temizlik', 'istanbul'],
    focus: 'Tasinma sonrasi hijyen guvenligi ve yerlesim oncesi kontrol adimlari.',
  },
  {
    keyword: 'Tadilat Sonrasi Temizlik Istanbul',
    title: 'Tadilat Sonrasi Temizlik Istanbul: Ince Tozdan Kalici Cozume',
    category: 'Insaat Sonrasi',
    tags: ['tadilat sonrasi temizlik', 'ince toz', 'istanbul', 'detayli temizlik'],
    focus: 'Tadilat sonrasi ince toz temizligi ve uzun sureli hijyen stratejisi.',
  },
  {
    keyword: 'Detayli Ev Temizligi Istanbul',
    title: 'Detayli Ev Temizligi Istanbul: Mutfak ve Banyo Derin Temizlik Plani',
    category: 'Ev Temizligi',
    tags: ['detayli ev temizligi', 'mutfak temizligi', 'banyo temizligi', 'istanbul'],
    focus: 'Yuksek temas alanlarinda derin hijyen ve periyodik bakim dengesini kurmak.',
  },
  {
    keyword: 'Apartman Temizligi Istanbul',
    title: 'Apartman Temizligi Istanbul: Ortak Alanlarda Hijyen Standardi Nasil Korunur?',
    category: 'Apartman Temizligi',
    tags: ['apartman temizligi', 'ortak alan', 'yonetim', 'istanbul'],
    focus: 'Apartman yonetimleri icin duzenli temizlik planlama ve kontrol modeli.',
  },
  {
    keyword: 'Dis Cephe Cam Temizligi Istanbul',
    title: 'Dis Cephe Cam Temizligi Istanbul: Guvenlik ve Ekipman Standartlari',
    category: 'Cam Temizligi',
    tags: ['dis cephe cam temizligi', 'guvenlik', 'ekipman', 'istanbul'],
    focus: 'Yuksekte calisma guvenligi ve cam temizliginde dogru ekipman secimi.',
  },
  {
    keyword: 'Cam Temizligi Istanbul',
    title: 'Cam Temizligi Istanbul: Lekesiz Sonuc Icin Mevsime Gore Uygulama',
    category: 'Cam Temizligi',
    tags: ['cam temizligi', 'lekesiz cam', 'istanbul', 'periyodik bakim'],
    focus: 'Cam temizliginde mevsimsel plan ve su izi olusumunu azaltma.',
  },
  {
    keyword: 'Ofis Cam Temizligi Istanbul',
    title: 'Ofis Cam Temizligi Istanbul: Marka Algisini Guclendiren Detaylar',
    category: 'Ofis Temizligi',
    tags: ['ofis cam temizligi', 'kurumsal gorunum', 'istanbul', 'ofis bakimi'],
    focus: 'Ofis vitrin ve cam alanlarinin marka algisina etkisi.',
  },
  {
    keyword: 'Koltuk Yikama Istanbul',
    title: 'Koltuk Yikama Istanbul: Kumas Turune Gore Dogru Yikama Yontemi',
    category: 'Koltuk Yikama',
    tags: ['koltuk yikama', 'kumas bakimi', 'istanbul', 'yerinde yikama'],
    focus: 'Koltuk kumasina uygun yikama teknigi ve kuruma sureci yonetimi.',
  },
  {
    keyword: 'Yatak Yikama Istanbul',
    title: 'Yatak Yikama Istanbul: Alerjen Azaltan Hijyen Programi',
    category: 'Yatak Temizligi',
    tags: ['yatak yikama', 'alerjen', 'hijyen', 'istanbul'],
    focus: 'Yatak temizliginde saglik odakli uygulama ve periyot belirleme.',
  },
  {
    keyword: 'Hali Yikama Istanbul',
    title: 'Hali Yikama Istanbul: Renk Koruma ve Derin Temizlik Dengesini Kurmak',
    category: 'Hali Temizligi',
    tags: ['hali yikama', 'renk koruma', 'istanbul', 'hali bakimi'],
    focus: 'Hali temizliginde leke cozumu ve doku koruma prensipleri.',
  },
  {
    keyword: 'Gunluk Temizlikci Istanbul',
    title: 'Gunluk Temizlikci Istanbul: Kisa Sureli Hizmette Maksimum Verim',
    category: 'Ev Temizligi',
    tags: ['gunluk temizlikci', 'istanbul', 'hizli temizlik', 'ev bakimi'],
    focus: 'Kisa sureli hizmette dogru gorev siralama ve onceliklendirme.',
  },
  {
    keyword: 'Temizlik Sirketi Fiyatlari Istanbul',
    title: 'Temizlik Sirketi Fiyatlari Istanbul: Paket, Sure ve Kapsam Karsilastirmasi',
    category: 'Temizlik Sirketi Rehberi',
    tags: ['temizlik fiyatlari', 'istanbul', 'paket karsilastirma', 'teklif'],
    focus: 'Fiyat tekliflerinde netlik saglamak icin kapsam odakli karsilastirma.',
  },
  {
    keyword: 'Acil Temizlik Hizmeti Istanbul',
    title: 'Acil Temizlik Hizmeti Istanbul: Ayni Gun Randevu Icin Pratik Yol Haritasi',
    category: 'Acil Temizlik',
    tags: ['acil temizlik', 'istanbul', 'ayni gun randevu', 'hizli ekip'],
    focus: 'Acil talep yonetiminde hizli planlama ve operasyon hazirligi.',
  },
  {
    keyword: 'Yerinde Koltuk Yikama Istanbul',
    title: 'Yerinde Koltuk Yikama Istanbul: Evde Hizmette Surec Nasil Isler?',
    category: 'Koltuk Yikama',
    tags: ['yerinde koltuk yikama', 'istanbul', 'evde hizmet', 'kumas temizligi'],
    focus: 'Yerinde koltuk yikama operasyonunda ekip, ekipman ve kuruma sureci.',
  },
  {
    keyword: 'Haftalik Ofis Temizligi Istanbul',
    title: 'Haftalik Ofis Temizligi Istanbul: Is Akisini Bozmadan Temizlik Plani',
    category: 'Ofis Temizligi',
    tags: ['haftalik ofis temizligi', 'istanbul', 'is akisi', 'kurumsal temizlik'],
    focus: 'Ofis isleyisini bozmayan optimize temizlik vardiya planlamasi.',
  },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildExcerpt(topic: Topic): string {
  return `${topic.keyword} aramasinda one cikmak isteyenler icin Istanbul odakli kapsam, fiyat, planlama ve uygulama adimlarini anlatiyoruz. Bu rehber, hizmet almadan once dogru karar vermenize yardimci olur.`;
}

function buildMetaTitle(topic: Topic): string {
  const base = `${topic.keyword} Istanbul Rehberi | Gunen Temizlik`;
  return base.slice(0, 190);
}

function buildMetaDesc(topic: Topic): string {
  const base = `${topic.keyword} icin Istanbul genelinde en dogru hizmet secimi, fiyat etkileyen faktorler, ilce bazli planlama ve profesyonel temizlik kontrol listesi.`;
  return base.slice(0, 290);
}

function buildContent(topic: Topic): string {
  return `
<h2>${topic.keyword} neden kritik?</h2>
<p>${topic.focus}</p>
<p>Istanbul gibi yogun bir sehirde ${topic.keyword.toLowerCase()} talebi hizla artar. Bu nedenle hizmetin kapsami, ekip plani ve teslim standartlari en basta netlestirilmelidir.</p>

<h2>Fiyati ve kaliteyi etkileyen ana faktorler</h2>
<ul>
  <li>Alan buyuklugu ve temizlik kapsaminin detay seviyesi</li>
  <li>Tek seferlik mi periyodik mi hizmet alinacagi</li>
  <li>Kullanilan ekipman, urun kalitesi ve uzman ekip deneyimi</li>
  <li>Randevu zamani, erisim kosullari ve operasyon suresi</li>
</ul>

<h2>Istanbul ilce bazli operasyon plani</h2>
<p>Kadikoy, Uskudar, Besiktas, Sisli, Atasehir, Maltepe, Kartal ve Pendik gibi merkezlerde trafik ve bina erisim saatleri onceden planlanirsa hem sure hem maliyet avantaji elde edilir.</p>

<h2>Hizmet almadan once kontrol listesi</h2>
<ol>
  <li>Teklifte hangi alanlarin dahil oldugunu yazili olarak teyit edin.</li>
  <li>Ek ucret cikarabilecek kalemleri (cam, dolap ici, ekstra leke vb.) once sorun.</li>
  <li>Hizmet sonrasi kontrol adimlarini ve memnuniyet surecini ogrenin.</li>
  <li>Tekrarlayan ihtiyaclarda haftalik/aylik sabit plan secenegini degerlendirin.</li>
</ol>

<h2>Sik yapilan hatalar</h2>
<p>Sadece en dusuk fiyata odaklanmak, kapsam detayini teyit etmeden randevu olusturmak ve ilceye gore sure planini dikkate almamak sonradan memnuniyet sorunlari dogurabilir.</p>

<h2>Sonuc</h2>
<p>${topic.keyword} surecinde dogru planlama, net kapsam ve profesyonel ekip secimi; hem hijyen kalitesini hem de uzun vadeli maliyet verimini artirir. Ucretsiz kesif ve net teklif icin <a href="/randevu">randevu olusturabilir</a> veya <a href="/iletisim">iletisim sayfasindan</a> bize ulasabilirsiniz.</p>
  `.trim();
}

function fallbackTopic(index: number): Topic {
  const district = DISTRICTS[index % DISTRICTS.length];
  const keyword = `${district} Temizlik Sirketi`;
  return {
    keyword,
    title: `${district} Temizlik Sirketi: Mahalle Bazli Hizmet Planlama Rehberi`,
    category: 'Lokal SEO',
    tags: ['lokal seo', district.toLowerCase(), 'temizlik sirketi', 'istanbul'],
    focus: `${district} bolgesinde hizmet alirken bina tipi, trafik ve operasyon saatleri temel planlama basliklaridir.`,
  };
}

async function run() {
  const prisma = new PrismaClient();
  try {
    const existingCount = await prisma.blogPost.count();
    const needed = Math.max(0, TARGET_COUNT - existingCount);

    console.log(`Current blog count: ${existingCount}`);
    console.log(`Target blog count: ${TARGET_COUNT}`);
    console.log(`Posts to create: ${needed}`);

    if (needed === 0) {
      console.log('Target already reached. Nothing to create.');
      return;
    }

    const existing = await prisma.blogPost.findMany({
      select: { slug: true, title: true },
    });
    const slugSet = new Set(existing.map((p) => p.slug));
    const titleSet = new Set(existing.map((p) => p.title.toLowerCase()));

    const queue: Topic[] = [...TOPICS];
    let fallbackIndex = 0;
    let created = 0;

    while (created < needed) {
      const topic =
        queue.length > 0
          ? (queue.shift() as Topic)
          : fallbackTopic(fallbackIndex++);

      if (titleSet.has(topic.title.toLowerCase())) continue;

      let baseSlug = slugify(topic.title);
      if (!baseSlug) baseSlug = slugify(topic.keyword);
      let slug = baseSlug;
      let seq = 2;
      while (slugSet.has(slug)) {
        slug = `${baseSlug}-${seq++}`;
      }

      const excerpt = buildExcerpt(topic).slice(0, 490);
      const metaTitle = buildMetaTitle(topic);
      const metaDesc = buildMetaDesc(topic);
      const content = buildContent(topic);

      const dayOffset = created % 30;
      const createdAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);

      await prisma.blogPost.create({
        data: {
          title: topic.title,
          slug,
          excerpt,
          content,
          image: DEFAULT_IMAGE,
          category: topic.category,
          tags: [...new Set([topic.keyword.toLowerCase(), ...topic.tags])].slice(0, 12),
          author: AUTHOR,
          published: true,
          views: 0,
          metaTitle,
          metaDesc,
          createdAt,
          updatedAt: createdAt,
        },
      });

      slugSet.add(slug);
      titleSet.add(topic.title.toLowerCase());
      created += 1;
      console.log(`Created (${created}/${needed}): ${topic.title}`);
    }

    const finalCount = await prisma.blogPost.count();
    console.log(`Done. Final blog count: ${finalCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error('expand-blog-to-80 failed:', err);
  process.exitCode = 1;
});
