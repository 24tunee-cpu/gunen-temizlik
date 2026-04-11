'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published: boolean;
  views: number;
  tags: string[];
  author: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'published' | 'draft';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [denseView, setDenseView] = useState(false);

  useEffect(() => {
    void fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/blog', { credentials: 'include' });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Blog yazıları yüklenirken hata oluştu';
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'blog' });
      setError(errorMessage);
      toast.error('Blog yüklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Silme başarısız (${res.status})`);
      }

      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      setDeleteModal(null);
      toast.success('Yazı silindi', 'Kayıt kalıcı olarak kaldırıldı.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-blog', slug });
      toast.error('Silme başarısız', errorMessage);
    }
  };

  const togglePublish = async (slug: string, published: boolean) => {
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Güncelleme başarısız (${res.status})`);
      }

      setPosts((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, published: !published } : p))
      );
      toast.success(
        'Durum güncellendi',
        published ? 'Yazı taslak olarak kaydedildi.' : 'Yazı yayınlandı.'
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Güncelleme başarısız';
      toast.error('Güncelleme başarısız', errorMessage);
    }
  };

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.published).length;
    return { total, published, draft: total - published };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter === 'published' && !p.published) return false;
      if (statusFilter === 'draft' && p.published) return false;
      if (!term) return true;
      const tagHit = p.tags?.some((t) => t.toLowerCase().includes(term));
      return (
        p.title.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.excerpt.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        Boolean(tagHit)
      );
    });
  }, [posts, searchTerm, statusFilter]);

  const filterPill = (key: StatusFilter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setStatusFilter(key)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        statusFilter === key
          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
    </button>
  );

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Blog yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchPosts()}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          <Loader2 className="h-4 w-4" />
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog yazıları</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Taslaklar yalnızca adminde görünür; yayınlanan yazılar sitede listelenir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchPosts()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <div className="hidden items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-600 sm:flex">
            <button
              type="button"
              aria-label="Kart görünümü"
              onClick={() => setDenseView(false)}
              className={`rounded-md p-2 ${!denseView ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tablo görünümü"
              onClick={() => setDenseView(true)}
              className={`rounded-md p-2 ${denseView ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/admin/blog/yeni"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Plus size={18} />
            Yeni yazı
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Toplam</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">Yayında</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{stats.published}</p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900/30 dark:from-amber-950/30 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/90">Taslak</p>
          <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">{stats.draft}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Başlık, slug, özet, kategori veya etiket…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterPill('all', 'Tümü', stats.total)}
            {filterPill('published', 'Yayında', stats.published)}
            {filterPill('draft', 'Taslak', stats.draft)}
          </div>
        </div>

        {!denseView && (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <motion.div
                layout
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-900/40"
              >
                <div className="relative h-32 bg-slate-200 dark:bg-slate-700">
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-950 dark:to-slate-800">
                      <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.published
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white dark:bg-amber-700'
                    }`}
                  >
                    {post.published ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="inline-flex w-fit rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {post.category}
                  </span>
                  <p className="mt-2 font-semibold text-slate-900 dark:text-white">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{post.excerpt}</p>
                  <p className="mt-2 font-mono text-xs text-slate-400 dark:text-slate-500">/{post.slug}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {post.views ?? 0}
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => void togglePublish(post.slug, post.published)}
                      className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors ${
                        post.published
                          ? 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {post.published ? 'Taslağa al' : 'Yayınla'}
                    </button>
                    <Link
                      href={`/admin/blog/${post.slug}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Düzenle
                    </Link>
                    {post.published ? (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Site
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeleteModal(post.slug)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                      aria-label="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {denseView && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Yazı
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          {post.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">{post.title}</p>
                          <p className="line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{post.excerpt}</p>
                          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void togglePublish(post.slug, post.published)}
                        className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                          post.published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60'
                        }`}
                      >
                        {post.published ? 'Yayında' : 'Taslak'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{post.views ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {post.published ? (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                            aria-label="Sitede aç"
                          >
                            <ExternalLink size={18} />
                          </a>
                        ) : null}
                        <Link
                          href={`/admin/blog/${post.slug}/edit`}
                          aria-label="Düzenle"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteModal(post.slug)}
                          aria-label="Sil"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
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
        )}

        {filteredPosts.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400">
              {posts.length === 0
                ? 'Henüz yazı yok. Yeni bir yazı ekleyerek başlayın.'
                : 'Filtre veya arama kriterlerine uyan yazı bulunamadı.'}
            </p>
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
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Yazıyı sil</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Bu yazıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal(null)}
                  aria-label="İptal"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(deleteModal)}
                  aria-label="Sil"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
