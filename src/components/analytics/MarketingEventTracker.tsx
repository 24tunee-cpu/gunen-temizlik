'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

function pushEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: eventName, ...params });
  window.gtag?.('event', eventName, params);
}

function sendToBackend(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/marketing-events', blob);
    return;
  }

  void fetch('/api/marketing-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
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
        const payload = {
          link_url: href,
          link_text: text,
          source,
          location,
        };
        pushEvent('phone_click', payload);
        sendToBackend({ eventType: 'phone_click', ...payload });
        return;
      }

      if (href.includes('wa.me') || href.includes('whatsapp.com')) {
        const payload = {
          link_url: href,
          link_text: text,
          source,
          location,
        };
        pushEvent('whatsapp_click', payload);
        sendToBackend({ eventType: 'whatsapp_click', ...payload });
        return;
      }

      if (href.startsWith('mailto:')) {
        const payload = {
          link_url: href,
          link_text: text,
          source,
          location,
        };
        pushEvent('email_click', payload);
        sendToBackend({ eventType: 'email_click', ...payload });
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
