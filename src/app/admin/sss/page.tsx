'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Grid,
  List,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';

const MAX_QUESTION = 500;
const MAX_ANSWER = 2000;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const BASE_CATEGORIES = ['Genel', 'Hizmetler', 'Fiyatlandırma', 'Rezervasyon', 'Güvenlik'] as const;

type StatusFilter = 'all' | 'active' | 'inactive';

const defaultForm = (order = 0) => ({
  question: '',
  answer: '',
  category: 'Genel',
  isActive: true,
  order,
});

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm(0));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/faq', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'SSS listesi yüklenirken bir hata oluştu.';
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
      setFaqs(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'SSS listesi yüklenirken hata oluştu.';
      console.error('Error fetching FAQs', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error(msg), { context: 'admin-faq' });
      setLoadError(msg);
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFAQs();
  }, [fetchFAQs]);

  const categoryOptions = useMemo(() => {
    const fromData = new Set(faqs.map((f) => f.category).filter(Boolean));
    BASE_CATEGORIES.forEach((c) => fromData.add(c));
    return ['all', ...Array.from(fromData).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [faqs]);

  const nextDefaultOrder = useMemo(() => {
    if (faqs.length === 0) return 0;
    return Math.max(...faqs.map((f) => f.order)) + 1;
  }, [faqs]);

  const stats = useMemo(() => {
    const active = faqs.filter((f) => f.isActive).length;
    const passive = faqs.length - active;
    const n = new Date();
    const thisMonth = faqs.filter((f) => {
      const d = new Date(f.createdAt);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    return { active, passive, thisMonth };
  }, [faqs]);

  const statusCounts = useMemo(
    () => ({
      all: faqs.length,
      active: stats.active,
      inactive: stats.passive,
    }),
    [faqs.length, stats.active, stats.passive]
  );

  const filteredFAQs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && faq.isActive) ||
        (statusFilter === 'inactive' && !faq.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [faqs, searchQuery, selectedCategory, statusFilter]);

  const groupedByCategory = useMemo(() => {
    const acc: Record<string, FAQ[]> = {};
    for (const faq of filteredFAQs) {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
    }
    for (const k of Object.keys(acc)) {
      acc[k].sort((a, b) => a.order - b.order || a.question.localeCompare(b.question, 'tr'));
    }
    return acc;
  }, [filteredFAQs]);

  const sortedCategoryKeys = useMemo(
    () => Object.keys(groupedByCategory).sort((a, b) => a.localeCompare(b, 'tr')),
    [groupedByCategory]
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const q = formData.question.trim();
    const a = formData.answer.trim();
    if (!q) errors.question = 'Soru gereklidir';
    else if (q.length > MAX_QUESTION) errors.question = `Soru en fazla ${MAX_QUESTION} karakter olabilir`;
    if (!a) errors.answer = 'Cevap gereklidir';
    else if (a.length > MAX_ANSWER) errors.answer = `Cevap en fazla ${MAX_ANSWER} karakter olabilir`;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const orderNum = Number(formData.order);
    const order = Number.isFinite(orderNum) ? orderNum : 0;

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: formData.category,
      isActive: formData.isActive,
      order,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/faq', {
        method: editingFAQ ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFAQ ? { ...payload, id: editingFAQ.id } : payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'SSS kaydedilirken bir hata oluştu.';
        if (res.status === 400) {
          errorMessage = errorData?.error || 'Geçersiz veri. Alanları kontrol edin.';
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
      setEditingFAQ(null);
      setFormData(defaultForm(nextDefaultOrder));
      setFormErrors({});
      void fetchFAQs();
      toast.success('Başarılı', editingFAQ ? 'SSS güncellendi.' : 'Yeni SSS eklendi.');
    } catch (error) {
      console.error('Error saving FAQ', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'SSS kaydedilirken bir hata oluştu.';
      toast.error('Kaydetme hatası', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'SSS silinirken bir hata oluştu.';
        if (res.status === 404) {
          errorMessage = 'Silinecek kayıt bulunamadı.';
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
      void fetchFAQs();
      toast.success('Silindi', 'SSS kaldırıldı.');
    } catch (error) {
      console.error('Error deleting FAQ', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'SSS silinirken bir hata oluştu.';
      toast.error('Silme hatası', errorMsg);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    setTogglingId(faq.id);
    try {
      const res = await fetch('/api/faq', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `İşlem başarısız (${res.status})`);
      }
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, isActive: !f.isActive } : f))
      );
      toast.success(
        faq.isActive ? 'Taslak yapıldı' : 'Yayında',
        faq.isActive ? 'Soru sitede gizlendi.' : 'Soru sitede gösteriliyor.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi';
      toast.error('Güncelleme', msg);
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingFAQ(null);
    setFormData(defaultForm(nextDefaultOrder));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
      order: faq.order,
    });
    setFormErrors({});
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

  if (loading && faqs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (loadError && faqs.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">SSS yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchFAQs()}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sıkça sorulan sorular</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            SSS sayfasındaki soruları yönetin; taslaklar yalnızca yöneticilere listelenir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchFAQs()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <Link
            href="/sss"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Site SSS
          </Link>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white shadow-sm dark:bg-slate-700'
                  : 'hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Kategoriye göre"
              aria-label="Kategoriye göre görünüm"
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
              title="Liste"
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
            Yeni soru
          </motion.button>
        </div>
      </div>

      {loadError && faqs.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">Son yenilemede hata: {loadError}</span>
          <button
            type="button"
            onClick={() => void fetchFAQs()}
            className="font-medium text-amber-800 underline hover:no-underline dark:text-amber-200"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam soru</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{faqs.length}</p>
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
            placeholder="Soru, cevap veya kategori ara..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">Tüm kategoriler</option>
          {categoryOptions
            .filter((c) => c !== 'all')
            .map((cat) => (
              <option key={cat} value={cat} className="dark:bg-slate-800">
                {cat}
              </option>
            ))}
        </select>
      </div>

      {viewMode === 'grouped' ? (
        <div className="space-y-6">
          {sortedCategoryKeys.map((category) => {
            const categoryFaqs = groupedByCategory[category];
            return (
              <div
                key={category}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="border-b bg-slate-50 px-6 py-4 dark:border-slate-600 dark:bg-slate-700/50">
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200">{category}</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{categoryFaqs.length} soru</span>
                </div>
                <div className="divide-y dark:divide-slate-700">
                  {categoryFaqs.map((faq) => (
                    <div key={faq.id} className={`p-6 ${!faq.isActive ? 'opacity-70' : ''}`}>
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                          className="mt-1 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                          aria-expanded={expandedId === faq.id}
                        >
                          {expandedId === faq.id ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-slate-100">{faq.question}</h4>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Sıra: {faq.order}
                                {!faq.isActive && (
                                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
                                    Taslak
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void handleToggleActive(faq)}
                                disabled={togglingId === faq.id}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
                                title={faq.isActive ? 'Taslak yap' : 'Yayınla'}
                                aria-label={faq.isActive ? 'Taslak yap' : 'Yayınla'}
                              >
                                {togglingId === faq.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : faq.isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(faq)}
                                aria-label="Düzenle"
                                className="p-2 text-slate-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(faq.id)}
                                aria-label="Sil"
                                className="p-2 text-slate-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedId === faq.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 whitespace-pre-wrap text-slate-600 dark:text-slate-300"
                              >
                                {faq.answer}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Soru</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Kategori</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Sıra</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Durum</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold dark:text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {[...filteredFAQs]
                  .sort(
                    (a, b) =>
                      a.category.localeCompare(b.category, 'tr') ||
                      a.order - b.order ||
                      a.question.localeCompare(b.question, 'tr')
                  )
                  .map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="max-w-md px-4 py-4">
                        <p className="line-clamp-2 font-medium dark:text-slate-100">{faq.question}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{faq.category}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-600 dark:text-slate-400">{faq.order}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            faq.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {faq.isActive ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(faq)}
                            disabled={togglingId === faq.id}
                            className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
                            aria-label={faq.isActive ? 'Taslak yap' : 'Yayınla'}
                          >
                            {togglingId === faq.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : faq.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(faq)}
                            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            aria-label="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(faq.id)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            aria-label="Sil"
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

      {filteredFAQs.length === 0 && (
        <div className="py-16 text-center">
          <HelpCircle className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">
            {faqs.length === 0 ? 'Henüz soru eklenmemiş' : 'Sonuç bulunamadı'}
          </h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {faqs.length === 0
              ? 'İlk soruyu ekleyerek SSS sayfasını doldurun.'
              : 'Filtreleri veya aramayı değiştirmeyi deneyin.'}
          </p>
          {faqs.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              İlk soruyu ekle
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
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingFAQ ? 'Soruyu düzenle' : 'Yeni soru ekle'}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      {categoryOptions
                        .filter((c) => c !== 'all')
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
                      min={0}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Aynı kategoride küçük sıra önce gelir.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm font-medium dark:text-slate-300">Soru</label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formData.question.length}/{MAX_QUESTION}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => {
                      setFormData({ ...formData, question: e.target.value });
                      if (formErrors.question) setFormErrors({ ...formErrors, question: '' });
                    }}
                    className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 ${
                      formErrors.question ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    placeholder="Soruyu yazın..."
                    maxLength={MAX_QUESTION}
                  />
                  {formErrors.question && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" /> {formErrors.question}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm font-medium dark:text-slate-300">Cevap</label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formData.answer.length}/{MAX_ANSWER}
                    </span>
                  </div>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => {
                      setFormData({ ...formData, answer: e.target.value });
                      if (formErrors.answer) setFormErrors({ ...formErrors, answer: '' });
                    }}
                    rows={6}
                    maxLength={MAX_ANSWER}
                    className={`w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 ${
                      formErrors.answer ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    placeholder="Cevabı yazın..."
                  />
                  {formErrors.answer && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" /> {formErrors.answer}
                    </p>
                  )}
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
                    className="flex-1 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" /> {editingFAQ ? 'Güncelle' : 'Ekle'}
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
              <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">Soruyu sil</h3>
              <p className="mb-6 text-slate-500 dark:text-slate-400">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-300 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => showDeleteConfirm && void handleDelete(showDeleteConfirm)}
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
