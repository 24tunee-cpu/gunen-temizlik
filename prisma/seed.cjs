const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Logger utility
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg, error) => console.error(`❌ ${msg}`, error || '')
};

// Default data
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
    features: ['Leke Çıkarma', 'Koku Giderim', 'Kurutma', 'Dezenfeksiyon'],
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
    features: ['Derinlemesine Yıkama', 'Leke Çıkarma', 'Kurutma', 'Koku Giderim'],
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
  logger.info('🌱 Veritabanına veri ekleniyor...');
  const startTime = Date.now();
  const results = { created: 0, skipped: 0, errors: [] };

  try {
    // FAQ ekle
    const existingFAQs = await prisma.faq.count();
    if (existingFAQs === 0) {
      await prisma.faq.createMany({ data: defaultFAQs });
      logger.success(`${defaultFAQs.length} FAQ eklendi`);
      results.created++;
    } else {
      logger.warning(`Zaten ${existingFAQs} FAQ var, atlanıyor`);
      results.skipped++;
    }

    // Gallery ekle
    const existingGallery = await prisma.gallery.count();
    if (existingGallery === 0) {
      await prisma.gallery.createMany({ data: defaultGallery });
      logger.success(`${defaultGallery.length} Galeri öğesi eklendi`);
      results.created++;
    } else {
      logger.warning(`Zaten ${existingGallery} galeri öğesi var, atlanıyor`);
      results.skipped++;
    }

    // Pricing ekle
    const existingPricing = await prisma.pricing.count();
    if (existingPricing === 0) {
      await prisma.pricing.createMany({ data: defaultPricing });
      logger.success(`${defaultPricing.length} Fiyat bilgisi eklendi`);
      results.created++;
    } else {
      logger.warning(`Zaten ${existingPricing} fiyat bilgisi var, atlanıyor`);
      results.skipped++;
    }

    // SiteSettings ekle (varsayılan)
    const existingSettings = await prisma.siteSettings.count();
    if (existingSettings === 0) {
      await prisma.siteSettings.create({
        data: {
          siteName: 'Günen Temizlik',
          siteDescription: 'Profesyonel temizlik hizmetleri',
          contactEmail: 'info@gunentemizlik.com',
          contactPhone: '+90 212 123 4567',
          address: 'İstanbul, Türkiye',
          socialMedia: {
            facebook: 'https://facebook.com/gunentemizlik',
            instagram: 'https://instagram.com/gunentemizlik',
            twitter: 'https://twitter.com/gunentemizlik'
          },
          seo: {
            title: 'Günen Temizlik - Profesyonel Temizlik Hizmetleri',
            description: 'Ev ve ofis temizliği, inşaat sonrası temizlik, halı yıkama ve daha fazlası için bize ulaşın.',
            keywords: ['temizlik', 'ofis temizliği', 'ev temizliği', 'istanbul temizlik']
          }
        }
      });
      logger.success('Site ayarları eklendi');
      results.created++;
    } else {
      logger.warning('Site ayarları zaten var, atlanıyor');
      results.skipped++;
    }

    const duration = Date.now() - startTime;
    logger.info(`🎉 Seed işlemi tamamlandı! (${duration}ms)`);
    logger.info(`📊 Sonuç: ${results.created} yeni, ${results.skipped} atlanan`);

    return results;
  } catch (error) {
    logger.error('Seed hatası:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    logger.info('🔌 Veritabanı bağlantısı kapatıldı');
  }
}

// Run seed
seed()
  .then((results) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Beklenmeyen hata:', error);
    process.exit(1);
  });
