/**
 * @fileoverview Blog Page
 * @description Blog sayfası - temizlik ipuçları ve bilgiler.
 * SEO optimizasyonu, structured data ve admin-site senkronizasyonu ile.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - JSON-LD structured data (Blog schema)
 * - Dynamic blog posts from admin panel
 * - Content marketing optimized
 *
 * @admin-sync
 * Blog yazıları admin paneldeki /admin/blog sayfasından yönetilir.
 * Kategoriler ve etiketler admin panelden düzenlenir.
 */

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import { BlogPost, BlogSection } from '@/components/site/BlogSection';
import { BookOpen, ArrowRight, Search } from 'lucide-react';

// ============================================
// METADATA (SEO)
// ============================================

type BlogSearchParams = {
  page?: string;
  tag?: string;
  q?: string;
};

type PageProps = {
  searchParams: Promise<BlogSearchParams>;
};

const PAGE_SIZE = 9;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  const tag = sp.tag?.trim() || '';
  const q = sp.q?.trim() || '';

  const suffix = [
    page > 1 ? `Sayfa ${page}` : null,
    tag ? `${tag} etiketi` : null,
    q ? `"${q}" araması` : null,
  ]
    .filter(Boolean)
    .join(' - ');

  const title = suffix
    ? `Blog | Günen Temizlik - ${suffix}`
    : 'Blog | Günen Temizlik - Temizlik İpuçları ve Bilgiler';
  const description = tag
    ? `${tag} etiketi için profesyonel temizlik makaleleri ve pratik öneriler.`
    : q
      ? `"${q}" araması için blog sonuçları ve uzman içerikler.`
      : 'Profesyonel temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler. Ev temizliği, ofis temizliği ve hijyen hakkında uzman tavsiyeleri.';

  const query = new URLSearchParams();
  if (page > 1) query.set('page', String(page));
  if (tag) query.set('tag', tag);
  if (q) query.set('q', q);
  const canonical = query.toString()
    ? `https://gunentemizlik.com/blog?${query.toString()}`
    : 'https://gunentemizlik.com/blog';

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'Günen Temizlik',
      images: [
        {
          url: 'https://gunentemizlik.com/og-blog.jpg',
          width: 1200,
          height: 630,
          alt: 'Günen Temizlik - Blog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://gunentemizlik.com/og-blog.jpg'],
    },
  };
}

// ============================================
// JSON-LD STRUCTURED DATA (Blog)
// ============================================

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Günen Temizlik Blog",
  "description": "Profesyonel temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler",
  "url": "https://gunentemizlik.com/blog",
  "publisher": {
    "@type": "Organization",
    "name": "Günen Temizlik Şirketi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://gunentemizlik.com/logo.png"
    }
  },
  "about": {
    "@type": "Thing",
    "name": "Temizlik ve Hijyen"
  }
};

const blogBreadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Ana Sayfa',
      item: 'https://gunentemizlik.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://gunentemizlik.com/blog',
    },
  ],
};

// ============================================
// LOADING FALLBACK
// ============================================

function mapPosts(rows: Array<{
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  author: string;
  createdAt: Date;
  category: string;
  tags: string[];
}>): BlogPost[] {
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.image || undefined,
    publishedAt: p.createdAt.toISOString(),
    author: p.author,
    category: p.category,
    tags: p.tags,
  }));
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Blog Page Component
 * Blog sayfası - temizlik ipuçları ve makaleler.
 * 
 * @admin-sync Blog yazıları /admin/blog'dan yönetilir
 */
export default async function BlogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1);
  const tag = sp.tag?.trim() || '';
  const q = sp.q?.trim() || '';
  const searchQuery = q.length >= 2 ? q : '';

  const where = {
    published: true,
    ...(tag ? { tags: { has: tag } } : {}),
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' as const } },
            { excerpt: { contains: searchQuery, mode: 'insensitive' as const } },
            { content: { contains: searchQuery, mode: 'insensitive' as const } },
            { tags: { has: searchQuery } },
          ],
        }
      : {}),
  };

  const [postsRaw, allTagsRaw] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        author: true,
        createdAt: true,
        category: true,
        tags: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { tags: true },
      take: 250,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const posts = mapPosts(postsRaw);
  const topTags = [...new Set(allTagsRaw.flatMap((p) => p.tags).filter(Boolean))].slice(0, 12);
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageItems = posts.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: posts.length,
    itemListElement: pageItems.map((post, index) => ({
      '@type': 'ListItem',
      position: (safeCurrentPage - 1) * PAGE_SIZE + index + 1,
      url: `https://gunentemizlik.com/blog/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Sayfa başlığı"
        >
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <BookOpen
              className="mx-auto mb-6 h-14 w-14 text-emerald-400 sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Blog</h1>
            <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg">
              Temizlik hakkında faydalı bilgiler, ipuçları ve güncel makaleler.
              Profesyonel tavsiyelerimizi keşfedin.
            </p>
          </div>
        </section>

        {/* Search + filters */}
        <section className="border-b border-slate-800 bg-slate-900 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <form action="/blog" className="mx-auto flex w-full max-w-3xl items-center gap-2">
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Blog içinde ara (örn: ofis temizliği)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400"
              />
              {tag ? <input type="hidden" name="tag" value={tag} /> : null}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Ara
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <Link
                href="/blog"
                className={`rounded-full border px-3 py-1 ${
                  !tag ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 text-slate-300'
                }`}
              >
                Tümü
              </Link>
              {topTags.map((t) => (
                <Link
                  key={t}
                  href={`/blog?tag=${encodeURIComponent(t)}`}
                  className={`rounded-full border px-3 py-1 ${
                    tag === t ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 text-slate-300'
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-slate-300">
              <span>
                Belirli bir konu hakkında bilgi mi arıyorsunuz?
                <Link href="/sss" className="ml-1 text-emerald-400 hover:underline">
                  SSS sayfamıza göz atın
                </Link>
              </span>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <div className="flex min-h-0 flex-1 flex-col">
          <BlogSection
            paginate
            pageSize={PAGE_SIZE}
            initialPosts={posts}
            currentPage={safeCurrentPage}
            title={tag ? `#${tag} etiketi` : searchQuery ? `"${searchQuery}" araması` : 'Blog'}
            description={
              tag
                ? `${tag} etiketi altındaki yazılar ve pratik rehberler`
                : searchQuery
                  ? `"${searchQuery}" ile ilgili makaleler`
                  : 'Temizlik ipuçları, haberler ve daha fazlası'
            }
          />
        </div>

        {/* CTA Section */}
        <section className="flex-1 border-t border-slate-800 bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Profesyonel yardıma mı ihtiyacınız var?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-slate-300">
              Blog yazılarımızda bahsettiğimiz profesyonel temizlik hizmetlerimizden
              yararlanmak için hemen iletişime geçin.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Ücretsiz Keşif Talep Edin
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
        </div>
      </SiteLayout>
    </>
  );
}
