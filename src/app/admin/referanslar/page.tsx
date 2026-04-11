'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Quote,
  Search,
  X,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  content: string;
  avatar?: string | null;
  service?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

function AvatarCell({ avatar, name }: { avatar?: string | null; name: string }) {
  const v = avatar?.trim() || '';
  const isUrl = /^https?:\/\//i.test(v) || v.startsWith('/');
  if (isUrl && v) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={v} alt={name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg dark:from-emerald-800 dark:to-emerald-700">
      {v || '👤'}
    </div>
  );
}

type SortField = 'name' | 'rating' | 'createdAt' | 'order';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'inactive';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 5,
    content: '',
    avatar: '',
    service: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/testimonials', { credentials: 'include' });
      if (!res.ok) throw new Error(`Referanslar yüklenemedi (${res.status})`);
      const data = await res.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Referanslar yüklenirken hata oluştu';
      console.error('Error fetching testimonials', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error(msg), { context: 'admin-testimonials' });
      setLoadError(msg);
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'İsim gereklidir';
    if (!formData.content.trim()) errors.content = 'Yorum içeriği gereklidir';
    if (formData.rating < 1 || formData.rating > 5) errors.rating = 'Puan 1-5 arasında olmalıdır';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = editingTestimonial
        ? {
            id: editingTestimonial.id,
            name: formData.name,
            location: formData.location.trim() || null,
            rating: formData.rating,
            content: formData.content,
            avatar: formData.avatar.trim() || null,
            service: formData.service.trim() || null,
            isActive: formData.isActive,
            order: formData.order,
          }
        : {
            name: formData.name,
            location: formData.location.trim() || null,
            rating: formData.rating,
            content: formData.content,
            avatar: formData.avatar.trim() || null,
            service: formData.service.trim() || null,
            isActive: formData.isActive,
            order: formData.order,
          };

      const res = await fetch('/api/testimonials', {
        method: editingTestimonial ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || 'Kayıt başarısız');
      }

      setIsModalOpen(false);
      setEditingTestimonial(null);
      resetForm();
      fetchTestimonials();
      toast.success('Basarili', editingTestimonial ? 'Referans guncellendi.' : 'Yeni referans eklendi.');
    } catch (error) {
      console.error('Error saving testimonial', {}, error instanceof Error ? error : undefined);
      toast.error(
        'Kaydetme hatası',
        error instanceof Error ? error.message : 'Referans kaydedilemedi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || 'Silme başarısız');
      }
      setShowDeleteConfirm(null);
      setSelectedItems((prev) => prev.filter((x) => x !== id));
      void fetchTestimonials();
      toast.success('Silindi', 'Referans kaldırıldı.');
    } catch (error) {
      console.error('Error deleting testimonial', {}, error instanceof Error ? error : undefined);
      toast.error('Silme hatası', error instanceof Error ? error.message : 'Referans silinemedi.');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.length;
    try {
      await Promise.all(
        selectedItems.map((id) =>
          fetch(`/api/testimonials/${id}`, { method: 'DELETE', credentials: 'include' })
        )
      );
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      void fetchTestimonials();
      toast.success('Silindi', `${count} referans kaldırıldı.`);
    } catch (error) {
      console.error('Error bulk deleting', {}, error instanceof Error ? error : undefined);
      toast.error('Toplu silme', 'Bazı kayıtlar silinemedi.');
    }
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const res = await fetch('/api/testimonials', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testimonial.id, isActive: !testimonial.isActive }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || 'Güncelleme başarısız');
      }
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === testimonial.id ? { ...t, isActive: !testimonial.isActive } : t
        )
      );
      toast.success(
        'Durum güncellendi',
        testimonial.isActive ? 'Referans siteden gizlendi.' : 'Referans yayında.'
      );
    } catch (error) {
      console.error('Error updating testimonial', {}, error instanceof Error ? error : undefined);
      toast.error('Güncelleme', error instanceof Error ? error.message : 'İşlem başarısız.');
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    const ids = [...selectedItems];
    try {
      await Promise.all(
        ids.map((id) =>
          fetch('/api/testimonials', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive: active }),
          })
        )
      );
      setTestimonials((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, isActive: active } : t))
      );
      setSelectedItems([]);
      toast.success('Toplu güncelleme', active ? 'Seçilenler yayında.' : 'Seçilenler gizlendi.');
    } catch (error) {
      console.error('Error bulk updating', {}, error instanceof Error ? error : undefined);
      toast.error('Toplu güncelleme', 'Bazı kayıtlar güncellenemedi.');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      rating: 5,
      content: '',
      avatar: '',
      service: '',
      isActive: true,
      order: testimonials.length,
    });
    setFormErrors({});
  };

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      location: testimonial.location ?? '',
      rating: testimonial.rating,
      content: testimonial.content,
      avatar: testimonial.avatar || '',
      service: testimonial.service || '',
      isActive: testimonial.isActive,
      order: testimonial.order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedItems(
      selectedItems.length === filteredTestimonials.length
        ? []
        : filteredTestimonials.map(t => t.id)
    );
  };

  const sortedTestimonials = [...testimonials].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'order':
        comparison = a.order - b.order;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredTestimonials = sortedTestimonials.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      (t.service && t.service.toLowerCase().includes(q)) ||
      (t.location && t.location.toLowerCase().includes(q));

    const matchesStatus =
      filterStatus === 'all' ? true :
        filterStatus === 'active' ? t.isActive : !t.isActive;

    const matchesRating = filterRating ? t.rating === filterRating : true;

    return matchesSearch && matchesStatus && matchesRating;
  });

  if (loading && testimonials.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (loadError && testimonials.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white dark:bg-slate-800 p-8">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Referanslar yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchTestimonials()}
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Müşteri Yorumları</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Web sitesinde görünen müşteri yorumlarını yönetin ve düzenleyin
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchTestimonials()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedItems.length} seçili
              </span>
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                title="Yayına Al"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                title="Gizle"
              >
                <EyeOff className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Toplu Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-colors ${showFilters ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}
          >
            <Filter className="h-4 w-4" />
            Filtreler
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingTestimonial(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-colors"
          >
            <Plus size={20} />
            Yeni Yorum
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Yorum</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{testimonials.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Quote className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {testimonials.filter(t => t.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Eye className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ortalama Puan</p>
              <p className="mt-2 text-3xl font-bold text-yellow-500">
                {testimonials.length > 0
                  ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gizli (pasif)</p>
              <p className="mt-2 text-3xl font-bold text-slate-700 dark:text-slate-200">
                {testimonials.filter((t) => !t.isActive).length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <EyeOff className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Durum</label>
                <div className="flex gap-2">
                  {(['all', 'active', 'inactive'] as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-700 border hover:bg-slate-50'
                        }`}
                    >
                      {status === 'all' ? 'Tümü' : status === 'active' ? 'Yayında' : 'Gizli'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Puan</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterRating(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterRating === null
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white dark:bg-slate-700 border hover:bg-slate-50'
                      }`}
                  >
                    Tümü
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${filterRating === rating
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white dark:bg-slate-700 border hover:bg-slate-50'
                        }`}
                    >
                      {rating} <Star className="h-3 w-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, lokasyon, hizmet veya yorum içeriği ara..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-12 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-colors ${sortField === 'name' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}
          >
            <ArrowUpDown className="h-4 w-4" />
            İsim {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-colors ${sortField === 'rating' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
              }`}
          >
            <Star className="h-4 w-4" />
            Puan {sortField === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 w-12">
                  <button
                    onClick={toggleAll}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                  >
                    {selectedItems.length === filteredTestimonials.length && filteredTestimonials.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Müşteri
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Yorum
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Puan
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Hizmet
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Durum
                </th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTestimonials.map((testimonial, index) => (
                <motion.tr
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!testimonial.isActive ? 'opacity-60' : ''
                    }`}
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelection(testimonial.id)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    >
                      {selectedItems.includes(testimonial.id) ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarCell avatar={testimonial.avatar} name={testimonial.name} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {testimonial.location?.trim() || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">
                      {testimonial.content}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {testimonial.service ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        {testimonial.service}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleActive(testimonial)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${testimonial.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      {testimonial.isActive ? (
                        <><Eye className="h-3 w-3" /> Yayında</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Gizli</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEditModal(testimonial)}
                        aria-label="Referansi duzenle"
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowDeleteConfirm(testimonial.id)}
                        aria-label="Referansi sil"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredTestimonials.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Quote className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {searchQuery ? 'Sonuç bulunamadı' : 'Henüz yorum eklenmemiş'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Arama kriterlerinize uygun yorum bulunamadı. Farklı bir arama terimi deneyin.'
              : 'Müşteri yorumlarını ekleyerek web sitenizde görüntülemeye başlayın.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingTestimonial(null);
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
            >
              <Plus className="h-5 w-5" />
              İlk Yorumu Ekle
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingTestimonial ? 'Yorumu Düzenle' : 'Yeni Yorum Ekle'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {editingTestimonial ? 'Mevcut yorumu güncelleyin' : 'Yeni bir müşteri yorumu ekleyin'}
                  </p>
                </div>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Müşteri İsmi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={`w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 transition-all ${formErrors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-200'
                        }`}
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Lokasyon <span className="text-slate-400">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700"
                      placeholder="Örn: Kadıköy, İstanbul"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Puan <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-8 w-8 ${star <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300 dark:text-slate-600'
                              }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-medium text-slate-600">
                        {formData.rating}/5
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hizmet
                    </label>
                    <input
                      type="text"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Örn: Ofis Temizliği"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Avatar (Emoji veya URL)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="👤 veya https://..."
                    />
                    <div className="flex gap-1">
                      {['👤', '👩', '👨', '👵', '👴', '🏢'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: emoji })}
                          className={`w-10 h-10 rounded-lg text-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${formData.avatar === emoji ? 'bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500' : ''
                            }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Yorum İçeriği <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({ ...formData, content: e.target.value });
                      if (formErrors.content) setFormErrors({ ...formErrors, content: '' });
                    }}
                    rows={4}
                    className={`w-full rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 transition-all ${formErrors.content
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-200'
                      }`}
                    placeholder="Müşterinin yorumunu buraya yazın..."
                  />
                  {formErrors.content ? (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.content}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      {formData.content.length} karakter
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Liste sırası
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700"
                    />
                    <p className="mt-1 text-xs text-slate-400">Küçük sayı önce gösterilir.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="isActive" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                      Yorumu yayında göster
                    </label>
                  </div>
                  <span className={`text-sm ${formData.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.isActive ? 'Yayında' : 'Gizli'}
                  </span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Kaydediliyor...</>
                    ) : (
                      <><Check className="h-5 w-5" /> {editingTestimonial ? 'Güncelle' : 'Ekle'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Yorumu Sil</h3>
                  <p className="text-sm text-slate-500">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Bu yorumu silmek istediğinize emin misiniz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Toplu Silme</h3>
                  <p className="text-sm text-slate-500">{selectedItems.length} yorum silinecek</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Seçili {selectedItems.length} yorumu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
                >
                  Toplu Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
