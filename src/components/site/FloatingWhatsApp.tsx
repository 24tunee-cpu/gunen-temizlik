/**
 * @fileoverview Profesyonel yüzen WhatsApp / canlı iletişim bileşeni
 * @description Site ayarlarından numara, açılır kart, dışarı tıklama / Escape, güvenli alan.
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_CONTACT } from '@/config/site-contact';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

const ENV_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || SITE_CONTACT.whatsappDigits;
const DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ||
  'Merhaba, Günen Temizlik hizmetleri hakkında bilgi almak istiyorum.';

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function normalizeWhatsAppNumber(raw: string | undefined, fallback: string): string {
  const fb = digitsOnly(fallback);
  if (!raw?.trim()) return fb;
  const d = digitsOnly(raw);
  if (d.length >= 10) return d;
  return fb;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 5.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.988c-.001 5.449-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function FloatingWhatsApp({
  phoneNumber: phoneOverride,
  defaultMessage = DEFAULT_MESSAGE,
}: FloatingWhatsAppProps) {
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const primaryCtaRef = useRef<HTMLAnchorElement>(null);

  const waDigits = useMemo(
    () => normalizeWhatsAppNumber(phoneOverride ?? settings.whatsapp, ENV_PHONE),
    [phoneOverride, settings.whatsapp]
  );

  const waUrl = useMemo(() => {
    const q = encodeURIComponent(defaultMessage);
    return `https://wa.me/${waDigits}?text=${q}`;
  }, [waDigits, defaultMessage]);

  const displayPhone = useMemo(() => {
    const d = waDigits;
    if (d.startsWith('90') && d.length >= 12) {
      return `+${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`.trim();
    }
    return d ? `+${d}` : '';
  }, [waDigits]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    primaryCtaRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (open) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open, close]);

  useEffect(() => {
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el || !open) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    };
    if (open) {
      document.addEventListener('mousedown', onPointer);
      document.addEventListener('touchstart', onPointer, { passive: true });
      return () => {
        document.removeEventListener('mousedown', onPointer);
        document.removeEventListener('touchstart', onPointer);
      };
    }
  }, [open, close]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-[95] flex justify-end p-4 sm:p-6 lg:bottom-0"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-none flex w-full max-w-[min(100%,22rem)] flex-col items-end gap-3">
        <AnimatePresence mode="sync">
          {open && (
            <motion.div
              key="panel"
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${panelId}-title`}
              aria-describedby={`${panelId}-desc`}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.98 }
              }
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl ring-1 ring-white/5"
            >
              <div className="relative border-b border-white/10 bg-gradient-to-br from-[#075e54] via-[#128c7e] to-[#25d366] px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25">
                    <WhatsAppGlyph className="h-7 w-7 text-white" />
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#128c7e] bg-emerald-400"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2
                      id={`${panelId}-title`}
                      className="truncate text-base font-semibold tracking-tight text-white"
                    >
                      {settings.siteName || 'Günen Temizlik'}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/90">
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                        aria-hidden
                      />
                      Genelde kısa sürede yanıt veriyoruz
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    aria-label="Pencereyi kapat"
                  >
                    <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-4 py-4">
                <p
                  id={`${panelId}-desc`}
                  className="text-sm leading-relaxed text-slate-300"
                >
                  Ücretsiz keşif, fiyat ve randevu için mesaj bırakın; ekibimiz WhatsApp üzerinden size dönsün.
                </p>

                {settings.workingHours?.trim() && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 text-xs text-slate-400">
                    <Clock className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
                    <span>{settings.workingHours.trim()}</span>
                  </div>
                )}

                <a
                  ref={primaryCtaRef}
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-[#053e2f] shadow-lg shadow-emerald-900/30 transition-transform hover:bg-[#20bd5a] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99]"
                >
                  <WhatsAppGlyph className="h-5 w-5" />
                  WhatsApp&apos;ta yaz
                  <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
                </a>

                {displayPhone && (
                  <p className="text-center text-[11px] text-slate-500">
                    veya numara:{' '}
                    <span className="font-mono text-slate-400">{displayPhone}</span>
                  </p>
                )}

                <Link
                  href="/iletisim"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600/80 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-emerald-500/40 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden />
                  İletişim formu
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          ref={fabRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          className="pointer-events-auto relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-emerald-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:h-[3.75rem] sm:w-[3.75rem]"
          style={{
            background: 'linear-gradient(145deg, #25D366 0%, #128C7E 55%, #075E54 100%)',
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {!reduceMotion && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full bg-emerald-300/20"
              aria-hidden
              animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span className="absolute inset-[3px] rounded-full bg-black/10" aria-hidden />
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <X className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="wa"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative drop-shadow-sm"
              >
                <WhatsAppGlyph className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">
            {open ? 'Canlı desteği kapat' : 'Canlı destek — WhatsApp ve iletişim'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

export default FloatingWhatsApp;
