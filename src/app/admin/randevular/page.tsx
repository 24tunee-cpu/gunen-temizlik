'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { formatDate } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';

type Row = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredDate: string;
  timeSlot: string;
  district?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
};

const STATUSES = ['pending', 'confirmed', 'declined', 'done'] as const;

export default function AdminAppointmentsPage() {
  useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/appointments', { credentials: 'include' });
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = (await res.json()) as Row[];
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Hata', 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Güncellendi');
      void load();
    } catch {
      toast.error('Hata', 'Güncellenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Randevu talepleri</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>
      {loading && rows.length === 0 ? (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Müşteri</th>
                <th className="px-3 py-2 text-left">Slot</th>
                <th className="px-3 py-2 text-left">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.preferredDate)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-3 py-2">{r.timeSlot}</td>
                  <td className="px-3 py-2">
                    <select
                      value={r.status}
                      onChange={(e) => void patch(r.id, e.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
