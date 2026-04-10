/**
 * @fileoverview Toast Notification Component
 * @description Toast bildirimleri için container ve item component'leri.
 * Framer Motion animasyonları, accessibility, ve progress bar ile.
 *
 * @example
 * // Toast container (layout.tsx veya provider'da)
 * <ToastContainer position="top-right" />
 *
 * @example
 * // Toast gönderme
 * toast.success('Başarılı!', { message: 'İşlem tamamlandı' });
 * toast.error('Hata!', { message: 'Bir şeyler yanlış gitti' });
 * toast.promise(promise, {
 *   loading: 'Yükleniyor...',
 *   success: 'Tamamlandı!',
 *   error: 'Hata oluştu',
 * });
 */

'use client';

import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useState, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

/** Toast pozisyonu */
export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

/** Toast container props */
export interface ToastContainerProps {
  /** Pozisyon (varsayılan: top-right) */
  position?: ToastPosition;
  /** Max toast sayısı (varsayılan: 5) */
  limit?: number;
  /** Toast'lar arası gap (varsayılan: 3) */
  gap?: number;
}

// ============================================
// CONFIGURATION
// ============================================

/** Toast ikonları */
const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

/** Toast renkleri (light + dark mode) */
const colors = {
  success:
    'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500',
  error:
    'bg-red-500 text-white border-red-600 dark:bg-red-600 dark:border-red-500',
  warning:
    'bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-500',
  info: 'bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500',
  loading:
    'bg-slate-500 text-white border-slate-600 dark:bg-slate-600 dark:border-slate-500',
};

/** Pozisyon sınıfları */
const positionClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

/**
 * Toast Container Component
 * @param position Toast pozisyonu
 * @param limit Max toast sayısı
 * @returns Toast container
 */
export function ToastContainer({
  position = 'top-right',
  limit = 5,
}: ToastContainerProps) {
  const { toasts, removeToast } = useToastStore();

  // Limit uygula
  const limitedToasts = toasts.slice(0, limit);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Bildirimler"
      className={`fixed z-50 flex flex-col gap-3 w-full max-w-sm ${positionClasses[position]}`}
    >
      <AnimatePresence mode="popLayout">
        {limitedToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            position={position}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual Toast Item Component
 */
interface ToastItemProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading';
    title: string;
    message?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  };
  position: ToastPosition;
  onRemove: () => void;
}

function ToastItem({ toast, position, onRemove }: ToastItemProps) {
  const [isPaused, setIsPaused] = useState(false);
  const Icon = icons[toast.type];
  const isLoading = toast.type === 'loading';

  // Pause on hover handlers
  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  // Progress bar animation duration
  const duration = toast.duration || 5000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: position.includes('left') ? -100 : 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-lg shadow-lg border p-4 flex items-start gap-3 overflow-hidden ${colors[toast.type]}`}
    >
      {/* Progress bar (auto-close countdown) */}
      {!isLoading && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: isPaused ? 0 : 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left"
        />
      )}

      {/* Icon */}
      <Icon
        className={`h-5 w-5 shrink-0 mt-0.5 ${isLoading ? 'animate-spin' : ''}`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-90 mt-1">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove();
            }}
            className="mt-2 text-sm font-medium underline opacity-90 hover:opacity-100 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onRemove}
        aria-label="Bildirimi kapat"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Toast hook re-exports (convenience)
 * @deprecated Direct import from @/store/toastStore recommended
 */
export { useToastStore } from '@/store/toastStore';

export default ToastContainer;
