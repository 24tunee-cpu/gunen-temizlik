import { prisma } from '@/lib/prisma';

/**
 * Zamanı gelmiş taslak yayınları açar (günlük cron ile çağrılır).
 */
export async function publishScheduledBlogPosts(): Promise<{ published: number }> {
  const now = new Date();
  const due = await prisma.blogPost.findMany({
    where: {
      published: false,
      scheduledPublishAt: { lte: now },
    },
    select: { id: true },
  });
  if (due.length === 0) return { published: 0 };

  await prisma.blogPost.updateMany({
    where: { id: { in: due.map((d) => d.id) } },
    data: {
      published: true,
      scheduledPublishAt: null,
    },
  });

  return { published: due.length };
}
