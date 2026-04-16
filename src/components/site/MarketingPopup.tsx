'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_CONTACT, toTelHref } from '@/config/site-contact';

const POPUP_HIDE_UNTIL_KEY = 'marketing-popup-hide-until';
const HIDE_FOR_MS = 24 * 60 * 60 * 1000; // 1 day
const MOBILE_SHOW_DELAY_MS = 8_000;

function getHideUntil(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(POPUP_HIDE_UNTIL_KEY);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function hideForOneDay() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(POPUP_HIDE_UNTIL_KEY, String(Date.now() + HIDE_FOR_MS));
}

export function MarketingPopup() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const isBlogDetail = useMemo(
    () => pathname.startsWith('/blog/') && pathname !== '/blog',
    [pathname]
  );

  const phoneDisplay = settings.phone?.trim() || SITE_CONTACT.phoneDisplay;
  const telHref = toTelHref(settings.phone?.trim() || SITE_CONTACT.phoneE164);
  const waDigits = (settings.whatsapp?.trim() || SITE_CONTACT.whatsappDigits).replace(/\D/g, '');
  const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    'Merhaba, hızlı fiyat almak istiyorum.'
  )}`;

  const closePopup = useCallback(() => {
    hideForOneDay();
    setOpen(false);
  }, []);

  const onPrimaryCta = useCallback(() => {
    hideForOneDay();
    setOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isBlogDetail) return;
    if (getHideUntil() > Date.now()) return;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (isDesktop) {
      const handleExitIntent = (event: MouseEvent) => {
        if (event.clientY > 0 || event.relatedTarget !== null) return;
        setOpen(true);
        document.removeEventListener('mouseout', handleExitIntent);
      };

      document.addEventListener('mouseout', handleExitIntent);
      return () => document.removeEventListener('mouseout', handleExitIntent);
    }

    const timeout = window.setTimeout(() => {
      setOpen(true);
    }, MOBILE_SHOW_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [mounted, isBlogDetail]);

  if (!mounted || !open || isBlogDetail) return null;

  return (
    <aside
      className="fixed inset-x-4 bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] z-[105] rounded-2xl border border-emerald-400/30 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur md:inset-x-auto md:left-4 md:bottom-4 md:w-[24rem] lg:bottom-4"
      role="dialog"
      aria-label="Hızlı fiyat teklifi"
    >
      <button
        type="button"
        onClick={closePopup}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Popup kapat"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
        <Sparkles className="h-3.5 w-3.5" />
        Bugün hızlı teklif alın
      </div>

      <h3 className="text-lg font-bold leading-tight">
        Temizlik hizmetiniz için hemen fiyat alın
      </h3>
      <p className="mt-1 text-sm text-slate-200">
        Ekibimiz genellikle 30 dakika içinde dönüş yapar.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={telHref}
          data-source="marketing-popup-call"
          onClick={onPrimaryCta}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          aria-label={`Hemen ara: ${phoneDisplay}`}
        >
          <Phone className="h-4 w-4" />
          Ara
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          data-source="marketing-popup-whatsapp"
          onClick={onPrimaryCta}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-500 px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
          aria-label="WhatsApp ile yaz"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>

      <Link
        href="/iletisim"
        onClick={onPrimaryCta}
        className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
      >
        Hemen Fiyat Al
      </Link>
    </aside>
  );
}

export default MarketingPopup;
