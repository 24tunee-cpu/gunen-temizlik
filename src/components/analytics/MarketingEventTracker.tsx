'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void;
  }
}

function pushEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: eventName, ...params });
  window.gtag?.('event', eventName, params);
}

export default function MarketingEventTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = (anchor.getAttribute('href') || '').trim();
      if (!href) return;

      const text = (anchor.textContent || '').trim().slice(0, 80);
      const source = anchor.dataset.source || 'unknown';
      const location = window.location.pathname;

      if (href.startsWith('tel:')) {
        pushEvent('phone_click', {
          link_url: href,
          link_text: text,
          source,
          location,
        });
        return;
      }

      if (href.includes('wa.me') || href.includes('whatsapp.com')) {
        pushEvent('whatsapp_click', {
          link_url: href,
          link_text: text,
          source,
          location,
        });
        return;
      }

      if (href.startsWith('mailto:')) {
        pushEvent('email_click', {
          link_url: href,
          link_text: text,
          source,
          location,
        });
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
