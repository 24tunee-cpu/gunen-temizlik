/**
 * @fileoverview Floating WhatsApp Component
 * @description Sabit WhatsApp iletişim butonu.
 * Tooltip, animasyon, ve accessibility desteği ile.
 *
 * @example
 * <FloatingWhatsApp />
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

// ============================================
// TYPES
// ============================================

/** FloatingWhatsApp component props */
interface FloatingWhatsAppProps {
  /** WhatsApp telefon numarası (başında + olmadan) */
  phoneNumber?: string;
  /** Varsayılan mesaj */
  defaultMessage?: string;
  /** Tooltip gecikmesi (ms) */
  tooltipDelay?: number;
  /** Tooltip gösterim süresi (ms) */
  tooltipDuration?: number;
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '905551234567';
const DEFAULT_MESSAGE = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ||
  'Merhaba, Günen Temizlik hizmetleri hakkında bilgi almak istiyorum.';
const DEFAULT_TOOLTIP_DELAY = 3000;
const DEFAULT_TOOLTIP_DURATION = 8000;

// ============================================
// COMPONENT
// ============================================

/**
 * Floating WhatsApp Button Component
 * @param phoneNumber WhatsApp phone number (without +)
 * @param defaultMessage Default message
 * @param tooltipDelay Delay before showing tooltip
 * @param tooltipDuration Duration to show tooltip
 */
export function FloatingWhatsApp({
  phoneNumber = DEFAULT_PHONE,
  defaultMessage = DEFAULT_MESSAGE,
  tooltipDelay = DEFAULT_TOOLTIP_DELAY,
  tooltipDuration = DEFAULT_TOOLTIP_DURATION
}: FloatingWhatsAppProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const encodedMessage = useCallback(() =>
    encodeURIComponent(defaultMessage),
    [defaultMessage]
  );

  // ============================================
  // TOOLTIP TIMERS
  // ============================================
  useEffect(() => {
    if (isDismissed) return;

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, tooltipDelay);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, tooltipDelay + tooltipDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [tooltipDelay, tooltipDuration, isDismissed]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTooltip) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showTooltip]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDismissTooltip = useCallback(() => {
    setShowTooltip(false);
    setIsDismissed(true);
  }, []);

  const handleTooltipToggle = useCallback(() => {
    setShowTooltip((prev) => !prev);
  }, []);

  return (
    <>
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.3 }}
            className="fixed bottom-24 right-6 z-50 max-w-xs rounded-lg bg-slate-800 p-4 text-white shadow-lg"
            role="dialog"
            aria-modal="false"
            aria-label="WhatsApp yardım mesajı"
          >
            <button
              onClick={handleDismissTooltip}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-white hover:bg-slate-500 transition-colors"
              aria-label="Tooltip'i kapat"
            >
              <X size={14} aria-hidden="true" />
            </button>
            <p className="text-sm">
              Size nasıl yardımcı olabiliriz? WhatsApp üzerinden hemen bize ulaşın!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Button */}
      <motion.a
        ref={buttonRef}
        href={`https://wa.me/${phoneNumber}?text=${encodedMessage()}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: shouldReduceMotion ? 1 : 0 }}
        animate={{ scale: 1 }}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
        onClick={handleTooltipToggle}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        aria-label="WhatsApp üzerinden iletişime geç"
        aria-haspopup="dialog"
        aria-expanded={showTooltip}
      >
        <MessageCircle size={28} fill="white" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
        </span>
      </motion.a>
    </>
  );
}

export default FloatingWhatsApp;
