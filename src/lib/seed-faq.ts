/**
 * Kanonik SSS — SEO odaklı sorular; seedKey ile upsert.
 * layout.tsx ve SSS sayfalarındaki JSON-LD ile aynı içeriği paylaşır.
 */
import type { PrismaClient } from '@prisma/client';

export type FaqSeedRow = {
  seedKey: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
};

export const FAQ_SEED_DATA: FaqSeedRow[] = [
  {
    seedKey: 'gunen-faq-01',
    question: 'İstanbul’da profesyonel temizlik şirketi seçerken nelere dikkat etmeliyim?',
    answer:
      'Deneyim, referans, ekipman kalitesi, ürün güvenliği ve şeffaf fiyatlandırmayı sorgulayın. Günen Temizlik olarak İstanbul genelinde eğitimli ekip, net hizmet kapsamı ve önceden bilgilendirme ile profesyonel temizlikte güvenilir bir adres olmayı hedefliyoruz.',
    category: 'Genel',
    order: 1,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-02',
    question: 'Günen Temizlik hangi hizmetleri sunuyor?',
    answer:
      'İnşaat sonrası temizlik, kurumsal ofis temizliği, periyodik ev temizliği, cam temizliği, koltuk ve halı yıkama, depo ve ortak alan bakımı gibi talebe göre paketlenen çözümler sunuyoruz. İhtiyacınıza göre tek seferlik veya düzenli planla İstanbul’daki iş ve konut adreslerinizde hizmet veriyoruz.',
    category: 'Genel',
    order: 2,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-03',
    question: 'İstanbul temizlik fiyatları nasıl belirleniyor?',
    answer:
      'Metrekare, kirlilik düzeyi, hizmet türü (ör. inşaat sonrası veya günlük ofis), süre ve ekip sayısı fiyatı etkiler. Telefon, WhatsApp veya iletişim formu üzerinden kısa bilgi alıp ücretsiz keşif veya net teklif sunuyoruz; böylece “İstanbul temizlik fiyatları” için önceden belirsizlik kalmaz.',
    category: 'Fiyat',
    order: 3,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-04',
    question: 'Ofis temizliği ile ev temizliği arasındaki fark nedir?',
    answer:
      'Ofis temizliğinde çalışma saatleri, güvenlik prosedürleri ve yüksek trafikli ortak alanlar öne çıkar; ev temizliğinde ise mutfak, banyo ve kişisel eşyalara duyarlılık önemlidir. Her iki hizmette de yüzey tipine uygun ürün ve ekipman kullanıyor, İstanbul’daki iş yerleri ve konutlar için ayrı kontrol listeleri uyguluyoruz.',
    category: 'Hizmet',
    order: 4,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-05',
    question: 'İnşaat sonrası temizlik ne kadar sürer ve neleri kapsar?',
    answer:
      'Süre alanın büyüklüğüne ve inşaat artığına göre değişir; tipik bir daire genelde bir iş günü içinde teslim edilebilir. İnce toz, çimento izleri, cam ve fayans yüzeyler, dolap içleri ve gerektiğinde detaylı süpürme–silme–havalandırma adımlarını kapsayan profesyonel inşaat sonrası temizlik paketleri sunuyoruz.',
    category: 'Hizmet',
    order: 5,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-06',
    question: 'Hangi İstanbul bölgelerinde hizmet veriyorsunuz?',
    answer:
      'Avrupa ve Anadolu yakasındaki tüm ilçelerde planlı hizmet veriyoruz: Kadıköy, Üsküdar, Ataşehir, Beşiktaş, Şişli, Bakırköy, Bahçelievler, Pendik ve çevre ilçeler dahil. Yoğun trafik ve park koşullarına göre randevu saatini birlikte netleştiriyoruz.',
    category: 'Bölge',
    order: 6,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-07',
    question: 'Randevu ve ücretsiz keşif için nasıl iletişime geçebilirim?',
    answer:
      'Web sitemizdeki iletişim formu, sitede yer alan telefon ve WhatsApp hattı üzerinden bize yazabilir veya arayabilirsiniz. Adres, metrekare ve hizmet türünü paylaştığınızda size uygun gün–saat ve teklif çerçevesini hızlıca iletiyoruz.',
    category: 'Randevu',
    order: 7,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-08',
    question: 'Kullandığınız temizlik ürünleri çocuk ve evcil hayvan için güvenli mi?',
    answer:
      'Mümkün olduğunca etiketli, onaylı ve sağlık açısından güvenli ürünler kullanıyoruz; hassas alerji veya özel talebinizi randevu öncesinde bildirmeniz yeterli. Gerekirse sizin tercih ettiğiniz ürünlerle veya daha hafif formülasyonlarla çalışma seçeneği sunuyoruz.',
    category: 'Hijyen',
    order: 8,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-09',
    question: 'Koltuk yıkama ve halı temizliği yerinde mi yapılıyor?',
    answer:
      'Evet; koltuk, kanepe ve yerinde halı yıkama hizmetlerinde ekipmanı adresinize getiriyoruz. Kumaş tipine uygun yöntem ve kuruma süresi önceden bilgilendirilir; İstanbul içi randevu planına göre iş yeri veya evde uygulama yapılır.',
    category: 'Hizmet',
    order: 9,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-10',
    question: 'Temizlik süresi ve ekip sayısı nasıl planlanıyor?',
    answer:
      'Ön değerlendirmede metrekare, oda sayısı ve kirlilik seviyesine göre süre tahmini veriyoruz. Büyük ofis veya inşaat sonrası işlerde ekip sayısını artırarak aynı gün içinde teslim hedefliyoruz; değişiklik olursa sizi önceden bilgilendiriyoruz.',
    category: 'Hizmet',
    order: 10,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-11',
    question: 'Akşam, hafta sonu veya mesai dışı temizlik mümkün mü?',
    answer:
      'Evet; ofisler için mesai dışı ve hafta sonu, konutlar için de size uygun saat dilimlerinde randevu açıyoruz. İstanbul’da trafik ve site yönetimi kurallarına uygun şekilde giriş–çıkış saatlerini önceden netleştirmenizi rica ediyoruz.',
    category: 'Randevu',
    order: 11,
    isActive: true,
  },
  {
    seedKey: 'gunen-faq-12',
    question: 'Hizmetten memnun kalmazsam ne yapmalıyım?',
    answer:
      'Öncelikle aynı gün içinde bize iletin; eksik kalan noktaları kayıt altına alıp makul sürede telafi veya düzeltme için dönüş yapıyoruz. Şeffaf iletişim ve tekrar kontrol listesi ile kaliteyi korumayı hedefliyoruz.',
    category: 'Genel',
    order: 12,
    isActive: true,
  },
];

/** Schema.org FAQPage `mainEntity` — layout ve SSS sayfaları ile senkron */
export function faqSeedToSchemaMainEntity(): Array<{
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
}> {
  return [...FAQ_SEED_DATA]
    .filter((f) => f.isActive)
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      '@type': 'Question' as const,
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: f.answer,
      },
    }));
}

/** Tam FAQPage JSON-LD nesnesi (Script / dangerouslySetInnerHTML için) */
export function faqPageJsonLdObject(): {
  '@context': string;
  '@type': string;
  mainEntity: ReturnType<typeof faqSeedToSchemaMainEntity>;
} {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqSeedToSchemaMainEntity(),
  };
}

const LEGACY_QUESTIONS = [
  'Hizmetleriniz nelerdir?',
  'Fiyatlarınız nedir?',
  'Hangi bölgelerde hizmet veriyorsunuz?',
  'Randevu almak için ne yapmalıyım?',
  'Temizlik ne kadar sürer?',
  'Temizlik hizmetleri hangi saatlerde verilmektedir?',
  'Hangi temizlik malzemelerini kullaniyorsunuz?',
  'Fiyatlar nasil belirleniyor?',
];

export async function upsertCanonicalFaqs(prisma: PrismaClient): Promise<number> {
  for (const row of FAQ_SEED_DATA) {
    const { seedKey, ...fields } = row;
    const existing = await prisma.faq.findFirst({ where: { seedKey } });
    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: {
          question: fields.question,
          answer: fields.answer,
          category: fields.category,
          order: fields.order,
          isActive: fields.isActive,
        },
      });
    } else {
      await prisma.faq.create({
        data: { seedKey, ...fields },
      });
    }
  }

  await prisma.faq.deleteMany({
    where: {
      seedKey: null,
      question: { in: LEGACY_QUESTIONS },
    },
  });

  return FAQ_SEED_DATA.length;
}
