/**
 * @fileoverview Blog Content Component
 * @description Blog içerik bileşeni.
 * Masonry layout, animasyonlar ve accessibility desteği ile.
 *
 * @example
 * <BlogContent posts={posts} />
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, User, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

/** Blog post veri tipi */
interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  category: string;
  author: string;
  createdAt: Date;
}

/** BlogContent component props */
interface BlogContentProps {
  /** Blog yazıları dizisi */
  posts: Post[];
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// CONSTANTS
// ============================================

const MASONRY_COLUMNS = 3;

// ============================================
// COMPONENT
// ============================================

/**
 * Blog Content Component with Masonry Layout
 * @param posts Array of blog posts to display
 * @param title Section title
 * @param description Section description
 */
export function BlogContent({
  posts,
  title = "Faydalı Bilgiler",
  description
}: BlogContentProps) {
  const shouldReduceMotion = useReducedMotion();

  // Distribute posts into columns for masonry effect (memoized)
  const columnPosts = useMemo(() => {
    const columns: Post[][] = Array.from({ length: MASONRY_COLUMNS }, () => []);
    posts.forEach((post, index) => {
      columns[index % MASONRY_COLUMNS].push(post);
    });
    return columns;
  }, [posts]);

  // Empty state
  if (posts.length === 0) {
    return (
      <section
        className="relative bg-white py-24 overflow-hidden"
        aria-label="Blog içeriği yükleniyor"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-100/20 via-white to-white" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg"
            role="status"
            aria-live="polite"
          >
            <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" aria-hidden="true" />
            <p className="text-slate-600 font-medium">Blog yazıları yükleniyor...</p>
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
      className="relative bg-white py-24 overflow-hidden"
      aria-label="Blog içeriği"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-100/20 via-white to-white" aria-hidden="true" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          className="mb-16 flex items-end justify-between"
          initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
        >
          <div>
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Blog
            </motion.span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-slate-600 max-w-xl">{description}</p>
            )}
          </div>
          <Link
            href="/blog"
            className="group hidden items-center gap-2 text-emerald-600 transition-all hover:text-emerald-700 sm:flex"
            aria-label="Tüm blog yazılarını görüntüle"
          >
            <span className="font-medium">Tüm Yazılar</span>
            <motion.span
              animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              aria-hidden="true"
            >
              <ArrowRight size={18} />
            </motion.span>
          </Link>
        </motion.header>

        {/* Masonry Layout */}
        <div
          className="grid gap-6 lg:grid-cols-3"
          role="feed"
          aria-label="Blog yazıları"
        >
          {columnPosts.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-6">
              {column.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                    duration: shouldReduceMotion ? 0.2 : 0.5
                  }}
                  className="group"
                  role="article"
                  aria-label={`${post.title} - ${post.author}`}
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative mb-4 overflow-hidden rounded-2xl bg-slate-200 shadow-lg transition-all duration-500 group-hover:shadow-xl">
                      <div className="aspect-[16/10] overflow-hidden">
                        {post.image ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200" aria-hidden="true">
                            <span className="text-emerald-500 font-medium">Günen Temizlik</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                      <span
                        className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm"
                        aria-label={`Kategori: ${post.category}`}
                      >
                        {post.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} aria-hidden="true" />
                        <time dateTime={post.createdAt.toISOString()}>
                          {formatDate(post.createdAt.toString())}
                        </time>
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} aria-hidden="true" />
                        {post.author}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-600 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-slate-600 line-clamp-2">{post.excerpt}</p>
                  </Link>
                </motion.article>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-emerald-600"
            aria-label="Tüm blog yazılarını görüntüle"
          >
            <span className="font-medium">Tüm Yazılar</span>
            <motion.span
              animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              aria-hidden="true"
            >
              <ArrowRight size={18} />
            </motion.span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BlogContent;
