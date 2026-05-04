import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/seo';

/**
 * XML escaping helper - Prevents parsing errors in RSS feeds
 * Handles: &, <, >, ", ', and control characters
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove control characters
}

/**
 * Strip HTML tags for plain text description
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Format Date to RFC 2822 (RSS standard)
 */
function formatRfc2822(date: Date): string {
  return date.toUTCString();
}

/**
 * Generate RSS 2.0 Feed for Google Publisher Center
 * Fetches latest 20 published blog posts
 */
export async function GET() {
  try {
    const baseUrl = getSiteUrl();
    const siteName = 'Günen Temizlik';
    const siteDescription = 'İstanbul\'da profesyonel ev ve ofis temizlik hizmetleri. Güvenilir, sigortalı ve deneyimli ekiplerle 7/24 hizmetinizdeyiz.';

    // Fetch latest 20 published blog posts
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        image: true,
        category: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const now = new Date();
    const lastBuildDate = formatRfc2822(now);

    // Generate RSS items
    const items = posts.map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const pubDate = formatRfc2822(post.createdAt);
      const description = escapeXml(post.excerpt || stripHtml(post.content));
      const title = escapeXml(post.title);
      const author = escapeXml(post.author || 'Günen Temizlik');
      const category = escapeXml(post.category);

      let enclosure = '';
      if (post.image) {
        // Determine mime type from extension (basic detection)
        const ext = post.image.split('.').pop()?.toLowerCase() || '';
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';

        enclosure = `    <enclosure url="${escapeXml(post.image)}" type="${mimeType}" />\n`;
      }

      return `  <item>
    <title>${title}</title>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <author>${author}</author>
    <category>${category}</category>
    <description>${description}</description>
${enclosure}  </item>`;
    }).join('\n');

    // Build complete RSS 2.0 feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
>
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>tr-TR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Günen Temizlik RSS Feed Generator</generator>
    <copyright>© ${now.getFullYear()} ${escapeXml(siteName)}. Tüm hakları saklıdır.</copyright>
    <managingEditor>iletisim@gunentemizlik.com (${escapeXml(siteName)})</managingEditor>
    <webMaster>iletisim@gunentemizlik.com (${escapeXml(siteName)})</webMaster>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>${escapeXml(siteName)}</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('RSS Feed Error:', error);
    
    // Return error RSS with proper XML
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hata - Günen Temizlik RSS</title>
    <description>RSS feed oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</description>
  </channel>
</rss>`;

    return new NextResponse(errorRss, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  }
}

// Ensure fresh data on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;
