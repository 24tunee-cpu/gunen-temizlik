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
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Blog post veri tipi */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  publishedAt: string;
  author?: string;
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
      className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100"
      aria-hidden="true"
    >
      <div className="h-48 bg-slate-200 animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-6 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
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

  const formattedDate = useMemo(() =>
    new Date(post.publishedAt).toLocaleDateString('tr-TR'),
    [post.publishedAt]
  );

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
        <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
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
              <div className="h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center" aria-hidden="true">
                <span className="text-emerald-500 text-4xl font-bold">Blog</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
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

            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
              {post.title}
            </h3>

            <p className="text-slate-600 line-clamp-3 mb-4">{post.excerpt}</p>

            <span className="inline-flex items-center text-emerald-600 font-medium">
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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);

  const shouldReduceMotion = useReducedMotion();

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
        setPosts(Array.isArray(data) ? data.slice(0, limit) : []);
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
        className="relative py-24 overflow-hidden"
        aria-label="Blog yazıları yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
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
        className="relative py-24 overflow-hidden"
        aria-label="Blog"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <FileText className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600">Henüz blog yazısı bulunmuyor.</p>
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
      className="relative py-24 overflow-hidden"
      aria-label="Blog"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 15 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
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

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600"
          >
            Tüm Yazılar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default BlogSection;
