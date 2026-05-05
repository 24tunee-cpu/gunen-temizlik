import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tüm blog yazılarından görselleri kaldırır
 * - content içindeki <img> tag'lerini temizler
 * - image alanını null yapar
 * - Google botları daha hızlı tarama yapar
 */
async function removeImagesFromBlogs() {
  console.log('🚀 Blog yazılarındaki görseller kaldırılıyor...');

  try {
    // Tüm blog yazılarını al
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { id: true, title: true, content: true, image: true },
    });

    console.log(`📝 ${posts.length} blog yazısı bulundu.`);

    let updatedCount = 0;

    for (const post of posts) {
      let updated = false;
      let newContent = post.content;
      
      // 1. content içindeki <img> tag'lerini temizle
      if (post.content && post.content.includes('<img')) {
        newContent = post.content
          .replace(/<img[^>]*>/g, '') // <img> tag'lerini tamamen kaldır
          .replace(/\s+/g, ' ') // Fazla boşlukları temizle
          .trim();
        
        if (newContent !== post.content) {
          updated = true;
        }
      }

      // 2. image alanını null yap
      if (post.image) {
        updated = true;
      }

      // Eğer değişiklik varsa güncelle
      if (updated) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            content: newContent,
            image: null, // Görsel URL'sini kaldır
          },
        });
        
        updatedCount++;
        console.log(`✅ "${post.title.substring(0, 50)}..." görselleri kaldırıldı`);
      }
    }

    console.log(`🎉 Toplam ${updatedCount} blog yazısı güncellendi.`);
    console.log('🚀 Google botları artık daha hızlı tarama yapacak!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeImagesFromBlogs();
