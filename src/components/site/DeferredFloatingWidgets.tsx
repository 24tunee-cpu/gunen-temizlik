'use client';

import dynamic from 'next/dynamic';

const FloatingWhatsApp = dynamic(
  () => import('@/components/site/FloatingWhatsApp').then((mod) => mod.FloatingWhatsApp),
  { ssr: false }
);

const MobileCallBar = dynamic(() => import('@/components/site/MobileCallBar'), {
  ssr: false,
});

const CookieConsent = dynamic(
  () => import('@/components/site/CookieConsent').then((mod) => mod.CookieConsent),
  { ssr: false }
);

export default function DeferredFloatingWidgets() {
  return (
    <>
      <FloatingWhatsApp />
      <MobileCallBar />
      <CookieConsent />
    </>
  );
}
