'use client';

type GaWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (command: string, ...args: unknown[]) => void;
};

/** GA4 / GTM dataLayer — form ve özel dönüşümler için */
export function trackGa4Event(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const w = window as GaWindow;
    const p = params ?? {};
    w.dataLayer?.push({ event: eventName, ...p });
    w.gtag?.('event', eventName, p);
  } catch {
    /* ignore */
  }
}
