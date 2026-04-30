/**
 * @fileoverview Blog Post Detail Page (Dynamic Route)
 * @description Blog yazısı detay sayfası.
 * Prisma'dan dinamik veri çeken, SEO optimizasyonlu server component.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Dynamic Route Segment [slug]
 * - Prisma ORM database access
 * - JSON-LD structured data (Article schema)
 * - View counter with analytics
 *
 * @admin-sync
 * Blog yazıları admin paneldeki /admin/blog sayfasından yönetilir.
 * Yazılar yayınlanmadan önce admin onayından geçer.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import SiteLayout from '../../site/layout';
import { formatDate } from '@/lib/utils';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { BlogShareButton } from '@/components/site/BlogShareButton';
import { resolveBlogMetaDesc, resolveBlogMetaTitle } from '@/lib/blog-meta';
import styles from './blog-content.module.css';
import { resolveIntentLinks } from '@/lib/keyword-intent-routing';
import { keywordsForPage } from '@/lib/seo-keywords';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  getSiteUrl,
  serializeSchemaGraph,
} from '@/lib/seo';

// ============================================
// TYPES
// ============================================

/** Page props for dynamic route */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Blog post data with Prisma fields */
interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string | null;
  category: string;
  tags: string[];
  author: string;
  published: boolean;
  views: number;
  metaTitle: string | null;
  metaDesc: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RELATED_SEO_UTILITY_LINKS = [
  { href: '/randevu', label: 'Randevu / keşif' },
  { href: '/rehber', label: 'Temizlik rehberi' },
  { href: '/ara', label: 'Site içi arama' },
] as const;
const MIN_INDEXABLE_WORD_COUNT = 300;

function toAbsoluteAsset(pathOrUrl: string | null | undefined, base: string): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const t = pathOrUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `${base}${t.startsWith('/') ? t : `/${t}`}`;
}

function getWordCount(rawHtml: string): number {
  return rawHtml
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

// ============================================
// METADATA GENERATION
// ============================================

/**
 * Generate dynamic metadata for blog post page
 * @param params Route parameters with slug
 * @returns SEO metadata
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post || !post.published) {
      return {
        title: 'Yazı Bulunamadı | Günen Temizlik Blog',
        description: 'Aradığınız blog yazısı bulunamadı.'
      };
    }

    const metaTitle = resolveBlogMetaTitle(post.title, post.metaTitle);
    const metaDesc = resolveBlogMetaDesc(post.excerpt, post.metaDesc);
    const contentWordCount = getWordCount(post.content);
    const isThinContent = contentWordCount < MIN_INDEXABLE_WORD_COUNT;

    const ogImage = toAbsoluteAsset(post.image, getSiteUrl());

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: keywordsForPage('blog', post.tags),
      alternates: {
        canonical: canonicalUrl(`/blog/${post.slug}`),
      },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        type: 'article',
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [post.author],
        tags: post.tags,
        url: canonicalUrl(`/blog/${post.slug}`),
        images: ogImage
          ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDesc,
        images: ogImage ? [ogImage] : undefined,
      },
      robots: {
        index: !isThinContent,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'Temizlik Rehberi Yazısı | İstanbul Blog | Günen',
      description: 'İstanbul temizlik süreçleri ve hijyen uygulamaları hakkında güncel blog içeriği.',
    };
  }
}

// ============================================
// JSON-LD STRUCTURED DATA HELPER
// ============================================

/**
 * Generate JSON-LD structured data for Article schema
 * @param post Blog post data from Prisma
 * @returns JSON-LD object
 */
function generateArticleSchema(post: BlogPostData) {
  const metaDesc = resolveBlogMetaDesc(post.excerpt, post.metaDesc);
  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const cover = toAbsoluteAsset(post.image, getSiteUrl());
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": metaDesc,
    "image": cover ? [cover] : undefined,
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "wordCount": wordCount,
    "inLanguage": "tr-TR",
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Günen Temizlik",
      "logo": {
        "@type": "ImageObject",
        "url": canonicalUrl('/logo.png')
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl(`/blog/${post.slug}`)
    },
    "isPartOf": {
      "@type": "Blog",
      "@id": canonicalUrl('/blog')
    },
    "about": [
      { "@type": "Thing", "name": post.category },
      ...post.tags.map((tag) => ({ "@type": "Thing", "name": tag })),
    ],
    "articleSection": post.category,
    "keywords": post.tags.join(', ')
  };
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

/**
 * Blog Post Page Component
 * Blog yazısı detay sayfası.
 * 
 * @param params Route parameters
 * @returns Blog post detail page
 * @throws notFound() if post not found or not published
 */
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch post data from database
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  // Handle not found or unpublished post
  if (!post || !post.published) {
    notFound();
  }

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      slug: { not: post.slug },
      OR: [
        { category: post.category },
        { tags: { hasSome: post.tags.slice(0, 5) } },
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { views: 'desc' }],
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
    },
  });

  // Update view counter (fire and forget)
  prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  }).catch(() => {
    // Silent fail - views are not critical
  });

  const articleSchema = generateArticleSchema(post as BlogPostData);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);
  const schemaGraphJson = serializeSchemaGraph([
    articleSchema as Record<string, unknown>,
    breadcrumbSchema,
  ]);

  // Calculate reading time (approximate)
  const wordCount = getWordCount(post.content);
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
  const intentLinks = resolveIntentLinks(
    [post.title, post.category, ...(post.tags || [])].join(' ')
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaGraphJson }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
          {/* Article Header */}
          <header
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
            aria-label="Yazı başlığı"
          >
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <Link
                href="/blog"
                className="mb-8 inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Blog'a Dön
              </Link>

              <span className="inline-block rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-medium text-emerald-400">
                {post.category}
              </span>

              <h1 className="mt-4 break-words text-balance text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-slate-400">
                <span className="flex items-center gap-2">
                  <User size={18} aria-hidden="true" />
                  {post.author}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={18} aria-hidden="true" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={18} aria-hidden="true" />
                  {readingTime} dk okuma
                </span>
              </div>

              {post.image && (
                <figure className="mt-8 aspect-video overflow-hidden rounded-2xl">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={1200}
                    height={630}
                    className="h-full w-full object-cover"
                    priority
                  />
                </figure>
              )}
            </div>
          </header>

          {/* Article Content */}
          <main className="flex-1 bg-slate-900">
            <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
              <div
                className={`${styles.body} max-w-none text-lg`}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {wordCount < MIN_INDEXABLE_WORD_COUNT && (
                <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <h2 className="text-base font-semibold text-amber-200">İçerik güncellemesi planlanıyor</h2>
                  <p className="mt-1 text-sm text-amber-100/90">
                    Bu yazı editoryal kalite standartlarımız doğrultusunda genişletme sürecindedir.
                  </p>
                </section>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <footer className="mt-12">
                  <h2 className="mb-4 text-lg font-semibold text-white">
                    Etiketler
                  </h2>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Etiketler">
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="rounded-full border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm text-slate-200"
                        role="listitem"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </footer>
              )}

              {/* Share & CTA */}
              <section className="mt-12 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
                <h2 className="text-lg font-semibold text-white">İlgili hizmetler</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Bu konuyla ilgili profesyonel destek almak için en çok tercih edilen hizmetlerimiz:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {intentLinks.map((service) => (
                    <Link
                      key={service.href}
                      href={service.href}
                      className="rounded-full border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/15"
                    >
                      {service.label}
                    </Link>
                  ))}
                </div>
                <h3 className="mt-8 text-base font-semibold text-white">Hızlı erişim</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Randevu, rehber ve site içi arama ile devam edin:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RELATED_SEO_UTILITY_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-slate-500/50 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>

              {relatedPosts.length > 0 && (
                <section className="mt-10 rounded-xl border border-slate-700 bg-slate-800/30 p-5">
                  <h2 className="text-lg font-semibold text-white">İlgili blog yazıları</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {relatedPosts.map((related) => (
                      <Link
                        key={related.id}
                        href={`/blog/${related.slug}`}
                        className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 hover:border-emerald-500/40"
                      >
                        <p className="text-xs text-emerald-300">{related.category}</p>
                        <p className="mt-1 font-medium text-white">{related.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{related.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Share & CTA */}
              <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-700 pt-8 sm:flex-row">
                <Link
                  href="/iletisim"
                  className="w-full rounded-lg bg-emerald-500 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto"
                >
                  Profesyonel Hizmet Al
                </Link>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {post.views} görüntülenme
                  </span>
                  <BlogShareButton title={post.title} slug={post.slug} />
                </div>
              </div>
            </article>
          </main>
        </div>
      </SiteLayout>
    </>
  );
}
