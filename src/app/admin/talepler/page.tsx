'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  Search,
  Mail,
  Phone,
  Trash2,
  Check,
  X,
  User,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const logger = createLogger('admin/contact');

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('Fetching contact requests');

      const res = await fetch('/api/contact');

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Talepler yuklenirken bir hata olustu.';

        if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lutfen giris yapin.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();
      logger.info('Contact requests fetched successfully', {
        count: data.length,
        unread: data.filter((r: ContactRequest) => !r.read).length
      });
      setRequests(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Talepler yuklenirken hata olustu.';
      logger.error('Failed to fetch contact requests', { error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'contact-requests' });
      setError(errorMessage);
      toast.error('Talepler yuklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      logger.info('Marking request as read', { requestId: id });
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Islem basarisiz.';

        if (res.status === 404) {
          errorMessage = 'Talep bulunamadi.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      setRequests(requests.map((r) => (r.id === id ? { ...r, read: true } : r)));
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, read: true });
      }
      logger.info('Request marked as read', { requestId: id });
      toast.success('Okundu olarak isaretlendi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Islem basarisiz';
      logger.error('Failed to mark request as read', { requestId: id, error: errorMessage }, err instanceof Error ? err : undefined);
      toast.error('Islem basarisiz', errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      logger.info('Deleting contact request', { requestId: id });
      const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Silme islemi basarisiz.';

        if (res.status === 404) {
          errorMessage = 'Silinecek talep bulunamadi.';
        } else if (res.status === 401) {
          errorMessage = 'Silme yetkiniz bulunmuyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      setRequests(requests.filter((r) => r.id !== id));
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
      logger.info('Contact request deleted successfully', { requestId: id });
      toast.success('Talep silindi', 'Iletisim talebi basariyla silindi');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme islemi basarisiz';
      logger.error('Failed to delete contact request', { requestId: id, error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-contact', requestId: id });
      toast.error('Silme basarisiz', errorMessage);
    }
  };

  const filteredRequests = requests
    .filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((r) => (filter === 'unread' ? !r.read : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = requests.filter((r) => !r.read).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent dark:border-emerald-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Talepler Yuklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => fetchRequests()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Musteri Talepleri</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} okunmamis mesaj` : 'Tum mesajlar okundu'}
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'all'
            ? 'bg-emerald-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
        >
          Tümü ({requests.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'unread'
            ? 'bg-emerald-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
        >
          Okunmamış ({unreadCount})
        </button>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="İsim veya e-posta ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => {
                setSelectedRequest(request);
                if (!request.read) markAsRead(request.id);
              }}
              className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${!request.read ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${!request.read ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                  <User className={`h-5 w-5 ${!request.read ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${!request.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                      {request.name}
                    </p>
                    {!request.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{request.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(request.createdAt)}
                </p>
                {request.service && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{request.service}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Mail className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p>Henuz talep bulunmuyor</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{selectedRequest.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedRequest.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {selectedRequest.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone size={16} />
                    {selectedRequest.phone}
                  </div>
                )}
                {selectedRequest.service && (
                  <div className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-400">
                    {selectedRequest.service}
                  </div>
                )}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700 p-4">
                  <p className="text-slate-700 dark:text-slate-300">{selectedRequest.message}</p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(selectedRequest.createdAt)}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  aria-label="Talebi sil"
                  className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  <Trash2 size={16} />
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
