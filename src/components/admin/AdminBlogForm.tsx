'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Globe,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Wand2,
  X,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { generateSlug, toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/utils';
import { toast } from '@/store/toastStore';

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  published: boolean;
  metaTitle: string;
  metaDesc: string;
  /** `datetime-local` input değeri; boş = zamanlama yok */
  scheduledPublishAt: string;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  image: '',
  author: 'Günen Temizlik',
  published: false,
  metaTitle: '',
  metaDesc: '',
  scheduledPublishAt: '',
};

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/50">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AdminBlogForm({
  mode,
  routeSlug,
  pageTitle,
}: {
  mode: 'create' | 'edit';
  routeSlug?: string;
  pageTitle: string;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error' | 'ready'>(
    mode === 'edit' ? 'loading' : 'ready'
  );
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const resolvedSlug = useMemo(() => {
    const raw = (formData.slug || generateSlug(formData.title)).trim().toLowerCase();
    return raw.replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }, [formData.slug, formData.title]);

  useEffect(() => {
    if (mode !== 'edit' || !routeSlug) return;

    let cancelled = false;

    const run = async () => {
      setLoadState('loading');
      try {
        const res = await fetch(`/api/blog/${encodeURIComponent(routeSlug)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `Yazı yüklenemedi (${res.status})`);
        }
        const post = await res.json();
        if (cancelled) return;
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          category: post.category || '',
          image: post.image || '',
          author: post.author || 'Günen Temizlik',
          published: post.published ?? false,
          metaTitle: typeof post.metaTitle === 'string' ? post.metaTitle.trim() : '',
          metaDesc: typeof post.metaDesc === 'string' ? post.metaDesc.trim() : '',
          scheduledPublishAt: toDatetimeLocalValue(
            post.scheduledPublishAt != null ? String(post.scheduledPublishAt) : ''
          ),
        });
        setTags(Array.isArray(post.tags) ? post.tags : []);
        setLoadState('ready');
      } catch (e) {
        if (cancelled) return;
        console.error('AdminBlogForm fetch', e);
        toast.error('Yükleme hatası', e instanceof Error ? e.message : 'Blog yazısı alınamadı.');
        setLoadState('error');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, routeSlug]);

  const applySlugFromTitle = () => {
    const s = generateSlug(formData.title);
    setFormData((prev) => ({ ...prev, slug: s }));
    toast.success('Slug güncellendi', 'Başlıktan yeni slug üretildi.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Validasyon', 'Başlık zorunludur.');
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error('Validasyon', 'Özet zorunludur.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Validasyon', 'İçerik zorunludur.');
      return;
    }

    const slug =
      formData.slug?.trim() ? formData.slug.trim().toLowerCase() : generateSlug(formData.title);
    if (!/^[a-z0-9-_]+$/.test(slug)) {
      toast.error('Validasyon', 'Slug sadece küçük harf, rakam, tire ve alt çizgi içerebilir.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const scheduledIso = fromDatetimeLocalValue(formData.scheduledPublishAt);
        const res = await fetch('/api/blog', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            slug,
            category: formData.category.trim() || 'Genel',
            tags,
            scheduledPublishAt: scheduledIso,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Blog yazısı oluşturulamadı.');
        }
        router.push('/admin/blog');
        toast.success('Kaydedildi', 'Yeni yazı oluşturuldu.');
        return;
      }

      if (!routeSlug) {
        toast.error('Hata', 'Adres (slug) eksik.');
        return;
      }

      const scheduledIso = fromDatetimeLocalValue(formData.scheduledPublishAt);
      const res = await fetch(`/api/blog/${encodeURIComponent(routeSlug)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          category: formData.category.trim() || 'Genel',
          tags,
          scheduledPublishAt: scheduledIso,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Blog yazısı güncellenemedi.');
      }
      router.push('/admin/blog');
      toast.success('Kaydedildi', 'Yazı güncellendi.');
    } catch (err) {
      console.error('AdminBlogForm submit', err);
      toast.error('Kayıt hatası', err instanceof Error ? err.message : 'İşlem tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Yazı yükleniyor…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50/50 p-8 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-center text-slate-700 dark:text-slate-300">
          Yazı yüklenemedi. Oturumunuzun açık olduğundan emin olun.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Sayfayı yenile
          </button>
          <Link
            href="/admin/blog"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Listeye dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/blog"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Canlı adres:{' '}
            <span className="font-mono text-blue-600 dark:text-blue-400">/blog/{resolvedSlug || '…'}</span>
            {!formData.published ? (
              <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                Taslak — sitede listelenmez
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <SectionCard icon={BookOpen} title="Temel bilgiler" subtitle="Başlık, adres ve yayın durumu">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Başlık *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Blog yazısı başlığı"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL slug</label>
                <button
                  type="button"
                  onClick={applySlugFromTitle}
                  disabled={submitting || !formData.title.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Başlıktan üret
                </button>
              </div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="otomatik veya elle"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Örn: Temizlik ipuçları"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yazar</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                disabled={submitting}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/30 md:col-span-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Yayınlandığında blog listesinde ve arama motorlarında görünür.
              </p>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-600 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Yayınla</span>
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                Zamanlanmış yayın (isteğe bağlı)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="datetime-local"
                  value={formData.scheduledPublishAt}
                  onChange={(e) => setFormData({ ...formData, scheduledPublishAt: e.target.value })}
                  disabled={submitting}
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={submitting || !formData.scheduledPublishAt}
                  onClick={() => setFormData({ ...formData, scheduledPublishAt: '' })}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Temizle
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tarih geldiğinde cron görevi yazıyı otomatik yayınlar (yayın kutusu kapalı olsa bile). Boş bırakırsanız
                yalnızca elle yayınlarsınız.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={FileText} title="İçerik" subtitle="Özet, gövde metni ve etiketler">
          <div className="grid gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Özet *</label>
              <textarea
                required
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                disabled={submitting}
                className={`${inputClass} resize-y`}
                placeholder="Liste ve ön izlemelerde görünür"
                maxLength={500}
              />
              <p className="text-xs text-slate-400">{formData.excerpt.length}/500</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İçerik *</label>
              <textarea
                required
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={submitting}
                className={`${inputClass} resize-y min-h-[200px] font-mono text-sm`}
                placeholder="Yazı gövdesi (düz metin / HTML kullanımınız varsa aynen yapıştırın)"
              />
              <p className="text-xs text-slate-400">{formData.content.length} karakter</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Etiketler</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="Etiket, Enter veya Ekle"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={submitting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  <Plus size={18} />
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-900 dark:bg-blue-900/40 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      disabled={submitting}
                      aria-label="Etiketi kaldır"
                      className="text-blue-800 hover:text-blue-950 dark:text-blue-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ImageIcon} title="Kapak görseli" subtitle="Liste ve paylaşım kartlarında kullanılır">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Görsel URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              disabled={submitting}
              className={inputClass}
              placeholder="https://…"
            />
            {formData.image.trim() ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image.trim()}
                  alt=""
                  className="max-h-52 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard icon={Globe} title="SEO" subtitle="Arama ve sosyal önizleme">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-slate-700 dark:text-slate-300">Meta başlık</label>
                <span className="text-slate-400">{formData.metaTitle.length}/200</span>
              </div>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Boş bırakılırsa başlıktan türetilir"
                maxLength={200}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-slate-700 dark:text-slate-300">Meta açıklama</label>
                <span className="text-slate-400">{formData.metaDesc.length}/300</span>
              </div>
              <textarea
                rows={3}
                value={formData.metaDesc}
                onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                disabled={submitting}
                className={`${inputClass} resize-y`}
                placeholder="Arama sonuçlarında kısa açıklama"
                maxLength={300}
              />
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/30 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Önizleme
              </p>
              <p className="mt-1 text-base font-medium text-blue-700 dark:text-blue-400">
                {formData.metaTitle.trim() || formData.title || 'Başlık'}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
                {formData.metaDesc.trim() || formData.excerpt || 'Açıklama önizlemesi.'}
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-700 dark:text-emerald-500">/blog/{resolvedSlug || 'slug'}</p>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:justify-end">
          <Link
            href="/admin/blog"
            className="inline-flex justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? 'Kaydediliyor…' : mode === 'create' ? 'Yazıyı oluştur' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
