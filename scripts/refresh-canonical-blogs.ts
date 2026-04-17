import { PrismaClient } from '@prisma/client';
import { upsertCanonicalBlogPosts } from '../src/lib/seed-blog';

async function run() {
  const prisma = new PrismaClient();
  try {
    const total = await upsertCanonicalBlogPosts(prisma);
    console.log(`Canonical blog posts upserted: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('refresh-canonical-blogs failed:', error);
  process.exitCode = 1;
});
