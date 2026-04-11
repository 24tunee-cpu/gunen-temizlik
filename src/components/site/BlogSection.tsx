/**
 * @fileoverview Blog Section Component
 * @description Blog bölümü bileşeni.
 * Blog kartları, skeleton loading, ve accessibility desteği ile.
 *
 * @example
 * <BlogSection />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Calendar, ArrowRight, User, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Blog post veri tipi (API: image, createdAt) */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  publishedAt: string;
  author?: string;
}

/** /api/blog yanıtı (Prisma alan adları) */
interface BlogPostApiRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string | null;
  author?: string;
  createdAt: string;
}

/** BlogSection component props */
interface BlogSectionProps {
  /** Gösterilecek maksimum yazı sayısı */
  limit?: number;
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

/** BlogCard component props */
interface BlogCardProps {
  post: BlogPost;
  index: number;
}

// ============================================
// SKELETON COMPONENT
// ============================================

/**
 * Blog Card Skeleton Component
 */
function BlogCardSkeleton({ index }: { index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.05 }}
      className="relative h-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-lg"
      aria-hidden="true"
    >
      <div className="h-48 animate-pulse bg-slate-700" />
      <div className="space-y-3 p-6">
        <div className="flex gap-4">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-600" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-600" />
        </div>
        <div className="h-6 animate-pulse rounded bg-slate-600" />
        <div className="h-4 animate-pulse rounded bg-slate-600" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-600" />
      </div>
    </motion.div>
  );
}

// ============================================
// BLOG CARD COMPONENT
// ============================================

/**
 * Blog Card Component
 * Individual blog post card with animations.
 */
function BlogCard({ post, index }: BlogCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const formattedDate = useMemo(() => {
    const d = new Date(post.publishedAt);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('tr-TR');
  }, [post.publishedAt]);

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.1, duration: shouldReduceMotion ? 0.2 : 0.5 }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full"
        aria-label={`${post.title} - ${post.author || 'Yazar'} - ${formattedDate}`}
      >
        <div className="relative h-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-lg transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-emerald-900/20">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-950/80" aria-hidden="true">
                <span className="text-4xl font-bold text-emerald-400/90">Blog</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={post.publishedAt}>{formattedDate}</time>
              </span>
              {post.author && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" aria-hidden="true" />
                  {post.author}
                </span>
              )}
            </div>

            <h3 className="mb-2 line-clamp-2 text-xl font-bold text-white transition-colors group-hover:text-emerald-400">
              {post.title}
            </h3>

            <p className="mb-4 line-clamp-3 text-slate-300">{post.excerpt}</p>

            <span className="inline-flex items-center font-medium text-emerald-400">
              Devamını Oku
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Blog Section Component
 * @param limit Maximum number of posts to display (default: 6)
 * @param title Section title
 * @param description Section description
 */
export function BlogSection({
  limit = 6,
  title = "Blog",
  description = "Temizlik ipuçları, haberler ve daha fazlası"
}: BlogSectionProps) {
  const pathname = usePathname();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const showViewAllLink = pathname !== '/blog';

  // ============================================
  // MOUNT CHECK (SSR hydration fix)
  // ============================================
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // DATA FETCHING
  // ============================================
  useEffect(() => {
    if (!isMounted) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/blog');
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        if (!Array.isArray(data)) {
          setPosts([]);
          return;
        }
        const mapped: BlogPost[] = data.slice(0, limit).map((p: BlogPostApiRow) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          coverImage: p.image ?? undefined,
          publishedAt: p.createdAt,
          author: p.author,
        }));
        setPosts(mapped);
      } catch (error) {
        logger.error('Error fetching posts', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isMounted, limit]);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  if (!isMounted || loading) {
    return (
      <section
        className="relative flex-1 bg-slate-900 py-24"
        aria-label="Blog yazıları yükleniyor"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white sm:text-5xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">{description}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
              <BlogCardSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE (no posts at all)
  // ============================================
  if (posts.length === 0) {
    return (
      <section
        className="relative flex-1 bg-slate-900 py-24"
        aria-label="Blog"
      >
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <FileText className="mx-auto mb-4 h-16 w-16 text-emerald-400" aria-hidden="true" />
            <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
            <p className="text-slate-400">Henüz blog yazısı bulunmuyor.</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      className="relative flex-1 bg-slate-900 py-24"
      aria-label="Blog"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 15 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {description}
          </p>
        </motion.header>

        {/* Blog Grid */}
        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          role="feed"
          aria-label="Blog yazıları"
        >
          {posts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* View All Button — ana sayfada; /blog sayfasında gizli */}
        {showViewAllLink && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
            className="mt-12 text-center"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600"
            >
              Tüm Yazılar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default BlogSection;
