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
        crawlDelay: 1, // 1 saniye bekle - server'ı yormaz
      },
      {
        // Google için özel ayar - daha hızlı ama kontrollü
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0.5, // 500ms - Google için optimize
      },
      {
        // Diğer major botlar
        userAgent: ['Bingbot', 'Slurp', 'DuckDuckBot'],
        allow: '/',
        crawlDelay: 1,
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
        allow: [
          '/llms.txt',
          '/llms-full.txt',
          '/sitemap.xml',
          '/blog/sitemap.xml',
          '/hizmetler',
          '/bolgeler',
        ],
        disallow,
        crawlDelay: 2, // LLM botlar için daha yavaş
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/blog/sitemap.xml`],
    host: base,
  };
}
