'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Row = { id: string; fromPath: string; toPath: string; permanent: boolean; active: boolean };

export default function AdminRedirectsPage() {
  useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromPath, setFrom] = useState('');
  const [toPath, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/redirects', { credentials: 'include' });
      if (!res.ok) throw new Error();
      setRows((await res.json()) as Row[]);
    } catch {
      toast.error('Yetki', 'Yalnızca tam yönetici (ADMIN) yönlendirme ekleyebilir.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPath, toPath, permanent: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'Kayıt başarısız');
      }
      toast.success('Eklendi');
      setFrom('');
      setTo('');
      void load();
    } catch (e) {
      toast.error('Hata', e instanceof Error ? e.message : '');
    }
  };

  const del = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success('Silindi');
      void load();
    } catch {
      toast.error('Hata', 'Silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">URL yönlendirmeleri</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Kaynak yol tam eşleşir (örn. <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/eski</code>). Hedef iç veya tam URL olabilir.
      </p>
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <input
          value={fromPath}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="/kaynak-yol"
          className="min-w-[140px] flex-1 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={toPath}
          onChange={(e) => setTo(e.target.value)}
          placeholder="/hedef veya https://..."
          className="min-w-[180px] flex-1 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          type="button"
          onClick={() => void add()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white"
        >
          <Plus className="h-4 w-4" />
          Ekle
        </button>
      </div>
      {loading ? <Loader2 className="h-8 w-8 animate-spin text-emerald-600" /> : null}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            <span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">{r.fromPath}</span>
              {' → '}
              <span className="font-mono">{r.toPath}</span>
              {r.permanent ? ' (308)' : ' (307)'}
            </span>
            <button type="button" onClick={() => void del(r.id)} className="text-red-600" aria-label="Sil">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
