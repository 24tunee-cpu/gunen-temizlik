'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  Search,
  Mail,
  Phone,
  Trash2,
  User,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  LayoutGrid,
  List,
  Inbox,
  Eye,
  EyeOff,
  MessageSquare,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

type StatusFilter = 'all' | 'unread' | 'read';

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [denseView, setDenseView] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/contact', { credentials: 'include' });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Talepler yüklenirken bir hata oluştu.';
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
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Talepler yüklenirken hata oluştu.';
      console.error('Failed to fetch contact requests', { error: errorMessage }, err instanceof Error ? err : undefined);
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'contact-requests' });
      setError(errorMessage);
      toast.error('Talepler yüklenemedi', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const setReadStatus = useCallback(async (id: string, read: boolean) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `İşlem başarısız (${res.status})`);
      }

      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, read } : r)));
      setSelectedRequest((prev) => (prev?.id === id ? { ...prev, read } : prev));
      toast.success(read ? 'Okundu işaretlendi' : 'Okunmadı olarak işaretlendi');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      toast.error('Güncelleme', msg);
    }
  }, []);

  const openDetail = (request: ContactRequest) => {
    setSelectedRequest(request);
    if (!request.read) {
      void setReadStatus(request.id, true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Silme başarısız');
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedRequest((prev) => (prev?.id === id ? null : prev));
      setDeleteId(null);
      toast.success('Talep silindi', 'Kayıt kaldırıldı.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'delete-contact', requestId: id });
      toast.error('Silme başarısız', errorMessage);
    }
  };

  const stats = useMemo(() => {
    const total = requests.length;
    const unread = requests.filter((r) => !r.read).length;
    return { total, unread, read: total - unread };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return requests
      .filter((r) => {
        if (statusFilter === 'unread' && r.read) return false;
        if (statusFilter === 'read' && !r.read) return false;
        if (!term) return true;
        return (
          r.name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          (r.phone && r.phone.toLowerCase().includes(term)) ||
          (r.service && r.service.toLowerCase().includes(term)) ||
          r.message.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, searchTerm, statusFilter]);

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

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white dark:bg-slate-800 p-8">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Talepler yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchRequests()}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Müşteri talepleri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            İletişim formundan gelen mesajlar. Yalnızca yöneticiler bu listeyi görebilir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchRequests()}
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Toplam</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-200/90">Okunmamış</p>
          <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">{stats.unread}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/90">Okunmuş</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{stats.read}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="İsim, e-posta, telefon, hizmet veya mesaj…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterPill('all', 'Tümü', stats.total)}
            {filterPill('unread', 'Okunmamış', stats.unread)}
            {filterPill('read', 'Okunmuş', stats.read)}
          </div>
        </div>

        {!denseView && (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredRequests.map((request) => (
              <button
                type="button"
                key={request.id}
                onClick={() => openDetail(request)}
                className={`flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                  !request.read ? 'bg-emerald-50/40 dark:bg-emerald-900/15' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      !request.read ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <User
                      className={`h-5 w-5 ${!request.read ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate font-medium ${!request.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {request.name}
                      </p>
                      {!request.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden />
                      )}
                    </div>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{request.email}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400 dark:text-slate-500">{request.message}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(request.createdAt)}</p>
                  {request.service ? (
                    <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{request.service}</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}

        {denseView && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-700/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Gönderen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    İletişim
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Özet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/40"
                    onClick={() => openDetail(request)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{request.name}</p>
                      {request.service ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{request.service}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      <p className="truncate max-w-[200px]">{request.email}</p>
                      {request.phone ? <p className="truncate text-xs">{request.phone}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2 max-w-xs">{request.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          request.read
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        {request.read ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {request.read ? 'Okundu' : 'Yeni'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(request.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRequests.length === 0 && (
          <div className="py-16 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-400">
              {requests.length === 0
                ? 'Henüz iletişim talebi yok.'
                : 'Filtre veya arama sonucu bulunamadı.'}
            </p>
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
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{selectedRequest.name}</h3>
                    <a
                      href={`mailto:${encodeURIComponent(selectedRequest.email)}`}
                      className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {selectedRequest.email}
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Kapat"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:${encodeURIComponent(selectedRequest.email)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Mail className="h-4 w-4" />
                    E-posta
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                  {selectedRequest.phone ? (
                    <a
                      href={`tel:${selectedRequest.phone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Phone className="h-4 w-4" />
                      Ara
                    </a>
                  ) : null}
                </div>

                {selectedRequest.phone ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone size={16} className="shrink-0" />
                    <span>{selectedRequest.phone}</span>
                  </div>
                ) : null}

                {selectedRequest.service ? (
                  <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {selectedRequest.service}
                  </div>
                ) : null}

                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Mesaj
                  </div>
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{selectedRequest.message}</p>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(selectedRequest.createdAt)}</p>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                {selectedRequest.read ? (
                  <button
                    type="button"
                    onClick={() => void setReadStatus(selectedRequest.id, false)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <EyeOff className="h-4 w-4" />
                    Okunmadı yap
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setReadStatus(selectedRequest.id, true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                  >
                    <Eye className="h-4 w-4" />
                    Okundu işaretle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteId(selectedRequest.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Talebi sil</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Bu iletişim talebini kalıcı olarak silmek istediğinize emin misiniz?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(deleteId)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
