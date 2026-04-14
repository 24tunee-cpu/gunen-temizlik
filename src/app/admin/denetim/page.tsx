'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { Loader2 } from 'lucide-react';

type Log = {
  id: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  useAuth();
  const [rows, setRows] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs?take=100', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { rows: Log[]; total: number };
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Yetki', 'Denetim günlüğü yalnızca ADMIN için.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Denetim günlüğü</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Toplam {total} kayıt (son 100 gösterilir).</p>
      {loading ? <Loader2 className="h-8 w-8 animate-spin text-emerald-600" /> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-2 py-2 text-left">Zaman</th>
              <th className="px-2 py-2 text-left">Kullanıcı</th>
              <th className="px-2 py-2 text-left">İşlem</th>
              <th className="px-2 py-2 text-left">Kaynak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                <td className="px-2 py-2">{r.userEmail}</td>
                <td className="px-2 py-2 font-mono">{r.action}</td>
                <td className="px-2 py-2">
                  {r.resource}
                  {r.resourceId ? <span className="text-slate-400"> #{r.resourceId.slice(-6)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
