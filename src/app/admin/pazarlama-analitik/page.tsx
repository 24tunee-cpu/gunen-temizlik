'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Phone, MessageCircle, Mail, BarChart3, MapPin, Star, Route } from 'lucide-react';

type MarketingEvent = {
  id: string;
  eventType: 'phone_click' | 'whatsapp_click' | 'email_click' | 'gmb_map_click' | 'gmb_review_click' | 'gmb_directions_click';
  source: string | null;
  linkUrl: string | null;
  linkText: string | null;
  pagePath: string | null;
  createdAt: string;
};

type ResponsePayload = {
  rangeDays: number;
  summary: {
    total: number;
    phoneClicks: number;
    whatsappClicks: number;
    emailClicks: number;
    gmbMapClicks: number;
    gmbReviewClicks: number;
    gmbDirectionsClicks: number;
  };
  events: MarketingEvent[];
};

export default function MarketingAnalyticsPage() {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResponsePayload | null>(null);

  const load = async (d: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/marketing-events?days=${d}`, { credentials: 'include' });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `Yüklenemedi (${res.status})`);
      }
      const body = (await res.json()) as ResponsePayload;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analitik yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(days);
  }, [days]);

  const topSources = useMemo(() => {
    const map = new Map<string, number>();
    for (const evt of data?.events || []) {
      const key = evt.source || 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [data]);

  const ctaVariantStats = useMemo(() => {
    const buckets = {
      A: { total: 0, phone: 0, whatsapp: 0, email: 0 },
      B: { total: 0, phone: 0, whatsapp: 0, email: 0 },
    };
    for (const evt of data?.events || []) {
      const source = evt.source || '';
      let variant: 'A' | 'B' | null = null;
      if (source.includes('programmatic-cta-A')) variant = 'A';
      if (source.includes('programmatic-cta-B')) variant = 'B';
      if (!variant) continue;
      buckets[variant].total += 1;
      if (evt.eventType === 'phone_click') buckets[variant].phone += 1;
      if (evt.eventType === 'whatsapp_click') buckets[variant].whatsapp += 1;
      if (evt.eventType === 'email_click') buckets[variant].email += 1;
    }
    return buckets;
  }, [data]);

  const landingPerformance = useMemo(() => {
    const map = new Map<string, { total: number; phone: number; whatsapp: number; email: number }>();
    for (const evt of data?.events || []) {
      const page = evt.pagePath || '';
      if (!page.startsWith('/bolgeler/')) continue;
      const bucket = map.get(page) || { total: 0, phone: 0, whatsapp: 0, email: 0 };
      bucket.total += 1;
      if (evt.eventType === 'phone_click') bucket.phone += 1;
      if (evt.eventType === 'whatsapp_click') bucket.whatsapp += 1;
      if (evt.eventType === 'email_click') bucket.email += 1;
      map.set(page, bucket);
    }
    return [...map.entries()]
      .map(([page, stat]) => ({ page, ...stat }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pazarlama Analitik</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Telefon, WhatsApp, e-posta ve Google harita/yorum aksiyonlarının kaynak bazlı performansı.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value={7}>Son 7 gün</option>
            <option value={14}>Son 14 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={60}>Son 60 gün</option>
          </select>
          <button
            type="button"
            onClick={() => void load(days)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm dark:border-slate-700 dark:bg-slate-900">
          Veriler yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <BarChart3 className="h-4 w-4" />
                Toplam Event
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.total || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Phone className="h-4 w-4" />
                Telefon Tıklama
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.phoneClicks || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Tıklama
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.whatsappClicks || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                E-posta Tıklama
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.emailClicks || 0}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />
                Haritada Aç Tıklaması
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.gmbMapClicks || 0}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Star className="h-4 w-4" />
                Yorum Yaz Tıklaması
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.gmbReviewClicks || 0}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Route className="h-4 w-4" />
                Yol Tarifi Tıklaması
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data?.summary.gmbDirectionsClicks || 0}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">En iyi kaynaklar</h2>
              <div className="mt-3 space-y-2 text-sm">
                {topSources.map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="truncate text-slate-700 dark:text-slate-300">{source}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{count}</span>
                  </div>
                ))}
                {topSources.length === 0 && <p className="text-slate-500">Veri yok.</p>}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Son eventler</h2>
              <div className="mt-3 max-h-[420px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-2 py-2">Zaman</th>
                      <th className="px-2 py-2">Tip</th>
                      <th className="px-2 py-2">Kaynak</th>
                      <th className="px-2 py-2">Sayfa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.events || []).map((evt) => (
                      <tr key={evt.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                          {new Date(evt.createdAt).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-2 py-2 text-slate-900 dark:text-slate-100">{evt.eventType}</td>
                        <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{evt.source || 'unknown'}</td>
                        <td className="px-2 py-2 text-slate-500 dark:text-slate-400">{evt.pagePath || '-'}</td>
                      </tr>
                    ))}
                    {(data?.events || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                          Henüz event kaydı yok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">CTA A/B Sonuçları</h2>
              <div className="mt-3 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-2 py-2">Varyant</th>
                      <th className="px-2 py-2">Toplam</th>
                      <th className="px-2 py-2">Telefon</th>
                      <th className="px-2 py-2">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['A', 'B'] as const).map((variant) => (
                      <tr key={variant} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100">{variant}</td>
                        <td className="px-2 py-2">{ctaVariantStats[variant].total}</td>
                        <td className="px-2 py-2">{ctaVariantStats[variant].phone}</td>
                        <td className="px-2 py-2">{ctaVariantStats[variant].whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Landing Performansı</h2>
              <div className="mt-3 max-h-[280px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-2 py-2">Sayfa</th>
                      <th className="px-2 py-2">Toplam</th>
                      <th className="px-2 py-2">Ara</th>
                      <th className="px-2 py-2">WA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPerformance.map((row) => (
                      <tr key={row.page} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-2 py-2 text-slate-700 dark:text-slate-300">{row.page}</td>
                        <td className="px-2 py-2">{row.total}</td>
                        <td className="px-2 py-2">{row.phone}</td>
                        <td className="px-2 py-2">{row.whatsapp}</td>
                      </tr>
                    ))}
                    {landingPerformance.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                          Programatik landing event verisi yok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
