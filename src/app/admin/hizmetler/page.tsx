'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Sparkles,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const logger = createLogger('admin/services');

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching services list');

      const res = await fetch('/api/services');

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      logger.info('Services fetched successfully', { count: data.length });
      setServices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmetler yüklenirken hata oluştu';
      logger.error('Failed to fetch services', { error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'services' });
      setError(errorMessage);
      toast.error('Hizmetler yüklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      logger.info('Deleting service', { serviceId: id });
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Hizmet silinirken bir hata olustu.';

        if (res.status === 404) {
          errorMessage = 'Silinecek hizmet bulunamadi.';
        } else if (res.status === 401) {
          errorMessage = 'Silme yetkiniz bulunmuyor.';
        } else if (res.status === 409) {
          errorMessage = 'Bu hizmet kullanimda oldugu icin silinemiyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      setServices(services.filter((s) => s.id !== id));
      setDeleteModal(null);
      logger.info('Service deleted successfully', { serviceId: id });
      toast.success('Hizmet silindi', 'Hizmet başarıyla silindi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      logger.error('Failed to delete service', { serviceId: id, error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-service', serviceId: id });
      toast.error('Silme başarısız', errorMessage);
    }
  };

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Hizmetler Yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchServices()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hizmetler</h1>
        <Link
          href="/admin/hizmetler/yeni"
          className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus size={18} />
          Yeni Hizmet
        </Link>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
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
            <tbody className="divide-y divide-slate-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{service.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{service.shortDesc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${service.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
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
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/hizmetler/${service.id}/edit`}
                        aria-label="Hizmeti duzenle"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(service.id)}
                        aria-label="Hizmeti sil"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400"
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

        {filteredServices.length === 0 && (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">Henüz hizmet bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
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
              className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Hizmeti Sil
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Bu hizmeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  aria-label="Iptal et"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  aria-label="Hizmeti sil"
                  className="rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors"
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
