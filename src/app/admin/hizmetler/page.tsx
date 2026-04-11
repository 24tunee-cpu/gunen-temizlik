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
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  LayoutGrid,
  List,
  Building2,
  Home,
  Sofa,
  Droplets,
  Wind,
  Sun,
  LayoutList,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Home,
  Building2,
  Sofa,
  Droplets,
  Wind,
  Sun,
  LayoutList,
  Search: Search,
  Tag,
};

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  image: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

function ServiceRowIcon({ icon }: { icon: string | null }) {
  const I = (icon && ICON_MAP[icon]) || Sparkles;
  return <I className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [denseView, setDenseView] = useState(false);

  useEffect(() => {
    void fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/services', { credentials: 'include' });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      setServices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmetler yüklenirken hata oluştu';
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'services' });
      setError(errorMessage);
      toast.error('Hizmetler yüklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE', credentials: 'include' });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Hizmet silinirken bir hata oluştu.';

        if (res.status === 404) {
          errorMessage = 'Silinecek hizmet bulunamadı.';
        } else if (res.status === 401) {
          errorMessage = 'Silme yetkiniz bulunmuyor.';
        } else if (res.status === 409) {
          errorMessage = 'Bu hizmet kullanımda olduğu için silinemiyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      setDeleteModal(null);
      toast.success('Hizmet silindi', 'Kayıt kalıcı olarak kaldırıldı.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-service', serviceId: id });
      toast.error('Silme başarısız', errorMessage);
    }
  };

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.isActive).length;
    return { total, active, inactive: total - active };
  }, [services]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return services.filter((s) => {
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      if (!term) return true;
      return (
        s.title.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        s.shortDesc.toLowerCase().includes(term)
      );
    });
  }, [services, searchTerm, statusFilter]);

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

  if (loading && services.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
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

  if (error && services.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Hizmetler yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchServices()}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hizmetler</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sitede listelenen hizmetleri yönetin; pasif kayıtlar ziyaretçilere gösterilmez.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchServices()}
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
          <Link
            href="/admin/hizmetler/yeni"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Plus size={18} />
            Yeni hizmet
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Toplam</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">Aktif</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pasif</p>
          <p className="mt-1 text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.inactive}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Başlık, slug veya açıklamada ara…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterPill('all', 'Tümü', stats.total)}
            {filterPill('active', 'Aktif', stats.active)}
            {filterPill('inactive', 'Pasif', stats.inactive)}
          </div>
        </div>

        {!denseView && (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-900/40"
              >
                <div className="relative h-28 overflow-hidden rounded-t-xl bg-slate-200 dark:bg-slate-700">
                  {service.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950 dark:to-slate-800">
                      <ServiceRowIcon icon={service.icon} />
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      service.isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800/80 text-white dark:bg-slate-950/90'
                    }`}
                  >
                    {service.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800">
                      <ServiceRowIcon icon={service.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{service.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{service.shortDesc}</p>
                      <p className="mt-2 font-mono text-xs text-slate-400 dark:text-slate-500">/{service.slug}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    <span>Sıra: {service.order}</span>
                    <span>·</span>
                    <span>{formatDate(service.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/hizmetler/${service.id}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <Edit className="h-4 w-4" />
                      Düzenle
                    </Link>
                    {service.isActive ? (
                      <a
                        href={`/hizmetler/${service.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Site
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeleteModal(service.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
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
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Hizmet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Sıra
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
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                          {service.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={service.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ServiceRowIcon icon={service.icon} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">{service.title}</p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{service.shortDesc}</p>
                          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">/{service.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          service.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {service.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{service.order}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(service.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {service.isActive ? (
                          <a
                            href={`/hizmetler/${service.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                            aria-label="Sitede aç"
                          >
                            <ExternalLink size={18} />
                          </a>
                        ) : null}
                        <Link
                          href={`/admin/hizmetler/${service.id}/edit`}
                          aria-label="Düzenle"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteModal(service.id)}
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

        {filteredServices.length === 0 && (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400">
              {services.length === 0
                ? 'Henüz hizmet yok. Yeni bir kayıt ekleyerek başlayın.'
                : 'Filtre veya arama kriterlerine uyan hizmet bulunamadı.'}
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hizmeti sil</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Bu hizmeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
