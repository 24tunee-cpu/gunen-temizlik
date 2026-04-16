'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { Loader2 } from 'lucide-react';

export default function AdminMarketingContentPage() {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoJson, setPromoJson] = useState('{}');
  const [trustJson, setTrustJson] = useState('[]');
  const [templatesJson, setTemplatesJson] = useState('{}');
  const [variant, setVariant] = useState('A');
  const [consentV, setConsentV] = useState('1');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-marketing', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPromoJson(JSON.stringify(d.promoBannerJson ?? { active: false }, null, 2));
      setTrustJson(JSON.stringify(d.trustBandItemsJson ?? [], null, 2));
      setTemplatesJson(JSON.stringify(d.messageTemplatesJson ?? {}, null, 2));
      setVariant(String(d.marketingBannerVariant || 'A'));
      setConsentV(String(d.consentPolicyVersion || '1'));
    } catch {
      toast.error('Hata', 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePromoActive = (nextActive: boolean) => {
    try {
      const current = JSON.parse(promoJson || '{}') as Record<string, unknown>;
      const updated = { ...current, active: nextActive };
      setPromoJson(JSON.stringify(updated, null, 2));
    } catch {
      toast.error('JSON', 'Önce geçerli bir promo JSON girin');
    }
  };

  const save = async () => {
    let promo;
    let trust;
    let tpl;
    try {
      promo = JSON.parse(promoJson);
      trust = JSON.parse(trustJson);
      tpl = JSON.parse(templatesJson);
    } catch {
      toast.error('JSON', 'Geçerli JSON girin');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-marketing', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoBannerJson: promo,
          trustBandItemsJson: trust,
          messageTemplatesJson: tpl,
          marketingBannerVariant: variant,
          consentPolicyVersion: consentV,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Kaydedildi', 'Ön yüz birkaç saniye içinde güncellenir.');
    } catch {
      toast.error('Hata', 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pazarlama ve güven içeriği</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <code>promoBannerJson</code>:{' '}
        <code>{`{ "active", "title", "body", "ctaLabel", "ctaHref", "dismissible" }`}</code>
        <br />
        <code>trustBandItemsJson</code>: kısa metin dizisi. <code>messageTemplatesJson</code>: kopyalanacak şablon metinleri.
      </p>
      <div className="flex items-center justify-between gap-4">
        <label className="block text-sm font-medium">Üst banner (JSON)</label>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-slate-500 dark:text-slate-400">Durum:</span>
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(promoJson || '{}') as { active?: boolean };
                togglePromoActive(!parsed.active);
              } catch {
                togglePromoActive(true);
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {/* basit text toggle */}
            {(function () {
              try {
                const parsed = JSON.parse(promoJson || '{}') as { active?: boolean };
                return parsed.active ? 'Kapat' : 'Aç';
              } catch {
                return 'Aç/Kapat';
              }
            })()}
          </button>
        </div>
      </div>
      <textarea
        value={promoJson}
        onChange={(e) => setPromoJson(e.target.value)}
        rows={10}
        className="w-full rounded-lg border border-slate-300 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <label className="block text-sm font-medium">Güven bandı maddeleri (JSON dizi)</label>
      <textarea
        value={trustJson}
        onChange={(e) => setTrustJson(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-slate-300 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <label className="block text-sm font-medium">Mesaj şablonları (JSON)</label>
      <textarea
        value={templatesJson}
        onChange={(e) => setTemplatesJson(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-slate-300 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Banner A/B
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="ml-2 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <label className="text-sm">
          Çerez metni sürümü
          <input
            value={consentV}
            onChange={(e) => setConsentV(e.target.value)}
            className="ml-2 w-24 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  );
}
