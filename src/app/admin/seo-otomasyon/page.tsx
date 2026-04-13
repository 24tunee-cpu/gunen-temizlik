'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';
import { RefreshCw, Upload, Save, Trash2, CheckCircle2, Lightbulb, FileUp } from 'lucide-react';

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

type ChecklistRow = {
  id: string;
  key: string;
  section: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
};

type Recommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'meta' | 'content' | 'cta' | 'checklist';
  title: string;
  detail: string;
  key?: string;
};

const emptyForm = {
  district: DISTRICT_LANDINGS[0]?.slug || '',
  service: SERVICE_LANDINGS[0]?.slug || '',
  title: '',
  description: '',
};

const SAMPLE_GSC_CSV = `query,page,clicks,impressions,ctr,position
atasehir ofis temizligi,https://www.gunentemizlik.com/bolgeler/atasehir/ofis-temizligi,12,740,1.62,8.4
kadikoy koltuk yikama,https://www.gunentemizlik.com/bolgeler/kadikoy/koltuk-yikama,9,515,1.74,9.2
uskudar insaat sonrasi temizlik,https://www.gunentemizlik.com/bolgeler/uskudar/insaat-sonrasi-temizlik,6,401,1.49,11.7`;

const SAMPLE_OVERRIDE_EXAMPLES = [
  {
    key: 'atasehir/ofis-temizligi',
    title: 'Ataşehir Ofis Temizliği | Aynı Gün Keşif - Günen Temizlik',
    description:
      'Ataşehir ofis temizliği için hızlı ekip planlaması, net kapsam ve kurumsal standartlarla düzenli hizmet alın.',
  },
  {
    key: 'kadikoy/koltuk-yikama',
    title: 'Kadıköy Koltuk Yıkama | Yerinde Profesyonel Hizmet',
    description:
      'Kadıköy koltuk yıkama hizmetinde kumaş tipine uygun uygulama ve hızlı kuruma avantajı ile teklif alın.',
  },
];

export default function SeoAutomationPage() {
  const [rows, setRows] = useState<OverrideRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistRow[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [csv, setCsv] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [checklistSavingKey, setChecklistSavingKey] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const key = useMemo(() => `${form.district}/${form.service}`, [form.district, form.service]);
  const checklistSummary = useMemo(() => {
    const completed = checklist.filter((x) => x.completed).length;
    const total = checklist.length;
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [checklist]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metaRes, checklistRes, recoRes] = await Promise.all([
        fetch('/api/admin/programmatic-meta', { credentials: 'include' }),
        fetch('/api/admin/seo-checklist', { credentials: 'include' }),
        fetch('/api/admin/seo-recommendations', { credentials: 'include' }),
      ]);

      if (!metaRes.ok) throw new Error(`Meta verisi yüklenemedi (${metaRes.status})`);
      if (!checklistRes.ok) throw new Error(`Checklist yüklenemedi (${checklistRes.status})`);
      if (!recoRes.ok) throw new Error(`Öneriler yüklenemedi (${recoRes.status})`);

      const metaData = (await metaRes.json()) as OverrideRow[];
      const checklistData = (await checklistRes.json()) as { rows?: ChecklistRow[] };
      const recoData = (await recoRes.json()) as { recommendations?: Recommendation[] };

      setRows(Array.isArray(metaData) ? metaData : []);
      setChecklist(Array.isArray(checklistData.rows) ? checklistData.rows : []);
      setRecommendations(Array.isArray(recoData.recommendations) ? recoData.recommendations : []);
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

  const applySuggestionToForm = (suggestion: Suggestion) => {
    const [district, service] = suggestion.key.split('/');
    if (!district || !service) return;
    setForm({
      district,
      service,
      title: suggestion.title,
      description: suggestion.description,
    });
    setImportMsg(`${suggestion.key} önerisi manuel forma alındı.`);
  };

  const onCsvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setImportMsg(`${file.name} yüklendi (${Math.round(file.size / 1024)} KB).`);
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

  const loadSampleCsv = () => {
    setCsv(SAMPLE_GSC_CSV);
    setImportMsg('Örnek CSV dolduruldu. Önizleme üret ile akışı test edebilirsiniz.');
  };

  const toggleChecklist = async (row: ChecklistRow, completed: boolean) => {
    try {
      setChecklistSavingKey(row.key);
      const res = await fetch('/api/admin/seo-checklist', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: row.key,
          completed,
          note: row.note || null,
        }),
      });
      if (!res.ok) throw new Error(`Checklist güncellenemedi (${res.status})`);
      await load();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Checklist güncellenemedi.');
    } finally {
      setChecklistSavingKey(null);
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

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">SEO Operasyon Sağlığı</h2>
            <p className="mt-1 text-sm text-emerald-700/90 dark:text-emerald-200/80">
              Checklist ilerlemesi: {checklistSummary.completed}/{checklistSummary.total} ({checklistSummary.percent}%)
            </p>
          </div>
          <div className="h-3 w-full max-w-[260px] overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900/50">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${checklistSummary.percent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">1) GSC CSV Import</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <FileUp className="h-4 w-4" />
            CSV Dosyası Seç
            <input type="file" accept=".csv,text/csv" onChange={onCsvFileChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={loadSampleCsv}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Örnek CSV Doldur
          </button>
        </div>
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
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Örnek Override Referansları</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Bir dahaki import sırasında hızlı karar vermek için kullanabileceğiniz referans formatlar:
        </p>
        <div className="mt-3 space-y-2">
          {SAMPLE_OVERRIDE_EXAMPLES.map((sample) => (
            <div key={sample.key} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-100">{sample.key}</p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{sample.title}</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{sample.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">2) Manuel Override Editörü</h2>
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
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">3) Otomatik SEO Önerileri</h2>
        <div className="mt-3 space-y-2">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.priority === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                      : item.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              {item.type === 'meta' && item.key && (
                <button
                  type="button"
                  onClick={() => {
                    const [district, service] = item.key!.split('/');
                    if (!district || !service) return;
                    setForm((p) => ({ ...p, district, service }));
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Override editörünü bu sayfa için hazırla
                </button>
              )}
            </div>
          ))}
          {recommendations.length === 0 && <p className="text-sm text-slate-500">Şimdilik öneri yok.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">4) Search Console Checklist Durumu</h2>
        <div className="mt-3 space-y-2">
          {checklist.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500"
                checked={item.completed}
                disabled={checklistSavingKey === item.key}
                onChange={(e) => void toggleChecklist(item, e.target.checked)}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.section}
                </p>
                <p className="text-sm text-slate-800 dark:text-slate-200">{item.label}</p>
                {item.completedAt && (
                  <p className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {new Date(item.completedAt).toLocaleString('tr-TR')} tarihinde tamamlandı
                  </p>
                )}
              </div>
            </label>
          ))}
          {checklist.length === 0 && <p className="text-sm text-slate-500">Checklist yüklenemedi.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">5) Mevcut Override&apos;lar</h2>
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
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">6) GSC Öneri Önizlemesi</h2>
          <div className="mt-3 max-h-[360px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2">Key</th>
                  <th className="px-2 py-2">Query</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Desc</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.key} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-2">{s.key}</td>
                    <td className="px-2 py-2">{s.query}</td>
                    <td className="px-2 py-2">{s.title}</td>
                    <td className="px-2 py-2">{s.description}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => applySuggestionToForm(s)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Forma al
                      </button>
                    </td>
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
