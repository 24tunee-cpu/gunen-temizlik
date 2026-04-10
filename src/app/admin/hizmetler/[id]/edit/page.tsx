'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';
import { toast } from '@/store/toastStore';

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  image: string;
  icon: string;
  priceRange: string;
  features: string[];
  order: number;
  isActive: boolean;
  metaTitle: string;
  metaDesc: string;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        const service: Service = await res.json();
        setFormData({
          title: service.title || '',
          slug: service.slug || '',
          shortDesc: service.shortDesc || '',
          description: service.description || '',
          image: service.image || '',
          icon: service.icon || 'Sparkles',
          priceRange: service.priceRange || '',
          order: service.order || 0,
          isActive: service.isActive ?? true,
          metaTitle: service.metaTitle || '',
          metaDesc: service.metaDesc || '',
        });
        setFeatures(service.features || []);
      } catch (error) {
        console.error('Error fetching service', {}, error instanceof Error ? error : undefined);
        toast.error('Yukleme Hatasi', 'Hizmet bilgileri yuklenirken bir hata olustu.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Validasyon Hatasi', 'Hizmet adi zorunludur.');
      return;
    }
    if (!formData.shortDesc || formData.shortDesc.trim() === '') {
      toast.error('Validasyon Hatasi', 'Kisa aciklama zorunludur.');
      return;
    }
    if (!formData.description || formData.description.trim() === '') {
      toast.error('Validasyon Hatasi', 'Detayli aciklama zorunludur.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features,
        }),
      });

      if (res.ok) {
        router.push('/admin/hizmetler');
        toast.success('Basarili', 'Hizmet basariyla guncellendi.');
      } else {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Hizmet guncellenirken bir hata olustu.';

        if (res.status === 400) {
          errorMessage = errorData?.error || 'Gecersiz veri formati. Lutfen alanlari kontrol edin.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lutfen giris yapin.';
        } else if (res.status === 404) {
          errorMessage = 'Guncellenecek hizmet bulunamadi.';
        } else if (res.status === 409) {
          errorMessage = 'Bu slug veya baslikta baska bir hizmet zaten mevcut.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating service', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Hizmet guncellenirken bir hata olustu.';
      toast.error('Guncelleme Hatasi', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/hizmetler"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hizmeti Düzenle</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm dark:border dark:border-slate-700"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hizmet Adı *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              URL Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Kısa Açıklama *
            </label>
            <input
              type="text"
              required
              value={formData.shortDesc}
              onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Fiyat Aralığı
            </label>
            <input
              type="text"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Detaylı Açıklama *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors resize-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Özellikler
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                disabled={saving}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
                placeholder="Yeni özellik ekle"
              />
              <button
                type="button"
                onClick={addFeature}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                <Plus size={18} />
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-400"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    disabled={saving}
                    aria-label="Ozellik sil"
                    className="ml-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 disabled:opacity-50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Görsel URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sıra
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Meta Title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Meta Description
            </label>
            <input
              type="text"
              value={formData.metaDesc}
              onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={saving}
              className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
              Aktif
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href="/admin/hizmetler"
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            İptal
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
