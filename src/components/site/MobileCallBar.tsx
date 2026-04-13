'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_CONTACT, toTelHref } from '@/config/site-contact';

export default function MobileCallBar() {
  const { settings } = useSiteSettings();

  const phoneDisplay = settings.phone?.trim() || SITE_CONTACT.phoneDisplay;
  const telHref = toTelHref(settings.phone?.trim() || SITE_CONTACT.phoneE164);
  const waDigits = (settings.whatsapp?.trim() || SITE_CONTACT.whatsappDigits).replace(/\D/g, '');
  const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    'Merhaba, temizlik hizmeti için hızlı teklif almak istiyorum.'
  )}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-900/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <p className="mb-2 text-center text-xs text-slate-300">Hızlı dönüş: Genelde 30 dakika içinde geri dönüş yapıyoruz.</p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={telHref}
          data-source="mobile-call-bar"
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 font-medium text-white"
          aria-label={`Hemen ara: ${phoneDisplay}`}
        >
          <Phone className="h-4 w-4" aria-hidden />
          Ara
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          data-source="mobile-call-bar"
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-500 px-3 py-2.5 font-medium text-slate-100"
          aria-label="WhatsApp ile yaz"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
