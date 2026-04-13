'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Cpu, Loader2 } from 'lucide-react';
import { MAP_PLATFORM_META, type MapPlatformId } from '@/lib/map-platforms-data';

type NonGooglePlatform = Exclude<MapPlatformId, 'google'>;

type ApiPayload = {
  platform?: string;
  phase?: string;
  summary?: string;
  docUrl?: string;
};

export function ProviderPlaceholder({ platform }: { platform: NonGooglePlatform }) {
  const meta = MAP_PLATFORM_META[platform];
  const [data, setData] = useState<ApiPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/maps/providers?platform=${platform}`, { credentials: 'include' });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as ApiPayload;
      if (!cancelled) setData(j);
    })();
    return () => {
      cancelled = true;
    };
  }, [platform]);

  return (
    <div className="space-y-6">
      <div className={cnGradient(meta)}>
        <h2 className="text-xl font-bold">{meta.label}</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/90">{meta.description}</p>
        <a
          href={meta.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/25"
        >
          Dokümantasyon <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <Cpu className="h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">API entegrasyon durumu</h3>
            {!data ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.summary}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Faz: <span className="font-mono">{data.phase}</span> — OAuth, webhook veya resmi feed ile tam otomasyon bu
                  platform için ayrıca geliştirilecek.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Bu sekmedeki manuel alanlar (aşağıda) ve checklist, API gelene kadar operasyonu kayıt altında tutar.
      </p>
    </div>
  );
}

function cnGradient(meta: (typeof MAP_PLATFORM_META)[NonGooglePlatform]) {
  return `rounded-2xl bg-gradient-to-r p-6 text-white shadow-lg ${meta.accent}`;
}
