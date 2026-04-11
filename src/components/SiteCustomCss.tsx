'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const STYLE_ID = 'site-settings-custom-css';

/**
 * Admin panelde çalışmaz; sitede API'den gelen özel CSS'i <head>'e enjekte eder.
 */
export function SiteCustomCss() {
  const pathname = usePathname();
  const { settings, isLoading } = useSiteSettings();

  useEffect(() => {
    if (isLoading || pathname?.startsWith('/admin')) {
      return;
    }
    const css = settings.customCss?.trim();
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!css) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }, [settings.customCss, isLoading, pathname]);

  return null;
}
