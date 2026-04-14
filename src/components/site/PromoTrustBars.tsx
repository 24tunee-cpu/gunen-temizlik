'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { X, Shield } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

type Promo = {
  active?: boolean;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  dismissible?: boolean;
};

export function PromoBanner() {
  const { settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);

  const promo = useMemo(() => {
    const raw = settings.promoBannerJson;
    if (!raw || typeof raw !== 'object') return null;
    return raw as Promo;
  }, [settings.promoBannerJson]);

  if (dismissed || !promo?.active || !promo.title) return null;

  const dismissible = promo.dismissible !== false;

  return (
    <div className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 text-center dark:border-amber-900/40 dark:from-amber-950/50 dark:to-slate-900">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-sm text-amber-950 dark:text-amber-100">
        <span className="font-semibold">{promo.title}</span>
        {promo.body ? <span className="text-amber-900/90 dark:text-amber-200/90">{promo.body}</span> : null}
        {promo.ctaLabel && promo.ctaHref ? (
          <Link
            href={promo.ctaHref}
            className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {promo.ctaLabel}
          </Link>
        ) : null}
        {dismissible ? (
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setDismissed(true)}
            className="ml-1 rounded p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TrustBand() {
  const { settings } = useSiteSettings();
  const items = useMemo(() => {
    const raw = settings.trustBandItemsJson;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 5);
  }, [settings.trustBandItemsJson]);

  if (items.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
        <Shield className="hidden h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 sm:block" aria-hidden />
        {items.map((text) => (
          <span key={text} className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
