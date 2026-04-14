'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Link2,
  Link2Off,
  RefreshCw,
  Loader2,
  Send,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/utils';

type GoogleStatus = {
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  preferredAccountName: string | null;
  preferredLocationName: string | null;
  accessExpiresAt: string | null;
  lastSync: {
    id: string;
    source: string;
    status: string;
    message: string | null;
    startedAt: string;
    finishedAt: string | null;
  } | null;
  accounts: { name: string }[];
  locations: { resourceName: string; title: string | null }[];
  counts: { locations: number; reviews: number; pendingDrafts: number; approvedDrafts: number };
};

type ReviewRow = {
  reviewName: string;
  reviewerDisplayName: string | null;
  starRating: number | null;
  comment: string | null;
  replyComment: string | null;
  reviewTime: string | null;
  fetchedAt: string;
  draft: {
    id: string;
    draftText: string;
    status: string;
    errorMessage: string | null;
  } | null;
};

type DraftQueueSummary = {
  totalPending: number;
  slaBreaches: number;
  lastSync: {
    status: string;
    message: string | null;
    startedAt: string;
    provider: string;
  } | null;
};

export function GoogleMapsConsole() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [draftSummary, setDraftSummary] = useState<DraftQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [draftBusy, setDraftBusy] = useState<string | null>(null);
  const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});

  const [prefAccount, setPrefAccount] = useState('');
  const [prefLocation, setPrefLocation] = useState('');

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/admin/maps/google', { credentials: 'include' });
    if (!res.ok) throw new Error('Google durumu yüklenemedi');
    const data = (await res.json()) as GoogleStatus;
    setStatus(data);
    setPrefAccount(data.preferredAccountName ?? '');
    setPrefLocation(data.preferredLocationName ?? '');
  }, []);

  const loadReviews = useCallback(async () => {
    const res = await fetch('/api/admin/maps/reviews?platform=google', { credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { reviews: ReviewRow[] };
    setReviews(data.reviews || []);
    const next: Record<string, string> = {};
    for (const r of data.reviews || []) {
      if (r.draft?.draftText) next[r.reviewName] = r.draft.draftText;
      else next[r.reviewName] = '';
    }
    setLocalDrafts((prev) => ({ ...next, ...prev }));
  }, []);

  const loadDraftSummary = useCallback(async () => {
    const res = await fetch('/api/admin/maps/review-draft', { credentials: 'include' });
    if (!res.ok) {
      setDraftSummary(null);
      return;
    }
    const data = (await res.json()) as DraftQueueSummary;
    setDraftSummary(data);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      await loadStatus();
      await Promise.all([loadReviews(), loadDraftSummary()]);
    } catch {
      toast.error('Haritalar', 'Google verisi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [loadStatus, loadReviews, loadDraftSummary]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = () => {
    window.location.href = '/api/admin/maps/google/oauth/start';
  };

  const disconnect = async () => {
    if (!confirm('Google bağlantısı, önbellekteki konum/yorum ve taslaklar silinecek. Emin misiniz?')) return;
    const res = await fetch('/api/admin/maps/google', { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      toast.error('Haritalar', 'Bağlantı kesilemedi.');
      return;
    }
    toast.success('Haritalar', 'Google bağlantısı kaldırıldı.');
    await refresh();
  };

  const sync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/admin/maps/google/sync', { method: 'POST', credentials: 'include' });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) toast.success('Senkron', data.message || 'Tamamlandı.');
      else toast.error('Senkron', data.message || `Hata (${res.status})`);
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  const savePrefs = async () => {
    try {
      setPrefsSaving(true);
      const res = await fetch('/api/admin/maps/google/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredAccountName: prefAccount.trim() || null,
          preferredLocationName: prefLocation.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || 'Kaydedilemedi');
      }
      toast.success('Haritalar', 'Tercihler kaydedildi.');
      await loadStatus();
    } catch (e) {
      toast.error('Haritalar', e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setPrefsSaving(false);
    }
  };

  const saveDraft = async (reviewName: string, action: 'save' | 'approve') => {
    const text = localDrafts[reviewName] ?? '';
    if (!text.trim() && action === 'approve') {
      toast.error('Taslak', 'Onaylamadan önce metin yazın.');
      return;
    }
    setDraftBusy(`${reviewName}-${action}`);
    try {
      const res = await fetch('/api/admin/maps/review-draft', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName, draftText: text, action }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error || 'Kaydedilemedi');
      toast.success('Taslak', action === 'approve' ? 'Onaylandı.' : 'Taslak kaydedildi.');
      await loadReviews();
      await loadStatus();
      await loadDraftSummary();
    } catch (e) {
      toast.error('Taslak', e instanceof Error ? e.message : 'Hata');
    } finally {
      setDraftBusy(null);
    }
  };

  const sendReply = async (reviewName: string) => {
    if (!confirm('Yanıt Google’a gönderilecek. Onaylıyor musunuz?')) return;
    setDraftBusy(`${reviewName}-send`);
    try {
      const res = await fetch('/api/admin/maps/review-reply', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewName }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) throw new Error(j?.error || j?.message || 'Gönderilemedi');
      toast.success('Yanıt', 'Google’a iletildi.');
      await loadReviews();
      await loadStatus();
      await loadDraftSummary();
    } catch (e) {
      toast.error('Yanıt', e instanceof Error ? e.message : 'Hata');
    } finally {
      setDraftBusy(null);
    }
  };

  if (loading || !status) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 dark:border-slate-700 dark:bg-slate-900">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Google entegrasyonu yükleniyor…</span>
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/40 dark:bg-amber-950/25">
        <div className="flex gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Google OAuth yapılandırılmadı</h3>
            <p className="mt-2 text-sm text-amber-900/85 dark:text-amber-100/80">
              Ortam değişkenleri: <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">MAPS_GOOGLE_CLIENT_ID</code>,{' '}
              <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">MAPS_GOOGLE_CLIENT_SECRET</code>. Üretimde ayrıca{' '}
              <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">MAPS_OAUTH_SECRET</code> önerilir. Google Cloud Console’da OAuth
              redirect URI: <code className="break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/admin/maps/google/oauth/callback` : '…/api/admin/maps/google/oauth/callback'}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {draftSummary && status.connected && (
        <div
          className={cn(
            'rounded-2xl border p-4 text-sm shadow-sm',
            draftSummary.slaBreaches > 0
              ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
              : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100'
          )}
        >
          <p className="font-semibold">Yorum yanıtı taslak kuyruğu</p>
          <p className="mt-1 text-xs opacity-90">
            Onay bekleyen: <span className="tabular-nums font-medium">{draftSummary.totalPending}</span>
            {draftSummary.slaBreaches > 0 ? (
              <>
                {' '}
                · <span className="font-medium">48 saati aşan bekleyen: {draftSummary.slaBreaches}</span>
              </>
            ) : null}
          </p>
          {draftSummary.lastSync ? (
            <p className="mt-2 text-xs opacity-80">
              Son senkron kaydı: {new Date(draftSummary.lastSync.startedAt).toLocaleString('tr-TR')} —{' '}
              {draftSummary.lastSync.provider} / <span className="font-medium">{draftSummary.lastSync.status}</span>
              {draftSummary.lastSync.message ? ` (${draftSummary.lastSync.message})` : ''}
            </p>
          ) : (
            <p className="mt-2 text-xs opacity-70">Henüz senkron kaydı yok.</p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">API &amp; senkron</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              OAuth ile bağlanın; konum ve yorumlar önbelleğe alınır. Zamanlama: Vercel Cron veya{' '}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/api/cron/maps-sync</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!status.connected ? (
              <button
                type="button"
                onClick={connect}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Link2 className="h-4 w-4" />
                Google ile bağlan
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void sync()}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Senkronize et
                </button>
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  <Link2Off className="h-4 w-4" />
                  Bağlantıyı kes
                </button>
              </>
            )}
          </div>
        </div>

        {status.connected && (
          <div className="mt-4 grid gap-3 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="block text-slate-400">Hesap</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{status.accountEmail || '—'}</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="block text-slate-400">Konumlar</span>
              <span className="font-medium tabular-nums">{status.counts.locations}</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="block text-slate-400">Yorumlar (önbellek)</span>
              <span className="font-medium tabular-nums">{status.counts.reviews}</span>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="block text-slate-400">Taslak / onay</span>
              <span className="font-medium tabular-nums">
                {status.counts.pendingDrafts} / {status.counts.approvedDrafts}
              </span>
            </div>
          </div>
        )}

        {status.lastSync && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Son senkron: {new Date(status.lastSync.startedAt).toLocaleString('tr-TR')} —{' '}
            <span className="font-medium">{status.lastSync.status}</span>
            {status.lastSync.message ? `: ${status.lastSync.message}` : ''}
          </p>
        )}
      </div>

      {status.connected && status.locations.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Senkron tercihleri</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Birden fazla konum varsa yorum çekmek için bir konum seçin. Boş bırakırsanız ilk konum kullanılır.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">İşletme hesabı</label>
              <select
                value={prefAccount}
                onChange={(e) => setPrefAccount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="">(Otomatik — ilk hesap)</option>
                {status.accounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Konum</label>
              <select
                value={prefLocation}
                onChange={(e) => setPrefLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="">(Otomatik — ilk konum)</option>
                {status.locations.map((l) => (
                  <option key={l.resourceName} value={l.resourceName}>
                    {l.title || l.resourceName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void savePrefs()}
            disabled={prefsSaving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {prefsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Tercihleri kaydet
          </button>
        </div>
      )}

      {status.connected && reviews.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Yorumlar &amp; yanıt kuyruğu</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Taslak kaydet → Onayla → Gönder. Gönderim yalnızca onaylı taslaklar için çalışır.
          </p>
          <div className="mt-4 space-y-6">
            {reviews.map((r) => {
              const draftText = localDrafts[r.reviewName] ?? r.draft?.draftText ?? '';
              const st = r.draft?.status;
              const busy = draftBusy?.startsWith(r.reviewName);
              return (
                <div
                  key={r.reviewName}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{r.reviewerDisplayName || 'Anonim'}</p>
                      <p className="text-xs text-slate-500">
                        {r.starRating != null ? `${r.starRating}/5` : '—'} ·{' '}
                        {r.reviewTime ? new Date(r.reviewTime).toLocaleDateString('tr-TR') : 'tarih yok'}
                      </p>
                    </div>
                    {st && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                          st === 'sent' && 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
                          st === 'approved' && 'bg-blue-500/10 text-blue-700 ring-blue-500/20',
                          st === 'pending' && 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
                          st === 'failed' && 'bg-red-500/10 text-red-700 ring-red-500/20'
                        )}
                      >
                        {st}
                      </span>
                    )}
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{r.comment}</p>
                  )}
                  {r.replyComment && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Mevcut yanıt: {r.replyComment}
                    </p>
                  )}
                  <textarea
                    value={draftText}
                    onChange={(e) =>
                      setLocalDrafts((prev) => ({ ...prev, [r.reviewName]: e.target.value }))
                    }
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    placeholder="Yanıt taslağı…"
                  />
                  {r.draft?.errorMessage && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{r.draft.errorMessage}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void saveDraft(r.reviewName, 'save')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-white dark:border-slate-600 dark:hover:bg-slate-800"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Taslak kaydet
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void saveDraft(r.reviewName, 'approve')}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Onayla
                    </button>
                    <button
                      type="button"
                      disabled={!!busy || st !== 'approved'}
                      onClick={() => void sendReply(r.reviewName)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Google’a gönder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status.connected && reviews.length === 0 && status.counts.reviews === 0 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Henüz önbellekte yorum yok. &quot;Senkronize et&quot; ile çekin; API yetkisi veya konum seçimi gerekir.
        </p>
      )}
    </div>
  );
}
