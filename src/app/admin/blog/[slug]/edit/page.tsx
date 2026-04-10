'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import logger from '@/lib/logger';
import { toast } from '@/store/toastStore';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  tags: string[];
  published: boolean;
  metaTitle: string;
  metaDesc: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    image: '',
    author: 'Gunen Temizlik',
    published: false,
    metaTitle: '',
    metaDesc: '',
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        const post: BlogPost = await res.json();
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || '',
          image: post.image || '',
          author: post.author || 'Gunen Temizlik',
          published: post.published ?? false,
          metaTitle: post.metaTitle || '',
          metaDesc: post.metaDesc || '',
        });
        setTags(post.tags || []);
      } catch (error) {
        logger.error('Error fetching blog post', {}, error instanceof Error ? error : undefined);
        toast.error('Yukleme Hatasi', 'Blog yazisi bilgileri yuklenirken bir hata olustu.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.title.trim()) {
      toast.error('Validasyon Hatasi', 'Baslik alani zorunludur.');
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error('Validasyon Hatasi', 'Ozet alani zorunludur.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Validasyon Hatasi', 'Icerik alani zorunludur.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
        }),
      });

      if (res.ok) {
        router.push('/admin/blog');
        toast.success('Basarili', 'Blog yazisi basariyla guncellendi.');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        toast.error('Guncelleme Hatasi', errorData.error || 'Blog yazisi guncellenirken bir hata olustu.');
      }
    } catch (error) {
      logger.error('Error updating blog post', {}, error instanceof Error ? error : undefined);
      toast.error('Guncelleme Hatasi', 'Blog yazisi guncellenirken bir hata olustu.');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-emerald-500/30 dark:border-t-emerald-500/30"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Blog Yazisi Duzenle</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm dark:shadow-slate-900/50"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Baslik *</label>
            <input
              type="text"
              required
              disabled={saving}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL Slug</label>
            <input
              type="text"
              disabled={saving}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</label>
            <input
              type="text"
              disabled={saving}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yazar</label>
            <input
              type="text"
              disabled={saving}
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ozet *</label>
            <input
              type="text"
              required
              disabled={saving}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Icerik *</label>
            <textarea
              required
              disabled={saving}
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Etiketler</label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={saving}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Yeni etiket ekle"
              />
              <button
                type="button"
                disabled={saving}
                onClick={addTag}
                className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-300">
                  {tag}
                  <button type="button" disabled={saving} onClick={() => removeTag(index)} className="ml-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 disabled:opacity-50 transition-colors">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gorsel URL</label>
            <input
              type="url"
              disabled={saving}
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meta Title</label>
            <input
              type="text"
              disabled={saving}
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meta Description</label>
            <input
              type="text"
              disabled={saving}
              value={formData.metaDesc}
              onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="published" className="text-sm text-slate-700 dark:text-slate-300">Yayinla</label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link href="/admin/blog" className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Iptal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
