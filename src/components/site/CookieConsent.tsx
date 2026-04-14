'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import Link from 'next/link';

export function CookieConsent() {
  const { settings, isLoading } = useSiteSettings();
  const version = settings.consentPolicyVersion || '1';
  const storageKey = `cookie-consent-v${version}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    try {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [isLoading, storageKey]);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
      window.dispatchEvent(new CustomEvent('cookie-consent-accepted', { detail: { storageKey } }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, [storageKey]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez ve gizlilik"
      className="fixed inset-x-0 bottom-[5.5rem] z-[110] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 lg:bottom-0"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Deneyimi geliştirmek ve trafiği ölçmek için çerez ve benzeri teknolojiler kullanıyoruz. Devam ederek{' '}
          <Link href="/gizlilik" className="font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400">
            gizlilik politikamızı
          </Link>{' '}
          kabul etmiş olursunuz.
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
