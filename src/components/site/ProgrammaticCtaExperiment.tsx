'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Variant = 'A' | 'B';

type Props = {
  districtName: string;
  districtSlug: string;
  serviceName: string;
  serviceSlug: string;
};

const STORAGE_KEY = 'programmatic-cta-variant-v1';

function buildWhatsAppLink(message: string, variant: Variant) {
  const base = 'https://wa.me/905467152844';
  const q = new URLSearchParams({
    text: message,
    utm_source: 'programmatic-landing',
    utm_medium: 'cta',
    utm_campaign: 'district-service',
    utm_content: `variant-${variant.toLowerCase()}`,
  });
  return `${base}?${q.toString()}`;
}

export default function ProgrammaticCtaExperiment({
  districtName,
  districtSlug,
  serviceName,
  serviceSlug,
}: Props) {
  const [variant, setVariant] = useState<Variant>('A');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'A' || saved === 'B') {
      setVariant(saved);
      return;
    }
    const next: Variant = Math.random() < 0.5 ? 'A' : 'B';
    window.localStorage.setItem(STORAGE_KEY, next);
    setVariant(next);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    dataLayer?.push({
      event: 'programmatic_cta_impression',
      cta_variant: variant,
      district: districtSlug,
      service: serviceSlug,
    });
  }, [variant, districtSlug, serviceSlug]);

  const cta = useMemo(() => {
    if (variant === 'A') {
      return {
        primaryLabel: 'WhatsApp\'tan Hızlı Teklif Al',
        secondaryLabel: 'İletişim Formu ile Detay Gönder',
        message: `${districtName} bölgesinde ${serviceName} için hızlı teklif almak istiyorum.`,
      };
    }
    return {
      primaryLabel: '30 Dakika İçinde Fiyat Öğren',
      secondaryLabel: 'Bölge Sayfasına Dön',
      message: `${districtName} için ${serviceName} hizmetinde bugün uygun saatleri öğrenmek istiyorum.`,
    };
  }, [variant, districtName, serviceName]);

  const waHref = buildWhatsAppLink(cta.message, variant);

  return (
    <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">CTA Testi V2 - Varyant {variant}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{districtName} için Hızlı Teklif</h2>
      <p className="mt-2 text-sm text-slate-200">
        Bu blokta kullanıcı dönüşümünü artırmak için CTA metinlerini A/B test ediyoruz.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          data-source={`programmatic-cta-${variant.toLowerCase()}-wa`}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
        >
          {cta.primaryLabel}
        </a>
        {variant === 'A' ? (
          <Link
            href={`/iletisim?district=${districtSlug}&service=${serviceSlug}&variant=${variant}`}
            data-source={`programmatic-cta-${variant.toLowerCase()}-form`}
            className="rounded-lg border border-slate-500 px-5 py-2.5 font-medium text-slate-100 transition-colors hover:bg-slate-800"
          >
            {cta.secondaryLabel}
          </Link>
        ) : (
          <Link
            href={`/bolgeler/${districtSlug}`}
            data-source={`programmatic-cta-${variant.toLowerCase()}-district`}
            className="rounded-lg border border-slate-500 px-5 py-2.5 font-medium text-slate-100 transition-colors hover:bg-slate-800"
          >
            {cta.secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
