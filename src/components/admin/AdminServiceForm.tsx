'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Droplets,
  FileText,
  Globe,
  Home,
  type LucideIcon,
  ImageIcon,
  Layers,
  LayoutList,
  Loader2,
  Plus,
  Search,
  Sofa,
  Sparkles,
  Sun,
  Tag,
  Wind,
  Wand2,
  X,
} from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { toast } from '@/store/toastStore';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Home,
  Building2,
  Sofa,
  Droplets,
  Wind,
  Sun,
  LayoutList,
  Search,
  Tag,
};

const ICON_OPTIONS = [
  { value: 'Sparkles', label: 'Parıltı' },
  { value: 'Home', label: 'Ev' },
  { value: 'Building2', label: 'Bina' },
  { value: 'Sofa', label: 'Mobilya' },
  { value: 'Droplets', label: 'Su / Temizlik' },
  { value: 'Wind', label: 'Hava / Havalandırma' },
  { value: 'Sun', label: 'Güneş' },
  { value: 'LayoutList', label: 'Liste' },
  { value: 'Search', label: 'Arama / Detay' },
  { value: 'Tag', label: 'Etiket' },
] as const;

export type AdminServiceFormMode = 'create' | 'edit';

type FormState = {
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  image: string;
  icon: string;
  priceRange: string;
  order: number;
  isActive: boolean;
  metaTitle: string;
  metaDesc: string;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  shortDesc: '',
  description: '',
  image: '',
  icon: 'Sparkles',
  priceRange: '',
  order: 0,
  isActive: true,
  metaTitle: '',
  metaDesc: '',
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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

export function AdminServiceForm({
  mode,
  serviceId,
  pageTitle,
}: {
  mode: AdminServiceFormMode;
  serviceId?: string;
  pageTitle: string;
}) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error' | 'ready'>(
    mode === 'edit' ? 'loading' : 'ready'
  );
  const [submitting, setSubmitting] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const resolvedSlug = useMemo(() => {
    const raw = (formData.slug || generateSlug(formData.title)).trim().toLowerCase();
    return raw.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }, [formData.slug, formData.title]);

  const PreviewIcon = ICON_MAP[formData.icon] ?? Sparkles;

  useEffect(() => {
    if (mode !== 'edit' || !serviceId) return;

    let cancelled = false;

    const run = async () => {
      setLoadState('loading');
      try {
        const res = await fetch(`/api/services/${serviceId}`, { credentials: 'include' });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || `Hizmet yüklenemedi (${res.status})`);
        }
        const service = await res.json();
        if (cancelled) return;
        setFormData({
          title: service.title || '',
          slug: service.slug || '',
          shortDesc: service.shortDesc || '',
          description: service.description || '',
          image: service.image || '',
          icon: service.icon || 'Sparkles',
          priceRange: service.priceRange || '',
          order: service.order ?? 0,
          isActive: service.isActive ?? true,
          metaTitle: service.metaTitle || '',
          metaDesc: service.metaDesc || '',
        });
        setFeatures(Array.isArray(service.features) ? service.features : []);
        setLoadState('ready');
      } catch (e) {
        if (cancelled) return;
        console.error('AdminServiceForm fetch', e);
        toast.error('Yükleme hatası', e instanceof Error ? e.message : 'Hizmet bilgileri alınamadı.');
        setLoadState('error');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, serviceId]);

  const applySlugFromTitle = () => {
    const s = generateSlug(formData.title);
    setFormData((prev) => ({ ...prev, slug: s }));
    toast.success('Slug güncellendi', 'Başlıktan yeni slug üretildi.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error('Validasyon', 'Hizmet adı zorunludur.');
      return;
    }
    if (!formData.shortDesc?.trim()) {
      toast.error('Validasyon', 'Kısa açıklama zorunludur.');
      return;
    }
    if (!formData.description?.trim()) {
      toast.error('Validasyon', 'Detaylı açıklama zorunludur.');
      return;
    }

    const slug = formData.slug?.trim() ? formData.slug.trim().toLowerCase() : generateSlug(formData.title);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error('Validasyon', 'Slug sadece küçük harf, rakam ve tire içerebilir.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await fetch('/api/services', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            slug,
            features,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || 'Hizmet oluşturulamadı.');
        }
        router.push('/admin/hizmetler');
        toast.success('Kaydedildi', 'Yeni hizmet oluşturuldu.');
        return;
      }

      if (!serviceId) {
        toast.error('Hata', 'Hizmet kimliği eksik.');
        return;
      }

      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          features,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Hizmet güncellenemedi.');
      }
      router.push('/admin/hizmetler');
      toast.success('Kaydedildi', 'Hizmet güncellendi.');
    } catch (error) {
      console.error('AdminServiceForm submit', error);
      toast.error('Kayıt hatası', error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures((prev) => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Hizmet bilgileri yükleniyor…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50/50 p-8 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-center text-slate-700 dark:text-slate-300">Hizmet yüklenemedi. Oturumunuzun açık olduğundan emin olun.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Sayfayı yenile
          </button>
          <Link
            href="/admin/hizmetler"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Listeye dön
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/hizmetler"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sitedeki hizmet sayfası:{' '}
            <span className="font-mono text-emerald-600 dark:text-emerald-400">/hizmetler/{resolvedSlug || '…'}</span>
          </p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <SectionCard icon={Tag} title="Temel bilgiler" subtitle="Başlık, adres (slug) ve özet metin">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hizmet adı *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Örn: İnşaat sonrası temizlik"
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
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kısa açıklama *</label>
              <input
                type="text"
                required
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Liste ve kartlarda görünür"
              />
            </div>
            <div className="flex flex-col justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/30 md:col-span-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <PreviewIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Yayın durumu</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pasif hizmetler sitede listelenmez; admin panelden düzenlenebilir.
                  </p>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-600 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aktif</span>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={FileText} title="İçerik" subtitle="Detay metni ve madde imleri">
          <div className="grid gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Detaylı açıklama *</label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={submitting}
                className={`${inputClass} resize-y min-h-[120px]`}
                placeholder="Hizmet sayfasında gösterilecek tam metin…"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Özellikler</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="Yeni madde, Enter veya Ekle"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  disabled={submitting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  <Plus size={18} />
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      disabled={submitting}
                      aria-label="Özelliği kaldır"
                      className="ml-0.5 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ImageIcon} title="Medya ve sıra" subtitle="Kapak görseli, ikon, fiyat ve listeleme sırası">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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
                  <img
                    src={formData.image.trim()}
                    alt=""
                    className="h-40 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">İkon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                disabled={submitting}
                className={inputClass}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fiyat aralığı</label>
              <input
                type="text"
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Örn: 500₺ – 1.500₺"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Liste sırası</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                disabled={submitting}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Küçük sayı önce gösterilir.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Globe} title="SEO" subtitle="Arama sonuçları için başlık ve açıklama">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-slate-700 dark:text-slate-300">Meta başlık</label>
                <span className="text-slate-400">{formData.metaTitle.length}/70</span>
              </div>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                disabled={submitting}
                className={inputClass}
                placeholder="Boş bırakılırsa hizmet adı kullanılabilir"
                maxLength={200}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-slate-700 dark:text-slate-300">Meta açıklama</label>
                <span className="text-slate-400">{formData.metaDesc.length}/160</span>
              </div>
              <textarea
                rows={3}
                value={formData.metaDesc}
                onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                disabled={submitting}
                className={`${inputClass} resize-y`}
                placeholder="Özet cümle; arama motorlarında görünür"
                maxLength={500}
              />
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/30 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Önizleme
              </p>
              <p className="mt-1 text-base font-medium text-blue-700 dark:text-blue-400">
                {formData.metaTitle.trim() || formData.title || 'Başlık'}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {formData.metaDesc.trim() || formData.shortDesc || 'Açıklama önizlemesi burada görünür.'}
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-700 dark:text-emerald-500">
                /hizmetler/{resolvedSlug || 'slug'}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:justify-end">
          <Link
            href="/admin/hizmetler"
            className="inline-flex justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            {submitting ? 'Kaydediliyor…' : mode === 'create' ? 'Hizmeti oluştur' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
