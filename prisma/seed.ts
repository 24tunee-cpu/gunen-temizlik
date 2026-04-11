import { PrismaClient } from '@prisma/client';
import { upsertCanonicalServices } from '../src/lib/seed-services';

const prisma = new PrismaClient();

const defaultFAQs = [
  {
    question: 'Hizmetleriniz nelerdir?',
    answer: 'İnşaat sonrası temizlik, ofis temizliği, koltuk yıkama, halı temizliği, cam temizliği ve daha fazlasını sunuyoruz.',
    category: 'Genel',
    isActive: true,
    order: 1,
  },
  {
    question: 'Fiyatlarınız nedir?',
    answer: 'Fiyatlar hizmet tipine ve metrekareye göre değişiklik gösterir. Detaylı bilgi için iletişime geçin.',
    category: 'Fiyat',
    isActive: true,
    order: 2,
  },
  {
    question: 'Hangi bölgelerde hizmet veriyorsunuz?',
    answer: 'İstanbul\'un tüm ilçelerinde hizmet vermekteyiz.',
    category: 'Genel',
    isActive: true,
    order: 3,
  },
  {
    question: 'Randevu almak için ne yapmalıyım?',
    answer: 'Web sitemizden, telefonla veya WhatsApp üzerinden randevu alabilirsiniz.',
    category: 'Randevu',
    isActive: true,
    order: 4,
  },
  {
    question: 'Temizlik ne kadar sürer?',
    answer: 'Hizmet tipine göre 2-8 saat arasında değişmektedir.',
    category: 'Hizmet',
    isActive: true,
    order: 5,
  },
];

const defaultGallery = [
  {
    title: 'İnşaat Sonrası Temizlik',
    description: 'Profesyonel inşaat sonrası temizlik hizmeti',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    category: 'İnşaat',
    isActive: true,
    order: 1,
  },
  {
    title: 'Ofis Temizliği',
    description: 'Düzenli ofis temizliği hizmetleri',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    category: 'Ofis',
    isActive: true,
    order: 2,
  },
  {
    title: 'Koltuk Yıkama',
    description: 'Derinlemesine koltuk ve sandalye yıkama',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    category: 'Yıkama',
    isActive: true,
    order: 3,
  },
  {
    title: 'Halı Temizliği',
    description: 'Profesyonel halı temizliği',
    image: 'https://images.unsplash.com/photo-1558317374-a354d5f6d40b?w=800',
    category: 'Yıkama',
    isActive: true,
    order: 4,
  },
  {
    title: 'Cam Temizliği',
    description: 'Dış cephe ve iç mekan cam temizliği',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    category: 'Cam',
    isActive: true,
    order: 5,
  },
  {
    title: 'Depo Temizliği',
    description: 'Endüstriyel depo temizliği',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
    category: 'Endüstriyel',
    isActive: true,
    order: 6,
  },
];

const defaultBlogPosts = [
  {
    title: 'Ev Temizliğinde 5 Altın Kural',
    slug: 'ev-temizliginde-5-altin-kural',
    content: `Ev temizliği düzenli yapıldığında hem sağlıklı bir yaşam alanı sağlar hem de evin ömrünü uzatır. İşte ev temizliğinde dikkat etmeniz gereken 5 altın kural:

## 1. Düzenli Temizlik Planı Oluşturun

Haftalık bir temizlik planı oluşturmak, işleri kolaylaştırır. Her gün farklı bir odayı temizleyerek bütün evi bir günde temizlemek zorunda kalmazsınız.

## 2. Doğru Temizlik Malzemelerini Kullanın

Her yüzey için uygun temizlik malzemesi kullanın. Ahşap, cam, metal ve kumaşlar için farklı ürünler gereklidir.

## 3. Üsten Aşağıya Doğru Temizleyin

Toz alma işlemini tavan ve yüksek yüzeylerden başlayarak aşağıya doğru ilerleyin. Böylelikle düşen tozlar tekrar temizlemeniz gerekmez.

## 4. Dezenfeksiyonu Unutmayın

Yüksek temas alanlar (kapı kolları, anahtarlar, tuvaletler) düzenli olarak dezenfekte edilmelidir.

## 5. Profesyonel Yardım Alın

Zorlu lekeler ve derinlemesine temizlik için profesyonel temizlik şirketlerinden destek alın.

Bu kuralları uygulayarak evinizi her zaman temiz ve sağlıklı tutabilirsiniz.`,
    excerpt: 'Ev temizliğinde dikkat etmeniz gereken 5 önemli kural ile evinizi her zaman temiz ve hijyenik tutabilirsiniz.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    category: 'Temizlik İpuçları',
    tags: ['ev temizliği', 'temizlik ipuçları', 'hijyen'],
    author: 'Günen Temizlik',
    published: true,
  },
  {
    title: 'Ofis Temizliği İş Verimliliğini Nasıl Artırır?',
    slug: 'ofis-temizligi-is-verimliligini-nasil-artirir',
    content: `Temiz bir ofis sadece güzel görünmekle kalmaz, aynı zamanda iş verimliliğini de artırır. İşte ofis temizliğinin iş ortamına etkileri:

## Sağlıklı İş Ortamı

Düzenli temizlik ve dezenfeksiyon, hastalıkların yayılmasını önler. Çalışanlar daha az hastalanır ve iş gücü kaybı azalır.

## Konsantrasyonu Artırır

Temiz ve düzenli bir ortamda konsantrasyon daha yüksek olur. Dağınıklık ve kirlilik dikkati dağıtabilir.

## Profesyonel İmaj

Müşteriler ve ziyaretçiler için temiz bir ofis, şirketin profesyonelliğini yansıtır. İlk izlenim önemlidir.

## Morali Yükseltir

Temiz bir iş ortamı, çalışanların moralini yükseltir ve iş memnuniyetini artırır.

Düzenli ofis temizliği için profesyonel temizlik hizmetleri almak, uzun vadede şirketinize çok şey kazandırır.`,
    excerpt: 'Temiz bir ofis, iş verimliliğini artıran en önemli faktörlerden biridir. İşte ofis temizliğinin faydaları.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    category: 'Kurumsal Temizlik',
    tags: ['ofis temizliği', 'kurumsal temizlik', 'iş verimliliği'],
    author: 'Günen Temizlik',
    published: true,
  },
  {
    title: 'Koltuk Yıkama: Ne Sıklıkla Yapılmalı?',
    slug: 'koltuk-yikama-ne-siklikla-yapilmali',
    content: `Koltuklarınızın temizliği hem sağlığınız hem de mobilyanızın ömrü için önemlidir. Peki koltuk yıkama ne sıklıkla yapılmalıdır?

## Genel Kullanım İçin

Normal kullanım için koltuklar yılda 1-2 kez profesyonel olarak yıkanmalıdır.

## Evde Evcil Hayvan Varsa

Evcil hayvanınız varsa, koltuklarınız 6 ayda bir yıkatmanız önerilir. Tüyler ve alerjenler birikebilir.

## Çocuklu Aileler İçin

Küçük çocuk varsa, yemek artıkları ve lekeler daha sık olabilir. 6 ayda bir temizlik yeterlidir.

## Profesyonel vs. Kendiniz Yapma

Evde yapabileceğiniz yüzey temizliği ile profesyonel derinlemesine temizlik farklıdır. Derin lekeler ve hijyen için profesyonel yardım önerilir.

Koltuk yıkama için Günen Temizlik'in profesyonel hizmetinden yararlanabilirsiniz.`,
    excerpt: 'Koltuklarınız ne sıklıkla yıkatmanız gerektiğini öğrenin. Evcil hayvan ve çocuk varsa daha sık temizlik gerekebilir.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    category: 'Mobilya Temizliği',
    tags: ['koltuk yıkama', 'mobilya temizliği', 'ev temizliği'],
    author: 'Günen Temizlik',
    published: true,
  },
  {
    title: 'İnşaat Sonrası Temizlik Neden Önemli?',
    slug: 'insaat-sonrasi-temizlik-neden-onemli',
    content: `İnşaat sonrası temizlik, yeni yapılan veya tadilat geçmiş mekanlar için çok önemlidir. İşte nedenleri:

## Sağlık Riskleri

İnşaat tozu, boya partikülleri ve kimyasal kalıntılar sağlık için risk oluşturur. Solunum problemleri ve alerjilere neden olabilir.

## Estetik Görünüm

İnşaat kalıntıları mekanın görünümünü bozar. Temiz bir mekan daha ferah ve yaşanabilir hissi verir.

## Ekipman Ömrü

İnşaat tozları elektronik cihazlara, havalandırma sistemlerine ve diğer ekipmanlara zarar verebilir.

## Profesyonel İnşaat Sonrası Temizlik

Profesyonel ekipler, özel ekipman ve deneyimle inşaat sonrası temizlik hızlı ve etkili şekilde yapar. Günen Temizlik olarak bu konuda profesyonel hizmet sunuyoruz.`,
    excerpt: 'İnşaat sonrası temizlik, sağlık ve estetik açısından çok önemlidir. Profesyonel temizlik ile mekanınızı yaşanabilir hale getirin.',
    image: 'https://images.unsplash.com/photo-1504307652540-d527ac683a69?w=800',
    category: 'İnşaat Temizliği',
    tags: ['inşaat sonrası temizlik', 'tadilat temizliği', 'profesyonel temizlik'],
    author: 'Günen Temizlik',
    published: true,
  },
];

const defaultTestimonials = [
  {
    name: 'Ahmet Yılmaz',
    location: 'Kadıköy, İstanbul',
    rating: 5,
    content:
      'İstanbul’da inşaat sonrası temizlik arayanlara Günen Temizlik’i gönül rahatlığıyla öneririm. Toz, çimento ve boya lekeleri profesyonel ekipmanlarla alındı; daire teslime hazır hale geldi. Zamanında geldiler, fiyat şeffaftı.',
    service: 'İnşaat Sonrası Temizlik',
    isActive: true,
    order: 1,
  },
  {
    name: 'Elif Demir',
    location: 'Şişli, İstanbul',
    rating: 5,
    content:
      'Ofis temizliği için anlaştık; haftalık düzenli hizmet alıyoruz. Ortak alanlar, mutfak ve WC hijyeni beklentimizin üzerinde. İstanbul’da kurumsal temizlik firması arayan işletmelere uygun bir ekip.',
    service: 'Ofis Temizliği',
    isActive: true,
    order: 2,
  },
  {
    name: 'Mehmet Kaya',
    location: 'Ataşehir, İstanbul',
    rating: 5,
    content:
      'Koltuk yıkama hizmeti sipariş ettik; kumaştaki lekeler ve koku ciddi şekilde azaldı. Yerinde yıkama süreci düzenli ve hızlıydı. Ev ve ofis koltuk temizliği için tekrar tercih edeceğiz.',
    service: 'Koltuk Yıkama',
    isActive: true,
    order: 3,
  },
  {
    name: 'Zeynep Arslan',
    location: 'Beşiktaş, İstanbul',
    rating: 5,
    content:
      'Dış cephe ve iç cam temizliği yaptırdık. Güvenlik ekipmanları ve iş disiplini iyiydi. Manzara ve ışık farkı hissedilir; özellikle kış öncesi cam temizliği için ideal bir İstanbul temizlik ekibi.',
    service: 'Cam Temizliği',
    isActive: true,
    order: 4,
  },
  {
    name: 'Can Özdemir',
    location: 'Üsküdar, İstanbul',
    rating: 5,
    content:
      'Periyodik ev temizliği kullanıyoruz. Detaylara önem veriyorlar; mutfak, banyo ve zeminler hijyenik şekilde temizlendi. Güvenilir ev temizlik şirketi arayanlar için uygun fiyat-performans.',
    service: 'Ev Temizliği',
    isActive: true,
    order: 5,
  },
  {
    name: 'Burcu Şahin',
    location: 'Maltepe, İstanbul',
    rating: 5,
    content:
      'Halı yıkama için Günen Temizlik’e ulaştık. Yün ve sentetik halılarda renk solması olmadan derinlemesine temizlik yapıldı. İstanbul Anadolu yakası halı temizliği ihtiyacımızda yine arayacağız.',
    service: 'Halı Temizliği',
    isActive: true,
    order: 6,
  },
  {
    name: 'Oğuz Çelik',
    location: 'Bakırköy, İstanbul',
    rating: 5,
    content:
      'Tadilat sonrası daire temizliği sipariş ettik. Fayans derzleri, dolap içleri ve ince toz temizliği gerçekten titiz yapıldı. Tadilat / renovasyon sonrası detaylı temizlik arayanlar için tavsiye ederim.',
    service: 'İnşaat Sonrası Temizlik',
    isActive: true,
    order: 7,
  },
  {
    name: 'Selin Aydın',
    location: 'Sarıyer, İstanbul',
    rating: 5,
    content:
      'Villamızın genel temizliği ve dezenfeksiyon odaklı hijyen uygulaması istedik. Özellikle mutfak ve banyo yüzeylerinde güven verici bir sonuç aldık. Büyük metrekârlı ev temizliği için planlı çalıştılar.',
    service: 'Ev Temizliği',
    isActive: true,
    order: 8,
  },
  {
    name: 'Emre Yıldız',
    location: 'Kağıthane, İstanbul',
    rating: 5,
    content:
      'Kısa süreli ofis taşıması sonrası eski ofisimizin detaylı temizliğini yaptırdık. Kablo kanalları, klima ızgaraları gibi gözden kaçan yerler de temizlendi. Ticari temizlik ve teslim öncesi temizlik için doğru adres.',
    service: 'Ofis Temizliği',
    isActive: true,
    order: 9,
  },
  {
    name: 'Deniz Koç',
    location: 'Pendik, İstanbul',
    rating: 4,
    content:
      'Mağaza vitrin camı ve iç mekân zemin temizliği için anlaştık. Yoğun saatler dışında esnek saat verebilmeleri işimizi kolaylaştırdı. Perakende ve AVM çevresi için profesyonel temizlik hizmeti sunuyorlar.',
    service: 'Cam Temizliği',
    isActive: true,
    order: 10,
  },
  {
    name: 'Ayşe Karaca',
    location: 'Ümraniye, İstanbul',
    rating: 5,
    content:
      'Çocuklu aile olarak düzenli ev temizliği arıyorduk. Kullandıkları ürünler konusunda bilgi verdiler; alerji hassasiyetimizi dikkate aldılar. İstanbul’da güvenilir periyodik temizlik için memnun kaldık.',
    service: 'Ev Temizliği',
    isActive: true,
    order: 11,
  },
  {
    name: 'Kerem Polat',
    location: 'Beylikdüzü, İstanbul',
    rating: 5,
    content:
      'Yeni teslim dairemizde ince işçilik tozu ve etiket kalıntıları vardı. Tüm oda ve balkon detaylı temizlendi; teslim öncesi kontrol listesiyle işi bitirdiler. Yeni ev / anahtar teslim sonrası temizlik için şiddetle öneririm.',
    service: 'İnşaat Sonrası Temizlik',
    isActive: true,
    order: 12,
  },
];

const defaultPricing = [
  {
    serviceName: 'İnşaat Sonrası Temizlik',
    basePrice: 500,
    pricePerSqm: 15,
    unit: 'm²',
    minPrice: 500,
    description: 'Profesyonel inşaat sonrası detaylı temizlik hizmeti',
    features: ['Toz Alma', 'Cilalama', 'Dezenfeksiyon', 'Cam Temizliği'],
    isActive: true,
    order: 1,
  },
  {
    serviceName: 'Ofis Temizliği',
    basePrice: 300,
    pricePerSqm: 8,
    unit: 'm²',
    minPrice: 300,
    description: 'Düzenli ofis temizliği ve bakım hizmetleri',
    features: ['Günlük Temizlik', 'Haftalık Temizlik', 'Aylık Bakım', 'Dezenfeksiyon'],
    isActive: true,
    order: 2,
  },
  {
    serviceName: 'Koltuk Yıkama',
    basePrice: 150,
    pricePerSqm: 0,
    unit: 'adet',
    minPrice: 150,
    description: 'Derinlemesine koltuk ve sandalye yıkama hizmeti',
    features: ['Leke Çıkarma', 'Koku Giderme', 'Kurutma', 'Dezenfeksiyon'],
    isActive: true,
    order: 3,
  },
  {
    serviceName: 'Halı Temizliği',
    basePrice: 100,
    pricePerSqm: 25,
    unit: 'm²',
    minPrice: 100,
    description: 'Profesyonel halı yıkama ve temizlik hizmeti',
    features: ['Derinlemesine Yıkama', 'Leke Çıkarma', 'Kurutma', 'Koku Giderme'],
    isActive: true,
    order: 4,
  },
  {
    serviceName: 'Cam Temizliği',
    basePrice: 200,
    pricePerSqm: 5,
    unit: 'm²',
    minPrice: 200,
    description: 'Dış cephe ve iç mekan cam temizliği',
    features: ['İç Mekan Cam', 'Dış Cephe Cam', 'Çerçeve Temizliği', 'Parlatma'],
    isActive: true,
    order: 5,
  },
];

async function seed() {
  console.log('Veritabanına veri ekleniyor...');

  try {
    // Hizmetler — her çalıştırmada slug ile upsert (SEO metinleri güncellenir)
    const n = await upsertCanonicalServices(prisma);
    console.log(`${n} hizmet upsert edildi (kanonik SEO metinleri)`);

    // BlogPosts ekle
    const existingBlogPosts = await prisma.blogPost.count();
    if (existingBlogPosts === 0) {
      await prisma.blogPost.createMany({ data: defaultBlogPosts });
      console.log(`${defaultBlogPosts.length} Blog yazısı eklendi`);
    } else {
      console.log(`Zaten ${existingBlogPosts} blog yazısı var, atlanıyor`);
    }

    // Testimonials ekle
    const existingTestimonials = await prisma.testimonial.count();
    if (existingTestimonials === 0) {
      await prisma.testimonial.createMany({ data: defaultTestimonials });
      console.log(`${defaultTestimonials.length} Müşteri yorumu eklendi`);
    } else {
      console.log(`Zaten ${existingTestimonials} müşteri yorumu var, atlanıyor`);
    }

    // FAQ ekle
    const existingFAQs = await prisma.faq.count();
    if (existingFAQs === 0) {
      await prisma.faq.createMany({ data: defaultFAQs });
      console.log(`${defaultFAQs.length} FAQ eklendi`);
    } else {
      console.log(`Zaten ${existingFAQs} FAQ var, atlanıyor`);
    }

    // Gallery ekle
    const existingGallery = await prisma.gallery.count();
    if (existingGallery === 0) {
      await prisma.gallery.createMany({ data: defaultGallery });
      console.log(`${defaultGallery.length} Galeri öğesi eklendi`);
    } else {
      console.log(`Zaten ${existingGallery} galeri öğesi var, atlanıyor`);
    }

    // Pricing ekle
    const existingPricing = await prisma.pricing.count();
    if (existingPricing === 0) {
      await prisma.pricing.createMany({ data: defaultPricing });
      console.log(`${defaultPricing.length} Fiyat bilgisi eklendi`);
    } else {
      console.log(`Zaten ${existingPricing} fiyat bilgisi var, atlanıyor`);
    }

    console.log('Seed işlemi tamamlandı!');
  } catch (error) {
    console.error('Seed hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
