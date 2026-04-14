'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useSiteSettings } from '@/context/SiteSettingsContext';

interface DeferredAnalyticsProps {
  measurementId: string;
}

function hasCookieConsent(storageKey: string): boolean {
  try {
    if (localStorage.getItem(storageKey)) return true;

    // Geriye uyumluluk: önceki consent versiyonlarını da kabul et.
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('cookie-consent-v') && localStorage.getItem(key)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export default function DeferredAnalytics({ measurementId }: DeferredAnalyticsProps) {
  const { settings, isLoading } = useSiteSettings();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isLoading || !measurementId) return;

    const version = settings.consentPolicyVersion || '1';
    const storageKey = `cookie-consent-v${version}`;
    const consentGiven = hasCookieConsent(storageKey);
    setEnabled(consentGiven);

    if (consentGiven) return;

    const onAccepted = () => {
      if (hasCookieConsent(storageKey)) setEnabled(true);
    };

    window.addEventListener('cookie-consent-accepted', onAccepted as EventListener);
    window.addEventListener('focus', onAccepted);
    return () => {
      window.removeEventListener('cookie-consent-accepted', onAccepted as EventListener);
      window.removeEventListener('focus', onAccepted);
    };
  }, [isLoading, measurementId, settings.consentPolicyVersion]);

  if (!measurementId || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
