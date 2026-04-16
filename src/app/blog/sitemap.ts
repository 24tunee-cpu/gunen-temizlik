import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';
import { PRIORITY_BLOG_LINKS } from '@/lib/priority-seo-links';

const PRIORITY_BLOG_SET = new Set(PRIORITY_BLOG_LINKS.map((item) => item.href.replace('/blog/', '')));

/**
 * Blog odakli sitemap:
 * - Blog URL'lerini ana sitemap'ten ayirarak crawler odagini netlestirir.
 * - Ticari niyetli URL'lere daha yuksek priority sinyali verir.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const base = getSiteUrl();
    const now = new Date();

    return PRIORITY_BLOG_LINKS.map((item) => {
      const slug = item.href.replace('/blog/', '');
      return {
        url: `${base}${item.href}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: PRIORITY_BLOG_SET.has(slug) ? 0.92 : 0.74,
      };
    });
  } catch {
    const fallbackBase = 'https://gunentemizlik.com';
    return PRIORITY_BLOG_LINKS.map((item) => ({
      url: `${fallbackBase}${item.href}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.92,
    }));
  }
}
