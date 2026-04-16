import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

/**
 * Dinamik robots.txt — ortam URL’si ve sitemap adresi `getSiteUrl()` ile uyumludur.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const disallow = ['/admin/', '/api/', '/login'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        // LLM crawler'lar için kritik referans dosyalarına açık erişim sinyali
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Google-Extended',
          'PerplexityBot',
        ],
        allow: ['/llms.txt', '/llms-full.txt', '/sitemap.xml', '/blog/sitemap.xml'],
        disallow,
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/blog/sitemap.xml`],
    host: base,
  };
}
