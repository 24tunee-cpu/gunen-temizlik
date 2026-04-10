/**
 * @fileoverview Blog Posts Component
 * @description Blog yazıları grid bileşeni.
 * Prop-based data alır, animasyonlar ve accessibility desteği ile.
 *
 * @example
 * <BlogPosts posts={posts} />
 */

'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

/** Blog post veri tipi */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  category: string;
  author: string;
  createdAt: string;
}

/** BlogPosts component props */
interface BlogPostsProps {
  /** Blog yazıları dizisi */
  posts: BlogPost[];
  /** Gösterilecek maksimum yazı sayısı */
  limit?: number;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Blog Posts Grid Component
 * @param posts Array of blog posts to display
 * @param limit Maximum number of posts to show
 */
export function BlogPosts({ posts, limit }: BlogPostsProps) {
  const shouldReduceMotion = useReducedMotion();

  // Limit posts if specified
  const displayPosts = useMemo(() => {
    return limit ? posts.slice(0, limit) : posts;
  }, [posts, limit]);

  // Return null if no posts
  if (displayPosts.length === 0) return null;

  return (
    <div
      className="grid gap-8 lg:grid-cols-3"
      role="feed"
      aria-label="Blog yazıları"
    >
      {displayPosts.map((post, index) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: shouldReduceMotion ? 0 : index * 0.1,
            duration: shouldReduceMotion ? 0.2 : 0.5
          }}
          className="h-full"
        >
          <Link
            href={`/blog/${post.slug}`}
            className="group block h-full"
            aria-label={`${post.title} - ${post.author} - ${formatDate(post.createdAt)}`}
          >
            <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl bg-slate-200">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200" aria-hidden="true">
                  <span className="text-emerald-500 font-medium">Günen Temizlik</span>
                </div>
              )}
              <span
                className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800"
                aria-label={`Kategori: ${post.category}`}
              >
                {post.category}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <Calendar size={14} aria-hidden="true" />
                <time dateTime={post.createdAt}>
                  {formatDate(post.createdAt)}
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
  );
}

export default BlogPosts;
