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
  createdAt: Date;
  updatedAt: Date;
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

    return {
      title: `${post.title} | Günen Temizlik Blog`,
      description: post.excerpt,
      keywords: post.tags,
      alternates: {
        canonical: `https://gunentemizlik.com/blog/${post.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: 'article',
        publishedTime: post.createdAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: [post.author],
        tags: post.tags,
        url: `https://gunentemizlik.com/blog/${post.slug}`,
        images: post.image ? [
          {
            url: post.image,
            width: 1200,
            height: 630,
            alt: post.title,
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: post.image ? [post.image] : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Blog Yazısı | Günen Temizlik',
      description: 'Profesyonel temizlik hakkında faydalı bilgiler.',
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image || undefined,
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Günen Temizlik",
      "logo": {
        "@type": "ImageObject",
        "url": "https://gunentemizlik.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://gunentemizlik.com/blog/${post.slug}`
    },
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

  // Update view counter (fire and forget)
  prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  }).catch(() => {
    // Silent fail - views are not critical
  });

  // Generate structured data
  const articleSchema = generateArticleSchema(post as BlogPostData);

  // Calculate reading time (approximate)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <SiteLayout>
        <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        {/* Article Header */}
        <header
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-32 pb-16"
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

            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
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
              className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-emerald-400 prose-strong:text-white prose-li:text-slate-300 prose-blockquote:border-emerald-500/40 prose-blockquote:text-slate-400"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <footer className="mt-12">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Etiketler
                </h2>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Etiketler">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300"
                      role="listitem"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </footer>
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
