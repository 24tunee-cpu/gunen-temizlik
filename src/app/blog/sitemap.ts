import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/seo';
import { PRIORITY_BLOG_LINKS } from '@/lib/priority-seo-links';

const PRIORITY_BLOG_SET = new Set(PRIORITY_BLOG_LINKS.map((item) => item.href.replace('/blog/', '')));

/**
 * Blog odakli sitemap:
 * - Blog URL'lerini ana sitemap'ten ayirarak crawler odagini netlestirir.
 * - Ticari niyetli URL'lere daha yuksek priority sinyali verir.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 1200,
    });

    return posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: PRIORITY_BLOG_SET.has(post.slug) ? 0.92 : 0.74,
    }));
  } catch {
    return PRIORITY_BLOG_LINKS.map((item) => ({
      url: `${base}${item.href}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.92,
    }));
  }
}
