'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { formatDate } from '@/lib/utils';
import { Loader2, RefreshCw, Search, Phone, Mail, CalendarClock, MapPin, FileText } from 'lucide-react';

type StatusKey = 'pending' | 'confirmed' | 'declined' | 'done';

type Row = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredDate: string;
  timeSlot: string;
  district?: string | null;
  address?: string | null;
  serviceHint?: string | null;
  notes?: string | null;
  status: StatusKey | string;
  adminNotes?: string | null;
  createdAt: string;
};

const STATUS_META: Record<StatusKey, { label: string; badge: string }> = {
  pending: {
    label: 'Beklemede',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  confirmed: {
    label: 'Onaylandı',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  declined: {
    label: 'Reddedildi',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  done: {
    label: 'Tamamlandı',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
};

const STATUSES: StatusKey[] = ['pending', 'confirmed', 'declined', 'done'];

function toStatusLabel(status: string): string {
  return STATUS_META[status as StatusKey]?.label ?? status;
}

export default function AdminAppointmentsPage() {
  useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/appointments${query}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = (await res.json()) as Row[];
      const list = Array.isArray(data) ? data : [];
      setRows(list);

      if (selectedId) {
        const stillThere = list.find((r) => r.id === selectedId);
        if (stillThere) {
          setNotesDraft(stillThere.adminNotes ?? '');
        } else {
          setSelectedId(null);
          setNotesDraft('');
        }
      }
    } catch {
      toast.error('Hata', 'Randevu talepleri alınamadı');
    } finally {
      setLoading(false);
    }
  }, [selectedId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const target = `${r.name} ${r.email} ${r.phone ?? ''} ${r.district ?? ''} ${r.serviceHint ?? ''}`.toLowerCase();
      return target.includes(q);
    });
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      confirmed: rows.filter((r) => r.status === 'confirmed').length,
      done: rows.filter((r) => r.status === 'done').length,
    };
  }, [rows]);

  const selected = useMemo(
    () => (selectedId ? rows.find((r) => r.id === selectedId) ?? null : null),
    [rows, selectedId]
  );

  const patch = useCallback(
    async (id: string, payload: { status?: StatusKey; adminNotes?: string | null }) => {
      try {
        setSaving(true);
        const res = await fetch(`/api/admin/appointments/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error || 'Güncellenemedi');
        toast.success('Kaydedildi');
        await load();
      } catch (error) {
        toast.error('Hata', error instanceof Error ? error.message : 'Güncellenemedi');
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Randevu talepleri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Durum değiştirin, not alın ve müşteri detaylarını tek ekranda yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs text-slate-500">Toplam</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-300">Beklemede</p>
          <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">Onaylandı</p>
          <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.confirmed}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Tamamlandı</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{stats.done}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
            <label className="relative min-w-[230px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ad, e-posta, telefon, ilçe..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StatusKey)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="all">Tüm durumlar</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {toStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Filtreye uygun randevu talebi bulunamadı.
            </p>
          ) : (
            <>
              <div className="space-y-2 p-3 md:hidden">
                {filteredRows.map((r) => {
                  const active = r.id === selectedId;
                  const badgeClass =
                    STATUS_META[r.status as StatusKey]?.badge ??
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/30'
                      }`}
                      onClick={() => {
                        setSelectedId(r.id);
                        setNotesDraft(r.adminNotes ?? '');
                      }}
                    >
                      <p className="font-medium text-slate-900 dark:text-white">{r.name}</p>
                      <p className="text-sm text-slate-500">{r.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(r.preferredDate)}</span>
                        <span>•</span>
                        <span>{r.timeSlot}</span>
                        <span>•</span>
                        <span>{r.district || '-'}</span>
                      </div>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                        {toStatusLabel(r.status)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Talep</th>
                    <th className="px-3 py-2 text-left">Tercih</th>
                    <th className="px-3 py-2 text-left">Bölge / hizmet</th>
                    <th className="px-3 py-2 text-left">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredRows.map((r) => {
                    const active = r.id === selectedId;
                    const badgeClass =
                      STATUS_META[r.status as StatusKey]?.badge ??
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
                    return (
                      <tr
                        key={r.id}
                        className={`cursor-pointer transition-colors ${active ? 'bg-emerald-50/70 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}
                        onClick={() => {
                          setSelectedId(r.id);
                          setNotesDraft(r.adminNotes ?? '');
                        }}
                      >
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900 dark:text-white">{r.name}</p>
                          <p className="text-slate-500">{r.email}</p>
                          <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p>{formatDate(r.preferredDate)}</p>
                          <p className="text-slate-500">{r.timeSlot}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-slate-700 dark:text-slate-200">{r.district || '-'}</p>
                          <p className="text-slate-500">{r.serviceHint || '-'}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                            {toStatusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          {!selected ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detay görmek için listeden bir randevu seçin.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selected.name}</h2>
                <p className="text-xs text-slate-500">{formatDate(selected.createdAt)} oluşturuldu</p>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
                <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Mail className="h-4 w-4 text-slate-500" /> {selected.email}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Phone className="h-4 w-4 text-slate-500" /> {selected.phone || '-'}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  {formatDate(selected.preferredDate)} / {selected.timeSlot}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {selected.district || '-'}
                </p>
                <p className="inline-flex items-start gap-2 text-slate-700 dark:text-slate-200">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                  <span>{selected.serviceHint || 'Hizmet belirtilmedi'}</span>
                </p>
              </div>

              {selected.address ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Adres</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{selected.address}</p>
                </div>
              ) : null}
              {selected.notes ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Müşteri notu</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{selected.notes}</p>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void patch(selected.id, { status: s })}
                    disabled={saving || selected.status === s}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {toStatusLabel(s)}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Admin notu
                </label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  placeholder="Arama sonucu, fiyat notu, dönüş planı..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => void patch(selected.id, { adminNotes: notesDraft.trim() || null })}
                  disabled={saving}
                  className="mt-2 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : 'Notu kaydet'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
