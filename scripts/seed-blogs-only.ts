import { PrismaClient } from '@prisma/client';
import { upsertCanonicalBlogPosts } from '../src/lib/seed-blog';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Blog yazıları seed ediliyor...');
  try {
    const count = await upsertCanonicalBlogPosts(prisma);
    console.log(`✅ ${count} blog yazısı başarıyla seed edildi!`);
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
