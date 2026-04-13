'use client';

import { useEffect, useMemo, useState } from 'react';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';
import { RefreshCw, Upload, Save, Trash2 } from 'lucide-react';

type OverrideRow = {
  id: string;
  key: string;
  district: string;
  service: string;
  title: string | null;
  description: string | null;
  isActive: boolean;
};

type Suggestion = {
  key: string;
  district: string;
  service: string;
  title: string;
  description: string;
  reason: string;
  score: number;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

const emptyForm = {
  district: DISTRICT_LANDINGS[0]?.slug || '',
  service: SERVICE_LANDINGS[0]?.slug || '',
  title: '',
  description: '',
};

export default function SeoAutomationPage() {
  const [rows, setRows] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [csv, setCsv] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const key = useMemo(() => `${form.district}/${form.service}`, [form.district, form.service]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/programmatic-meta', { credentials: 'include' });
      if (!res.ok) throw new Error(`Yüklenemedi (${res.status})`);
      const data = (await res.json()) as OverrideRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveOverride = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/programmatic-meta', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          district: form.district,
          service: form.service,
          title: form.title.trim() || null,
          description: form.description.trim() || null,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error(`Kaydedilemedi (${res.status})`);
      await load();
      setImportMsg('Override kaydedildi.');
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (overrideKey: string) => {
    const ok = window.confirm(`${overrideKey} silinsin mi?`);
    if (!ok) return;
    await fetch('/api/admin/programmatic-meta', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: overrideKey }),
    });
    await load();
  };

  const runImport = async (apply: boolean) => {
    try {
      setImportLoading(true);
      setImportMsg(null);
      const res = await fetch('/api/admin/seo-gsc-import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, apply, limit: 80 }),
      });
      const body = (await res.json()) as { parsedRows?: number; suggestions?: Suggestion[]; error?: string; applied?: boolean };
      if (!res.ok) throw new Error(body.error || `Import hatası (${res.status})`);
      setSuggestions(body.suggestions || []);
      setImportMsg(
        apply
          ? `${body.suggestions?.length || 0} öneri uygulandı.`
          : `${body.parsedRows || 0} satır parse edildi, ${body.suggestions?.length || 0} öneri üretildi.`
      );
      if (apply) await load();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Import hatası');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SEO Otomasyon</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            GSC sorgu export&apos;undan programatik landing title/meta önerisi üretin ve override olarak uygulayın.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">1) GSC CSV Import</h2>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          placeholder="query,page,clicks,impressions,ctr,position ..."
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={importLoading || !csv.trim()}
            onClick={() => void runImport(false)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4" />
            Önizleme Üret
          </button>
          <button
            type="button"
            disabled={importLoading || !csv.trim()}
            onClick={() => void runImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Önerileri Uygula
          </button>
        </div>
        {importMsg && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{importMsg}</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">2) Manuel Override</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            value={form.district}
            onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {DISTRICT_LANDINGS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={form.service}
            onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {SERVICE_LANDINGS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Custom title"
            className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Custom description"
            className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void saveOverride()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Kaydediliyor...' : `${key} için kaydet`}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">3) Mevcut Override&apos;lar</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Yükleniyor...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2">Key</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{row.key}</td>
                    <td className="px-2 py-2 text-slate-900 dark:text-slate-100">{row.title || '-'}</td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{row.description || '-'}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => void deleteOverride(row.key)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                      Henüz override yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Öneri Önizlemesi</h2>
          <div className="mt-3 max-h-[360px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2">Key</th>
                  <th className="px-2 py-2">Query</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Desc</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.key} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-2">{s.key}</td>
                    <td className="px-2 py-2">{s.query}</td>
                    <td className="px-2 py-2">{s.title}</td>
                    <td className="px-2 py-2">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
