import { PrismaClient } from '@prisma/client';
import { upsertCanonicalServices } from '../src/lib/seed-services';
import { upsertCanonicalTestimonials } from '../src/lib/seed-testimonials';
import { upsertCanonicalBlogPosts } from '../src/lib/seed-blog';
import { upsertCanonicalTeamMembers } from '../src/lib/seed-team';
import { upsertCanonicalFaqs } from '../src/lib/seed-faq';

const prisma = new PrismaClient();

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

    const bn = await upsertCanonicalBlogPosts(prisma);
    console.log(`${bn} blog yazısı upsert edildi (20 trafik + 30 temizlik SEO)`);

    // Müşteri yorumları — seedKey ile upsert (22 SEO uyumlu kanonik yorum)
    const tn = await upsertCanonicalTestimonials(prisma);
    console.log(`${tn} müşteri yorumu upsert edildi (kanonik referanslar)`);

    const teamN = await upsertCanonicalTeamMembers(prisma);
    console.log(`${teamN} ekip üyesi upsert edildi (10 kişi)`);

    const faqN = await upsertCanonicalFaqs(prisma);
    console.log(`${faqN} SSS kaydı upsert edildi (SEO odaklı)`);

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

    // Pazarlama + güven bandı — kayıt varsa ve içerik boşsa bir kez doldur
    const siteRow = await prisma.siteSettings.findFirst();
    if (siteRow) {
      const patch: {
        promoBannerJson?: object;
        trustBandItemsJson?: string[];
      } = {};
      if (siteRow.promoBannerJson == null) {
        patch.promoBannerJson = {
          active: true,
          title: 'Ücretsiz keşif — aynı gün dönüş',
          body: 'Randevu bırakın, ekibimiz uygunluk ve fiyat için sizi arasın.',
          ctaLabel: 'Randevu al',
          ctaHref: '/randevu',
          dismissible: true,
        };
      }
      const trust = siteRow.trustBandItemsJson;
      const trustEmpty = trust == null || (Array.isArray(trust) && trust.length === 0);
      if (trustEmpty) {
        patch.trustBandItemsJson = ["15+ yıl İstanbul'da profesyonel temizlik · Sigortalı ekip"];
      }
      if (Object.keys(patch).length > 0) {
        await prisma.siteSettings.update({ where: { id: siteRow.id }, data: patch });
        console.log('SiteSettings: varsayılan pazarlama / güven bandı güncellendi');
      }
    }

    console.log('Seed işlemi tamamlandı!');
  } catch (error) {
    console.error('Seed hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
