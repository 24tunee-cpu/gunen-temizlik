'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ExternalLink,
  Save,
  Loader2,
  CheckCircle2,
  Circle,
  BookOpen,
  Cpu,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import {
  MAP_CHECKLISTS,
  MAP_PLATFORM_META,
  MAP_PLATFORMS,
  type MapPlatformId,
  isMapPlatformId,
  parseChecklistState,
} from '@/lib/map-platforms-data';
import { GoogleMapsConsole } from '@/components/admin/maps/GoogleMapsConsole';
import { ProviderPlaceholder } from '@/components/admin/maps/ProviderPlaceholder';

type ListingRow = {
  id: string;
  platform: string;
  businessName: string | null;
  listingUrl: string | null;
  dashboardUrl: string | null;
  mapsEmbedUrl: string | null;
  externalPlaceId: string | null;
  connectionStatus: string;
  checklistState: unknown;
  internalNotes: string | null;
  lastManualSyncAt: string | null;
};

const STATUS_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'not_connected', label: 'Bağlı değil', hint: 'Hesap henüz yok veya bağlanmadı' },
  { value: 'in_progress', label: 'Kurulumda', hint: 'Doğrulama / onay sürecinde' },
  { value: 'connected', label: 'Aktif', hint: 'Profil yayında ve yönetiliyor' },
];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300';
    case 'in_progress':
      return 'bg-amber-500/15 text-amber-800 ring-amber-500/25 dark:text-amber-200';
    default:
      return 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400';
  }
}

const MAPS_ERR_MESSAGES: Record<string, string> = {
  google_not_configured: 'Google OAuth istemci bilgileri (MAPS_GOOGLE_*) eksik.',
  invalid_state: 'OAuth güvenlik doğrulaması başarısız. Tekrar deneyin.',
  token_exchange: 'Google token alınamadı.',
  no_refresh_token:
    'Yenileme kodu alınamadı. Bağlanırken tüm izinleri onaylayın veya farklı Google hesabı deneyin.',
  unauthorized: 'Oturum gerekli.',
  access_denied: 'Google erişimi reddedildi.',
};

export default function AdminHaritalarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-sm">Yükleniyor…</span>
        </div>
      }
    >
      <HaritalarPageBody />
    </Suspense>
  );
}

function HaritalarPageBody() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MapPlatformId>('google');
  const [listings, setListings] = useState<Record<MapPlatformId, ListingRow | null>>({
    google: null,
    yandex: null,
    apple: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    listingUrl: '',
    dashboardUrl: '',
    mapsEmbedUrl: '',
    externalPlaceId: '',
    connectionStatus: 'not_connected',
    internalNotes: '',
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/map-platforms', { credentials: 'include' });
      if (!res.ok) throw new Error(`Veri yüklenemedi (${res.status})`);
      const data = (await res.json()) as { listings?: ListingRow[] };
      const next: Record<MapPlatformId, ListingRow | null> = {
        google: null,
        yandex: null,
        apple: null,
      };
      for (const row of data.listings || []) {
        if (isMapPlatformId(row.platform)) {
          next[row.platform] = row;
        }
      }
      setListings(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Yükleme hatası';
      setError(msg);
      toast.error('Haritalar', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = searchParams.get('maps_tab');
    if (t === 'google' || t === 'yandex' || t === 'apple') setTab(t);
    const ok = searchParams.get('maps_ok');
    if (ok === 'connected') toast.success('Haritalar', 'Google hesabı bağlandı.');
    const err = searchParams.get('maps_error');
    if (err) {
      toast.error('Haritalar', MAPS_ERR_MESSAGES[err] || decodeURIComponent(err.replace(/\+/g, ' ')));
    }
  }, [searchParams]);

  const current = listings[tab];
  const meta = MAP_PLATFORM_META[tab];
  const checklistDef = MAP_CHECKLISTS[tab];

  useEffect(() => {
    if (!current) return;
    setForm({
      businessName: current.businessName ?? '',
      listingUrl: current.listingUrl ?? '',
      dashboardUrl: current.dashboardUrl ?? '',
      mapsEmbedUrl: current.mapsEmbedUrl ?? '',
      externalPlaceId: current.externalPlaceId ?? '',
      connectionStatus: current.connectionStatus || 'not_connected',
      internalNotes: current.internalNotes ?? '',
    });
    setChecklist(parseChecklistState(current.checklistState));
  }, [current, tab]);

  const checklistProgress = useMemo(() => {
    const total = checklistDef.length;
    if (!total) return 0;
    const done = checklistDef.filter((item) => checklist[item.id]).length;
    return Math.round((done / total) * 100);
  }, [checklist, checklistDef]);

  const overviewStats = useMemo(() => {
    return MAP_PLATFORMS.map((p) => {
      const row = listings[p];
      const def = MAP_CHECKLISTS[p];
      const st = row ? parseChecklistState(row.checklistState) : {};
      const done = def.filter((i) => st[i.id]).length;
      const pct = def.length ? Math.round((done / def.length) * 100) : 0;
      return { platform: p, status: row?.connectionStatus ?? 'not_connected', pct, short: MAP_PLATFORM_META[p].shortLabel };
    });
  }, [listings]);

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/map-platforms', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: tab,
          businessName: form.businessName.trim() || null,
          listingUrl: form.listingUrl.trim() || null,
          dashboardUrl: form.dashboardUrl.trim() || null,
          mapsEmbedUrl: form.mapsEmbedUrl.trim() || null,
          externalPlaceId: form.externalPlaceId.trim() || null,
          connectionStatus: form.connectionStatus,
          checklistState: checklist,
          internalNotes: form.internalNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || `Kayıt başarısız (${res.status})`);
      }
      toast.success('Haritalar', `${meta.shortLabel} kaydedildi.`);
      await load();
    } catch (e) {
      toast.error('Haritalar', e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && !listings.google) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm">Harita kayıtları yükleniyor…</p>
      </div>
    );
  }

  if (error && !listings.google) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </span>
              Haritalar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Google, Yandex ve Apple harita işletme profillerinizi tek yerden takip edin. Bağlantılar, checklist ve notlar
              veritabanında saklanır; API ile otomatik senkron ve yorum yönetimi sonraki sürümlerde eklenecek.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Yenile
          </button>
        </div>
      </header>

      {/* Özet kartlar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {overviewStats.map(({ platform, status, pct, short }) => (
          <button
            key={platform}
            type="button"
            onClick={() => setTab(platform)}
            className={cn(
              'rounded-2xl border p-5 text-left transition-all hover:shadow-md',
              tab === platform
                ? 'border-emerald-400/60 bg-emerald-50/50 ring-2 ring-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-950/20'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">{short}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium ring-1', statusBadgeClass(status))}>
                {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Checklist</span>
                <span className="font-medium tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 dark:border-slate-700 dark:bg-slate-900/50">
        {MAP_PLATFORMS.map((p) => {
          const m = MAP_PLATFORM_META[p];
          const active = tab === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setTab(p)}
              className={cn(
                'flex-1 min-w-[140px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              {m.shortLabel}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {tab === 'google' && (
            <div
              className={cn(
                'rounded-2xl bg-gradient-to-r p-6 text-white shadow-lg',
                meta.accent
              )}
            >
              <h2 className="text-xl font-bold">{meta.label}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90">{meta.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={meta.panelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/25"
                >
                  İşletme paneli <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={meta.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/25"
                >
                  Resmi yardım <BookOpen className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {tab === 'google' && <GoogleMapsConsole />}

          {tab === 'yandex' && <ProviderPlaceholder platform="yandex" />}
          {tab === 'apple' && <ProviderPlaceholder platform="apple" />}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-5 lg:col-span-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bağlantı ve kimlik</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  URL’ler ve tanımlayıcılar ekip içi referans içindir; ziyaretçilere açık değildir.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Durum</label>
                    <select
                      value={form.connectionStatus}
                      onChange={(e) => setForm((f) => ({ ...f, connectionStatus: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label} — {o.hint}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Listede görünen işletme adı
                    </label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="Örn: Günen Temizlik"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Harita / paylaşım URL’si
                    </label>
                    <input
                      type="url"
                      value={form.listingUrl}
                      onChange={(e) => setForm((f) => ({ ...f, listingUrl: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Yönetim paneli (doğrudan giriş)
                    </label>
                    <input
                      type="url"
                      value={form.dashboardUrl}
                      onChange={(e) => setForm((f) => ({ ...f, dashboardUrl: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Ek harita veya embed URL (isteğe bağlı)
                    </label>
                    <input
                      type="url"
                      value={form.mapsEmbedUrl}
                      onChange={(e) => setForm((f) => ({ ...f, mapsEmbedUrl: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      {tab === 'google' ? 'Google Place ID' : 'Platform tanımlayıcısı'} (isteğe bağlı)
                    </label>
                    <input
                      type="text"
                      value={form.externalPlaceId}
                      onChange={(e) => setForm((f) => ({ ...f, externalPlaceId: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="ChIJ… veya benzeri"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Dahili notlar
                    </label>
                    <textarea
                      value={form.internalNotes}
                      onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                      placeholder="Ekibiniz için: doğrulama tarihi, iletişim kişisi, API kotası…"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {form.listingUrl.trim() && (
                    <a
                      href={form.listingUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Haritayı aç <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {form.dashboardUrl.trim() && (
                    <a
                      href={form.dashboardUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Panele git <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="inline-flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 sm:flex-none"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {meta.shortLabel} kaydet
                  </button>
                </div>
                {current?.lastManualSyncAt && (
                  <p className="mt-3 text-xs text-slate-400">
                    Son kayıt: {new Date(current.lastManualSyncAt).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Kalite checklist</h3>
                  <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {checklistProgress}%
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {checklistDef.map((item) => {
                    const done = !!checklist[item.id];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleCheck(item.id)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                            done
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                              : 'border-slate-100 hover:border-slate-200 dark:border-slate-700 dark:hover:border-slate-600'
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                          )}
                          <span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                            {item.hint && (
                              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.hint}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Checklist değişiklikleri &quot;{meta.shortLabel} kaydet&quot; ile birlikte saklanır.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex gap-2 text-amber-900 dark:text-amber-100">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Politika ve beklenti</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900/85 dark:text-amber-100/80">
                      Otomatik yorum yanıtı ve toplu düzenleme, platform kullanım şartlarına tabidir. Garantili sıralama yoktur;
                      bu panel operasyonel disiplin ve ilerideki API entegrasyonu için temel oluşturur.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/80">
                <div className="flex gap-2 text-slate-800 dark:text-slate-100">
                  <Cpu className="h-5 w-5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-sm font-semibold">Otomasyon yol haritası</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <li>Google: OAuth, şifreli token, senkron, yorum önbelleği, taslak → onay → gönder (aktif)</li>
                      <li>Zamanlama: Vercel Cron veya Bearer ile /api/cron/maps-sync</li>
                      <li>Yandex / Apple: resmi API veya feed (planlı — üstteki sekme durumu)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
