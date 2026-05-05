/**
 * Topic Cluster Internal Linking System
 * SEO için gelişmiş internal linking mimarisi
 * Mevcut sistemi bozmadan yeni özellikler ekler
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Topic cluster tanımları
const TOPIC_CLUSTERS = {
  'temizlik': {
    pillar: 'temizlik',
    keywords: ['temizlik', 'hijyen', 'dezenfeksiyon', 'sterilizasyon'],
    relatedServices: ['ev-temizligi', 'ofis-temizligi', 'insaat-sonrasi-temizlik'],
    relatedDistricts: ['kadikoy', 'uskudar', 'ataşehir', 'besiktas']
  },
  'hizmetler': {
    pillar: 'hizmetler',
    keywords: ['hizmet', 'servis', 'destek', 'çözüm'],
    relatedServices: ['koltuk-yikama', 'hali-yikama', 'cam-temizligi'],
    relatedDistricts: ['sariyer', 'beykoz', 'maltepe', 'pendik']
  },
  'fiyatlar': {
    pillar: 'fiyatlar',
    keywords: ['fiyat', 'ücret', 'maliyet', 'bedel'],
    relatedServices: ['fiyat', 'ucret-fiyat'],
    relatedDistricts: ['fatih', 'eminönü', 'beyoglu', 'sisli']
  },
  'bolgeler': {
    pillar: 'bolgeler',
    keywords: ['bölge', 'ilçe', 'semt', 'mahalle'],
    relatedServices: ['bolgeler', 'harita-ve-yorumlar'],
    relatedDistricts: ['istanbul', 'avrupa-yakasi', 'anadolu-yakasi']
  }
};

interface RelatedContent {
  type: 'blog' | 'service' | 'district' | 'utility';
  title: string;
  href: string;
  description?: string;
  priority: number;
  relevanceScore: number;
}

/**
 * İçerikten topic cluster'ı belirle
 */
function detectTopicCluster(title: string, content: string, category: string): string {
  const combinedText = `${title} ${content} ${category}`.toLowerCase();

  let bestMatch = 'temizlik';
  let highestScore = 0;

  for (const [cluster, data] of Object.entries(TOPIC_CLUSTERS)) {
    let score = 0;

    // Keywords skor
    for (const keyword of data.keywords) {
      if (combinedText.includes(keyword)) {
        score += 2;
      }
    }

    // Category skor
    if (category.toLowerCase().includes(cluster)) {
      score += 3;
    }

    // Title skor
    if (title.toLowerCase().includes(cluster)) {
      score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = cluster;
    }
  }

  return bestMatch;
}

/**
 * İlgili blog yazılarını getir (cache ile)
 */
const getRelatedBlogPosts = unstable_cache(
  async (currentSlug: string, category: string, limit: number = 5) => {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        slug: { not: currentSlug },
        OR: [
          { category: category },
          { tags: { hasSome: [category] } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        createdAt: true,
        views: true
      },
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return posts;
  },
  ['related-blog-posts'],
  { revalidate: 300 }
);

/**
 * İlgili hizmetleri getir
 */
const getRelatedServices = unstable_cache(
  async (category: string) => {
    const services = await prisma.service.findMany({
      where: {
        title: { contains: category }
      },
      select: {
        id: true,
        title: true,
        slug: true
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    return services;
  },
  ['related-services'],
  { revalidate: 600 }
);

/**
 * Topic cluster'a göre internal linkler oluştur
 */
export async function generateTopicClusterLinks(
  currentSlug: string,
  title: string,
  content: string,
  category: string
): Promise<RelatedContent[]> {
  const cluster = detectTopicCluster(title, content, category);
  const clusterData = TOPIC_CLUSTERS[cluster as keyof typeof TOPIC_CLUSTERS];

  const links: RelatedContent[] = [];

  // 1. İlgili blog yazıları (en yüksek öncelik)
  const relatedPosts = await getRelatedBlogPosts(currentSlug, category, 4);
  for (const post of relatedPosts) {
    links.push({
      type: 'blog',
      title: post.title,
      href: `/blog/${post.slug}`,
      description: post.excerpt,
      priority: 10,
      relevanceScore: calculateRelevanceScore(title, post.title, category)
    });
  }

  // 2. İlgili hizmetler
  const relatedServices = await getRelatedServices(category);
  for (const service of relatedServices) {
    links.push({
      type: 'service',
      title: service.title,
      href: `/hizmetler/${service.slug}`,
      priority: 8,
      relevanceScore: calculateRelevanceScore(title, service.title, category)
    });
  }

  // 3. Bölge sayfaları (topic cluster'a göre)
  for (const district of clusterData.relatedDistricts.slice(0, 3)) {
    links.push({
      type: 'district',
      title: `${district.charAt(0).toUpperCase() + district.slice(1)} Temizlik`,
      href: `/bolgeler/${district}`,
      description: `${district} bölgesinde profesyonel temizlik hizmetleri`,
      priority: 6,
      relevanceScore: 0.7
    });
  }

  // 4. Utility linkler (düşük öncelik)
  const utilityLinks = [
    { title: 'Randevu Al', href: '/randevu', priority: 4 },
    { title: 'Fiyat Bilgisi', href: '/fiyatlar', priority: 4 },
    { title: 'Hakkımızda', href: '/hakkimizda', priority: 3 },
    { title: 'İletişim', href: '/iletisim', priority: 3 }
  ];

  for (const utility of utilityLinks) {
    links.push({
      type: 'utility',
      title: utility.title,
      href: utility.href,
      priority: utility.priority,
      relevanceScore: 0.5
    });
  }

  // Öncelik ve relevance skoruna göre sırala
  return links
    .sort((a, b) => (b.priority + b.relevanceScore) - (a.priority + a.relevanceScore))
    .slice(0, 8); // En fazla 8 link göster
}

/**
 * İki içerik arasındaki relevance skorunu hesapla
 */
function calculateRelevanceScore(
  currentTitle: string,
  relatedTitle: string,
  category: string
): number {
  const currentWords = currentTitle.toLowerCase().split(/\s+/);
  const relatedWords = relatedTitle.toLowerCase().split(/\s+/);
  const categoryWords = category.toLowerCase().split(/\s+/);

  let score = 0;

  // Ortak kelimeler
  const commonWords = currentWords.filter(word =>
    relatedWords.includes(word) && word.length > 3
  );
  score += commonWords.length * 0.3;

  // Category relevance
  for (const catWord of categoryWords) {
    if (relatedTitle.toLowerCase().includes(catWord)) {
      score += 0.2;
    }
  }

  // Uzunluk farkı (çok farklı uzunluktaki başlıklar lower skor)
  const lengthDiff = Math.abs(currentTitle.length - relatedTitle.length);
  score -= lengthDiff * 0.001;

  return Math.max(0, Math.min(1, score));
}

/**
 * Blog içeriğine otomatik internal linkler ekle
 */
export function addInternalLinksToContent(
  content: string,
  availableLinks: RelatedContent[]
): string {
  let processedContent = content;
  const usedLinks = new Set<string>();

  // Mevcut linkleri koru
  const existingLinks = new Set();
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    existingLinks.add(match[1]);
  }

  // Önemli keyword'leri bul ve link ekle
  const importantKeywords = [
    'temizlik', 'hizmet', 'fiyat', 'randevu', 'iletişim',
    'ev temizliği', 'ofis temizliği', 'koltuk yıkama'
  ];

  for (const keyword of importantKeywords) {
    if (processedContent.includes(keyword) && !processedContent.includes(`<a href`)) {
      const suitableLink = availableLinks.find(link =>
        !usedLinks.has(link.href) &&
        !existingLinks.has(link.href) &&
        link.title.toLowerCase().includes(keyword.toLowerCase())
      );

      if (suitableLink && Math.random() > 0.5) { // %50 ihtimalle ekle
        const linkHtml = `<a href="${suitableLink.href}" class="text-emerald-400 hover:text-emerald-300 underline">${keyword}</a>`;
        processedContent = processedContent.replace(
          new RegExp(`\\b${keyword}\\b`, 'gi'),
          linkHtml
        );
        usedLinks.add(suitableLink.href);
      }
    }
  }

  return processedContent;
}

/**
 * Breadcrumb için topic cluster path'i oluştur
 */
export function generateTopicClusterBreadcrumb(
  title: string,
  content: string,
  category: string
): Array<{ name: string, href: string }> {
  const cluster = detectTopicCluster(title, content, category);

  const breadcrumb = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'Blog', href: '/blog' }
  ];

  // Cluster'a göre breadcrumb ekle
  if (cluster !== 'temizlik') {
    breadcrumb.push({
      name: cluster.charAt(0).toUpperCase() + cluster.slice(1),
      href: `/blog?category=${cluster}`
    });
  }

  breadcrumb.push({ name: title, href: '#' });

  return breadcrumb;
}
