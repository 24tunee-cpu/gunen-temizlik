'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Trash2,
  Search,
  Download,
  Users,
  CheckCircle,
  X,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  LayoutGrid,
  List,
  Copy,
  ExternalLink,
  EyeOff,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import { formatDate } from '@/lib/utils';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
}

type SortField = 'email' | 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'inactive';

const ITEMS_PER_PAGE = 12;

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [denseView, setDenseView] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exportOpen]);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/newsletter', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Liste yüklenemedi (${res.status})`);
      }
      const data = await res.json();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Aboneler yüklenirken hata oluştu.';
      console.error('Error fetching subscribers', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error(msg), { context: 'admin-newsletter' });
      setLoadError(msg);
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscribers();
  }, [fetchSubscribers]);

  const setSubscriberActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/newsletter/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Güncellenemedi');
      }
      const body = await res.json().catch(() => null);
      const updated = body?.subscriber as Subscriber | undefined;
      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                isActive: updated?.isActive ?? isActive,
                name: updated?.name ?? s.name,
                email: updated?.email ?? s.email,
              }
            : s
        )
      );
      toast.success(isActive ? 'Abonelik aktif' : 'Abonelik pasif', updated?.email || '');
    } catch (e) {
      toast.error('Güncelleme', e instanceof Error ? e.message : 'İşlem başarısız');
    }
  }, []);

  const handleBulkActive = async (isActive: boolean) => {
    const ids = [...selectedItems];
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/newsletter/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
          }).then(async (res) => {
            if (!res.ok) throw new Error('Bazı kayıtlar güncellenemedi');
          })
        )
      );
      setSubscribers((prev) =>
        prev.map((s) => (ids.includes(s.id) ? { ...s, isActive } : s))
      );
      setSelectedItems([]);
      toast.success('Toplu güncelleme', isActive ? 'Seçilenler aktif.' : 'Seçilenler pasif.');
    } catch {
      toast.error('Toplu güncelleme', 'Bazı aboneler güncellenemedi.');
      void fetchSubscribers();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletter/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Silinemedi');
      }
      setShowDeleteConfirm(null);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setSelectedItems((prev) => prev.filter((x) => x !== id));
      toast.success('Silindi', 'Abone kaydı kaldırıldı.');
    } catch (error) {
      console.error('Error deleting subscriber', {}, error instanceof Error ? error : undefined);
      toast.error('Silme hatası', error instanceof Error ? error.message : 'Abone silinemedi.');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.length;
    const ids = [...selectedItems];
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/newsletter/${id}`, { method: 'DELETE', credentials: 'include' }).then(
            async (res) => {
              if (!res.ok) throw new Error('fail');
            }
          )
        )
      );
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      setSubscribers((prev) => prev.filter((s) => !ids.includes(s.id)));
      toast.success('Silindi', `${count} abone kaldırıldı.`);
    } catch {
      toast.error('Toplu silme', 'Bazı kayıtlar silinemedi.');
      void fetchSubscribers();
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const dataToExport =
        selectedItems.length > 0
          ? subscribers.filter((s) => selectedItems.includes(s.id))
          : filteredSubscribers;

      if (format === 'csv') {
        const rows = [
          ['E-posta', 'İsim', 'Kayıt tarihi', 'Durum'],
          ...dataToExport.map((s) => [
            s.email,
            s.name || '',
            new Date(s.createdAt).toLocaleString('tr-TR'),
            s.isActive ? 'Aktif' : 'Pasif',
          ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ebulten-aboneleri-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ebulten-aboneleri-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
      toast.success('Dışa aktarıldı', `${dataToExport.length} kayıt indirildi.`);
    } catch (error) {
      console.error('Export error', {}, error instanceof Error ? error : undefined);
      toast.error('Dışa aktarma', 'Dosya oluşturulamadı.');
    } finally {
      setIsExporting(false);
      setExportOpen(false);
    }
  };

  const copyEmails = async () => {
    const pool =
      selectedItems.length > 0
        ? subscribers.filter((s) => selectedItems.includes(s.id) && s.isActive)
        : filteredSubscribers.filter((s) => s.isActive);
    const emails = pool.map((s) => s.email).join(', ');
    if (!emails) {
      toast.error('Kopyalanamadı', 'Aktif e-posta bulunamadı.');
      return;
    }
    try {
      await navigator.clipboard.writeText(emails);
      toast.success('Panoya kopyalandı', `${pool.length} adres kopyalandı.`);
    } catch {
      toast.error('Panoya kopyalanamadı', 'Tarayıcı izni gerekli olabilir.');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sortedSubscribers = useMemo(() => {
    return [...subscribers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [subscribers, sortField, sortOrder]);

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedSubscribers.filter((s) => {
      const matchesSearch =
        !q ||
        s.email.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === 'all' ? true : filterStatus === 'active' ? s.isActive : !s.isActive;

      const fromOk = !dateRange.from || new Date(s.createdAt) >= new Date(dateRange.from);
      const toOk =
        !dateRange.to ||
        new Date(s.createdAt) <= new Date(dateRange.to + 'T23:59:59.999');

      return matchesSearch && matchesStatus && fromOk && toOk;
    });
  }, [sortedSubscribers, searchQuery, filterStatus, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, dateRange.from, dateRange.to]);

  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE) || 1;
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleAllPage = () => {
    const pageIds = paginatedSubscribers.map((s) => s.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter((s) => s.isActive).length;
    const inactive = total - active;
    const now = new Date();
    const newThisMonth = subscribers.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = subscribers.filter((s) => new Date(s.createdAt) >= weekAgo).length;
    return { total, active, inactive, newThisMonth, newThisWeek };
  }, [subscribers]);

  const filterPill = (key: FilterStatus, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilterStatus(key)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        filterStatus === key
          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
    </button>
  );

  if (loading && subscribers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (loadError && subscribers.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Aboneler yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSubscribers()}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-bülten aboneleri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Footer ve formlardan gelen kayıtlar. Toplu e-posta gönderimi için harici bir servis entegrasyonu gerekir;
            burada liste yönetimi ve dışa aktarma yapılır.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchSubscribers()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Dışa aktar
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => void handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  CSV (Excel uyumlu)
                </button>
                <button
                  type="button"
                  onClick={() => void handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  JSON
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void copyEmails()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Copy className="h-4 w-4" />
            E-postaları kopyala
          </button>
          <div className="hidden items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-600 sm:flex">
            <button
              type="button"
              aria-label="Kart görünümü"
              onClick={() => setDenseView(false)}
              className={`rounded-md p-2 ${!denseView ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-slate-500'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tablo görünümü"
              onClick={() => setDenseView(true)}
              className={`rounded-md p-2 ${denseView ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-slate-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toplam</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Aktif</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pasif</p>
              <p className="mt-2 text-3xl font-bold text-slate-700 dark:text-slate-200">{stats.inactive}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
              <EyeOff className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Bu hafta / ay</p>
              <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.newThisWeek} <span className="text-lg font-normal text-slate-400">/</span>{' '}
                {stats.newThisMonth}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
            {selectedItems.length} abone seçili
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void handleBulkActive(true)}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 shadow-sm dark:bg-emerald-900/50 dark:text-emerald-200"
          >
            Aktif yap
          </button>
          <button
            type="button"
            onClick={() => void handleBulkActive(false)}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
          >
            Pasif yap
          </button>
          <button
            type="button"
            onClick={() => setSelectedItems([])}
            className="text-sm text-emerald-800 hover:underline dark:text-emerald-300"
          >
            Temizle
          </button>
          <button
            type="button"
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Seçili sil
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="E-posta veya isim ara…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterPill('all', 'Tümü', stats.total)}
            {filterPill('active', 'Aktif', stats.active)}
            {filterPill('inactive', 'Pasif', stats.inactive)}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              Tarih
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="flex flex-wrap items-end gap-4 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Başlangıç</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Bitiş</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                {(dateRange.from || dateRange.to) && (
                  <button
                    type="button"
                    onClick={() => setDateRange({ from: '', to: '' })}
                    className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Tarihi sıfırla
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleSort('email')}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              sortField === 'email'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-slate-200 dark:border-slate-600 dark:text-slate-300'
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
            E-posta {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('createdAt')}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              sortField === 'createdAt'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-slate-200 dark:border-slate-600 dark:text-slate-300'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Tarih {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        {denseView && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <button
                      type="button"
                      onClick={toggleAllPage}
                      className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-600"
                      aria-label="Sayfadakilerin tümünü seç"
                    >
                      {paginatedSubscribers.length > 0 &&
                      paginatedSubscribers.every((s) => selectedItems.includes(s.id)) ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    E-posta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    İsim
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Kayıt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelection(subscriber.id)}
                        className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-600"
                        aria-label="Seç"
                      >
                        {selectedItems.includes(subscriber.id) ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                          <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <a
                          href={`mailto:${encodeURIComponent(subscriber.email)}`}
                          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {subscriber.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{subscriber.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(subscriber.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void setSubscriberActive(subscriber.id, !subscriber.isActive)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          subscriber.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {subscriber.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`mailto:${encodeURIComponent(subscriber.email)}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                          aria-label="E-posta gönder"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(subscriber.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
        )}

        {!denseView && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedSubscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className={`flex flex-col rounded-xl border p-4 transition-colors ${
                  selectedItems.includes(subscriber.id)
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelection(subscriber.id)}
                    className="rounded p-1 hover:bg-white/80 dark:hover:bg-slate-800"
                    aria-label="Seç"
                  >
                    {selectedItems.includes(subscriber.id) ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void setSubscriberActive(subscriber.id, !subscriber.isActive)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      subscriber.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {subscriber.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </div>
                <a
                  href={`mailto:${encodeURIComponent(subscriber.email)}`}
                  className="mt-2 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {subscriber.email}
                </a>
                <p className="text-sm text-slate-500 dark:text-slate-400">{subscriber.name || 'İsim yok'}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(subscriber.createdAt)}</p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(subscriber.id)}
                  className="mt-3 text-left text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredSubscribers.length > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1} –{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscribers.length)} / {filteredSubscribers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="h-4 w-4 dark:text-slate-400" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="h-4 w-4 dark:text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {filteredSubscribers.length === 0 && (
          <div className="py-16 text-center">
            <Mail className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400">
              {subscribers.length === 0
                ? 'Henüz abone kaydı yok.'
                : 'Filtre veya arama sonucu bulunamadı.'}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aboneyi sil</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Bu kayıt kalıcı olarak silinir.</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium dark:border-slate-600 dark:text-slate-200"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => showDeleteConfirm && void handleDelete(showDeleteConfirm)}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowBulkDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Toplu silme</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {selectedItems.length} abone silinecek. Emin misiniz?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium dark:border-slate-600 dark:text-slate-200"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkDelete()}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
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
