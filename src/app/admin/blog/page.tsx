'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  views: number;
  tags: string[];
  author: string;
  metaTitle?: string;
  metaDesc?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching blog posts');

      const res = await fetch('/api/blog');

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Blog posts fetched successfully', { count: data.length });
      setPosts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Blog yazıları yüklenirken hata oluştu';
      console.error('Failed to fetch blog posts', { error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'blog' });
      setError(errorMessage);
      toast.error('Blog yazıları yüklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      console.log('Deleting blog post', { slug });
      const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }

      setPosts(posts.filter((p) => p.slug !== slug));
      setDeleteModal(null);
      console.log('Blog post deleted successfully', { slug });
      toast.success('Yazı silindi', 'Blog yazısı başarıyla silindi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      console.error('Failed to delete blog post', { slug, error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-blog', slug });
      toast.error('Silme başarısız', errorMessage);
    }
  };

  const togglePublish = async (slug: string, published: boolean) => {
    try {
      console.log('Toggling publish status', { slug, published: !published });
      const res = await fetch(`/api/blog/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      });

      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
      }

      setPosts(posts.map((p) => (p.slug === slug ? { ...p, published: !published } : p)));
      console.log('Publish status updated', { slug, published: !published });
      toast.success('Durum güncellendi', published ? 'Yazı taslak olarak kaydedildi' : 'Yazı yayınlandı');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Güncelleme başarısız';
      console.error('Failed to toggle publish status', { slug, error: errorMessage }, error instanceof Error ? error : undefined);
      toast.error('Güncelleme başarısız', errorMessage);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-emerald-500/30 dark:border-t-emerald-500/30"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl p-8">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Blog Yazıları Yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchPosts()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Blog Yazıları</h1>
        <Link
          href="/admin/blog/yeni"
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          <Plus size={18} />
          Yeni Yazı
        </Link>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Yazı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Başlık
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Görüntülenme
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Tarih
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{post.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-300">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(post.slug, post.published)}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${post.published
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {post.published ? 'Yayında' : 'Taslak'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{post.views}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/blog/${post.slug}/edit`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(post.slug)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz blog yazısı bulunmuyor'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Aramayı temizle
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Yazıyı Sil</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Bu yazıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  className="rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
