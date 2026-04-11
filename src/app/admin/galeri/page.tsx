'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  Grid,
  List,
  ExternalLink,
  Upload,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';

interface GalleryItem {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const BASE_CATEGORIES = [
  'Temizlik Öncesi/Sonrası',
  'Ofis',
  'Ev',
  'Endüstriyel',
  'Diğer',
] as const;

type StatusFilter = 'all' | 'active' | 'inactive';

const defaultForm = () => ({
  title: '',
  description: '',
  image: '',
  category: 'Temizlik Öncesi/Sonrası' as string,
  isActive: true,
  order: 0,
});

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/gallery', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Galeri yüklenirken bir hata oluştu.';
        if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lütfen giriş yapın.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Galeri yüklenirken hata oluştu.';
      console.error('Error fetching gallery', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error(msg), { context: 'admin-gallery' });
      setLoadError(msg);
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const categoryOptions = useMemo(() => {
    const fromData = new Set(items.map((i) => i.category).filter(Boolean));
    BASE_CATEGORIES.forEach((c) => fromData.add(c));
    return ['Tümü', ...Array.from(fromData).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [items]);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.isActive).length;
    const passive = items.length - active;
    const n = new Date();
    const thisMonth = items.filter((i) => {
      const d = new Date(i.createdAt);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    return { active, passive, thisMonth };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'Tümü' || item.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: items.length,
      active: stats.active,
      inactive: stats.passive,
    }),
    [items.length, stats.active, stats.passive]
  );

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });
      if (res.ok) {
        const { url } = await res.json();
        setFormData((prev) => ({ ...prev, image: url }));
        toast.success('Yükleme başarılı', 'Görsel başarıyla yüklendi.');
      } else {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || 'Görsel yüklenirken bir hata oluştu.';
        toast.error('Yükleme hatası', errorMessage);
      }
    } catch (error) {
      console.error('Upload error', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error('upload'), { context: 'admin-gallery-upload' });
      toast.error('Yükleme hatası', 'Görsel yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image?.trim()) {
      toast.error('Doğrulama', 'Lütfen bir görsel URL’si girin veya dosya yükleyin.');
      return;
    }
    if (!formData.title?.trim()) {
      toast.error('Doğrulama', 'Başlık alanı zorunludur.');
      return;
    }
    if (!formData.category) {
      toast.error('Doğrulama', 'Kategori seçimi zorunludur.');
      return;
    }

    const orderNum = Number(formData.order);
    const order = Number.isFinite(orderNum) ? orderNum : 0;

    setIsSubmitting(true);
    try {
      const payload = editingItem
        ? {
            id: editingItem.id,
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            image: formData.image.trim(),
            category: formData.category,
            isActive: formData.isActive,
            order,
          }
        : {
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            image: formData.image.trim(),
            category: formData.category,
            isActive: formData.isActive,
            order,
          };

      const res = await fetch('/api/gallery', {
        method: editingItem ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Görsel kaydedilirken bir hata oluştu.';
        if (res.status === 400) {
          errorMessage = errorData?.error || 'Geçersiz veri. Lütfen alanları kontrol edin.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lütfen giriş yapın.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData(defaultForm());
      void fetchItems();
      toast.success('Başarılı', editingItem ? 'Görsel güncellendi.' : 'Yeni görsel eklendi.');
    } catch (error) {
      console.error('Error saving gallery item', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Görsel kaydedilirken bir hata oluştu.';
      toast.error('Kaydetme hatası', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Görsel silinirken bir hata oluştu.';
        if (res.status === 404) {
          errorMessage = 'Silinecek görsel bulunamadı.';
        } else if (res.status === 401) {
          errorMessage = 'Silme yetkiniz bulunmuyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }
      setShowDeleteConfirm(null);
      void fetchItems();
      toast.success('Silindi', 'Görsel başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting gallery item', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Görsel silinirken bir hata oluştu.';
      toast.error('Silme hatası', errorMsg);
    }
  };

  const toggleActive = async (item: GalleryItem) => {
    setTogglingId(item.id);
    try {
      const res = await fetch('/api/gallery', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `İşlem başarısız (${res.status})`);
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      );
      toast.success(item.isActive ? 'Taslak yapıldı' : 'Yayında', item.isActive ? 'Görsel siteden gizlendi.' : 'Görsel sitede gösteriliyor.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi';
      toast.error('Güncelleme', msg);
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description ?? '',
      image: item.image,
      category: item.category,
      isActive: item.isActive,
      order: item.order ?? 0,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(defaultForm());
    setIsModalOpen(true);
  };

  const statusPill = (key: StatusFilter, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setStatusFilter(key)}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        statusFilter === key
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-80">({statusCounts[key]})</span>
    </button>
  );

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Galeri yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchItems()}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          <Loader2 className="h-4 w-4" />
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Galeri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sitedeki galeri görsellerini yönetin; taslak öğeler yalnızca yöneticilere listelenir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchItems()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <Link
            href="/galeri"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Site galerisi
          </Link>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm dark:bg-slate-700'
                  : 'hover:bg-white dark:hover:bg-slate-700'
              }`}
              aria-label="Izgara görünümü"
            >
              <Grid className="h-4 w-4 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm dark:bg-slate-700'
                  : 'hover:bg-white dark:hover:bg-slate-700'
              }`}
              aria-label="Liste görünümü"
            >
              <List className="h-4 w-4 dark:text-slate-300" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Yeni görsel
          </motion.button>
        </div>
      </div>

      {loadError && items.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">Son yenilemede hata: {loadError}</span>
          <button
            type="button"
            onClick={() => void fetchItems()}
            className="font-medium text-amber-800 underline hover:no-underline dark:text-amber-200"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam görsel</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{items.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Taslak</p>
          <p className="mt-2 text-3xl font-bold text-slate-600 dark:text-slate-300">{stats.passive}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Bu ay eklenen</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusPill('all', 'Tümü')}
        {statusPill('active', 'Yayında')}
        {statusPill('inactive', 'Taslak')}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Başlık, açıklama veya kategoriye göre ara..."
            className="w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat} className="dark:bg-slate-800">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
                !item.isActive ? 'opacity-75' : ''
              }`}
            >
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element -- harici ve göreli URL'ler */}
                <img src={item.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    aria-label="Görseli düzenle"
                    className="rounded-full bg-white p-3 text-slate-700 transition-colors hover:bg-emerald-50"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(item.id)}
                    aria-label="Görseli sil"
                    className="rounded-full bg-white p-3 text-slate-700 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {!item.isActive && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/75 px-2 py-1 text-xs text-white">
                    Taslak
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void toggleActive(item)}
                  disabled={togglingId === item.id}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/90 dark:text-slate-200"
                  title={item.isActive ? 'Taslak yap' : 'Yayınla'}
                >
                  {togglingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : item.isActive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="p-4">
                <h3 className="truncate font-medium dark:text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Görsel</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Başlık</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Kategori</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Sıra</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Durum</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold dark:text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium dark:text-slate-100">{item.title}</p>
                      {item.description && (
                        <p className="line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-600 dark:text-slate-400">{item.order}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {item.isActive ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleActive(item)}
                          disabled={togglingId === item.id}
                          className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
                          title={item.isActive ? 'Taslak yap' : 'Yayınla'}
                          aria-label={item.isActive ? 'Taslak yap' : 'Yayınla'}
                        >
                          {togglingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : item.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          aria-label="Düzenle"
                          className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(item.id)}
                          aria-label="Sil"
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="py-16 text-center">
          <ImageIcon className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">
            {items.length === 0 ? 'Henüz görsel eklenmemiş' : 'Sonuç bulunamadı'}
          </h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {items.length === 0
              ? 'İlk görseli ekleyerek galeriyi doldurun.'
              : 'Filtreleri veya aramayı değiştirmeyi deneyin.'}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              İlk görseli ekle
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingItem ? 'Görseli düzenle' : 'Yeni görsel ekle'}
                </h2>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="disabled:opacity-50"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">Görsel URL</label>
                  <input
                    type="text"
                    inputMode="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... veya /uploads/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Harici adres veya sitedeki göreli yol. İsterseniz aşağıdan dosya yükleyin.
                  </p>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium dark:text-slate-300">Dosya yükle</span>
                  <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
                    {formData.image ? (
                      <div className="relative mx-auto mb-4 h-48 w-full max-w-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.image} alt="" className="mx-auto max-h-48 object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                          aria-label="Görseli kaldır"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mb-4 flex h-32 items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && void handleImageUpload(e.target.files[0])}
                      className="hidden"
                      id="gallery-upload"
                    />
                    <label
                      htmlFor="gallery-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" /> Görsel seç
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">Başlık</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Görsel başlığı..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Kısa açıklama..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      {categoryOptions
                        .filter((c) => c !== 'Tümü')
                        .map((cat) => (
                          <option key={cat} value={cat} className="dark:bg-slate-700">
                            {cat}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Sıra</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      min={0}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Küçük sayı önce gösterilir.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:border-emerald-500 dark:checked:bg-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium dark:text-slate-300">
                    Sitede yayında göster
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.image?.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" /> {editingItem ? 'Güncelle' : 'Ekle'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">Görseli sil</h3>
              <p className="mb-6 text-slate-500 dark:text-slate-400">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  aria-label="İptal"
                  className="flex-1 rounded-xl border border-slate-300 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => showDeleteConfirm && void handleDelete(showDeleteConfirm)}
                  aria-label="Sil"
                  className="flex-1 rounded-xl bg-red-500 py-2 font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
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
