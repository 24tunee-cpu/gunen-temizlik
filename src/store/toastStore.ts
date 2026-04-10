/**
 * @fileoverview Toast Bildirim Sistemi - Zustand Store
 * @description Uygulama genelinde tutarlı toast bildirimleri yönetir.
 * Otomatik kaldırma, promise desteği, ve toast limiti içerir.
 *
 * @example
 * // Basit kullanım
 * toast.success('Başarılı!', 'İşlem tamamlandı');
 *
 * // Promise ile
 * toast.promise(
 *   fetchData(),
 *   {
 *     loading: 'Yükleniyor...',
 *     success: 'Veriler geldi',
 *     error: 'Hata oluştu'
 *   }
 * );
 */

'use client';

import { create } from 'zustand';

/** Toast tipi - görsel hiyerarşi ve ikon belirler */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** Toast eylem butonu yapılandırması */
export interface ToastAction {
  /** Buton etiketi */
  label: string;
  /** Tıklama handler'ı */
  onClick: () => void;
  /** Buton varyantı */
  variant?: 'primary' | 'secondary' | 'danger';
}

/** Toast bildirim arayüzü */
export interface Toast {
  /** Benzersiz tanımlayıcı */
  id: string;
  /** Bildirim tipi */
  type: ToastType;
  /** Başlık (tek satır, kısa) */
  title: string;
  /** Detay mesajı (opsiyonel, 2 satır max önerilir) */
  message?: string;
  /** Otomatik kaldırma süresi (ms). 0 = manuel kaldırma */
  duration?: number;
  /** Eylem butonu */
  action?: ToastAction;
  /** Oluşturulma zamanı (ISO 8601) */
  createdAt: string;
}

/** Toast oluşturma input'u (id hariç) */
export type ToastInput = Omit<Toast, 'id' | 'createdAt'>;

/** Promise toast yapılandırması */
export interface PromiseToastOptions<T> {
  /** Yükleniyor mesajı */
  loading: string;
  /** Başarı mesajı (string veya dönüş verisine bağlı fonksiyon) */
  success: string | ((data: T) => string);
  /** Hata mesajı (string veya hataya bağlı fonksiyon) */
  error: string | ((error: unknown) => string);
  /** Başarı toast süresi */
  successDuration?: number;
  /** Hata toast süresi */
  errorDuration?: number;
}

/** Toast store state arayüzü */
interface ToastState {
  /** Aktif toast'lar listesi */
  toasts: Toast[];
  /** Yeni toast ekle */
  addToast: (toast: ToastInput) => string;
  /** Belirli toast'u kaldır */
  removeToast: (id: string) => void;
  /** Tüm toast'ları temizle */
  clearAll: () => void;
  /** Toast güncelle (promise için loading → success/error) */
  updateToast: (id: string, updates: Partial<ToastInput>) => void;
}

/** Maksimum aynı anda gösterilebilir toast sayısı */
const MAX_TOASTS = 5;

/** Varsayılan toast süreleri (ms) */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 5000,
  error: 8000,
  warning: 6000,
  info: 5000,
  loading: 0, // Loading toast'lar manuel kaldırılır
};

/**
 * Güvenli UUID üretimi
 * @returns Benzersiz 9 karakterlik ID
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().substring(0, 9);
  }
  // Fallback: timestamp + random
  return `${Date.now().toString(36).substring(2, 9)}${Math.random().toString(36).substring(2, 5)}`;
}

/** Aktif timeout'ları takip etmek için (memory leak önlemi) */
const activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Toast Zustand Store
 *
 * Özellikler:
 * - Otomatik kaldırma (timeout)
 * - Toast limiti (FIFO - First In First Out)
 * - Memory leak koruması (timeout cleanup)
 * - Promise desteği için update mekanizması
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];

    // Log level seçimi
    if (toast.type === 'error') {
      console.error('Toast: Error displayed', { title: toast.title, message: toast.message });
    } else {
      console.debug('Toast added', { type: toast.type, title: toast.title, id });
    }

    set((state) => {
      // FIFO: Eski toast'ları kaldır (max limit aşılırsa)
      let newToasts = [...state.toasts, { ...toast, id, createdAt }];
      if (newToasts.length > MAX_TOASTS) {
        const removed = newToasts.shift(); // İlk ekleneni kaldır
        if (removed) {
          // Eski toast'un timeout'unu temizle
          const existingTimeout = activeTimeouts.get(removed.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            activeTimeouts.delete(removed.id);
          }
        }
      }
      return { toasts: newToasts };
    });

    // Otomatik kaldırma (duration > 0 ise)
    if (duration > 0) {
      const timeout = setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
        activeTimeouts.delete(id);
      }, duration);
      activeTimeouts.set(id, timeout);
    }

    return id;
  },

  removeToast: (id) => {
    // Timeout'u temizle
    const timeout = activeTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      activeTimeouts.delete(id);
    }

    console.debug('Toast removed', { id });
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    console.debug('Toast updated', { id, updates: Object.keys(updates) });
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  clearAll: () => {
    // Tüm timeout'ları temizle (memory leak önlemi)
    activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    activeTimeouts.clear();

    console.log('All toasts cleared');
    set({ toasts: [] });
  },
}));

/**
 * Store dışarıdan erişim için (promise toast'lar için gerekli)
 * React dışında kullanılabilir
 */
const getToastState = () => useToastStore.getState();

/**
 * ============================================
 * HELPER FONKSİYONLARI (Toast API)
 * ============================================
 */

/**
 * Toast API - Basit kullanım için static metodlar
 *
 * @example
 * toast.success('Kaydedildi!');
 * toast.error('Hata oluştu', 'Lütfen tekrar deneyin');
 * toast.promise(fetchData(), { loading: 'Yükleniyor...', success: 'Tamam', error: 'Hata' });
 */
export const toast = {
  /**
   * Başarı toast'ı göster
   * @param title - Başlık
   * @param message - Detay mesajı (opsiyonel)
   * @param duration - Süre (ms, opsiyonel, varsayılan: 5000)
   */
  success: (title: string, message?: string, duration?: number) => {
    getToastState().addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  /**
   * Hata toast'ı göster (daha uzun süre görünür)
   * @param title - Başlık
   * @param message - Detay mesajı (opsiyonel)
   * @param duration - Süre (ms, opsiyonel, varsayılan: 8000)
   */
  error: (title: string, message?: string, duration?: number) => {
    getToastState().addToast({
      type: 'error',
      title,
      message,
      duration,
    });
  },

  /**
   * Uyarı toast'ı göster
   * @param title - Başlık
   * @param message - Detay mesajı (opsiyonel)
   * @param duration - Süre (ms, opsiyonel, varsayılan: 6000)
   */
  warning: (title: string, message?: string, duration?: number) => {
    getToastState().addToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  /**
   * Bilgi toast'ı göster
   * @param title - Başlık
   * @param message - Detay mesajı (opsiyonel)
   * @param duration - Süre (ms, opsiyonel, varsayılan: 5000)
   */
  info: (title: string, message?: string, duration?: number) => {
    getToastState().addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  },

  /**
   * Loading toast'ı göster (manuel kaldırma gerekir veya promise ile)
   * @param title - Başlık
   * @param message - Detay mesajı (opsiyonel)
   * @returns Toast ID (manuel kaldırmak için)
   */
  loading: (title: string, message?: string): string => {
    return getToastState().addToast({
      type: 'loading',
      title,
      message,
      duration: 0, // Manuel kaldırma
    });
  },

  /**
   * Belirli toast'u kaldır
   * @param id - Toast ID'si
   */
  dismiss: (id: string) => {
    getToastState().removeToast(id);
  },

  /**
   * Tüm toast'ları temizle
   */
  clearAll: () => {
    getToastState().clearAll();
  },

  /**
   * Promise wrapper - Async işlemler için loading → success/error pattern
   *
   * @example
   * toast.promise(
   *   saveData(formData),
   *   {
   *     loading: 'Kaydediliyor...',
   *     success: (data) => `${data.name} kaydedildi`,
   *     error: (err) => `Hata: ${err.message}`
   *   }
   * );
   */
  promise: async <T>(
    promise: Promise<T>,
    options: PromiseToastOptions<T>
  ): Promise<T> => {
    const { loading, success, error, successDuration, errorDuration } = options;

    // Loading toast'ı göster
    const id = getToastState().addToast({
      type: 'loading',
      title: loading,
      duration: 0, // Manuel kaldırma
    });

    try {
      const data = await promise;

      // Success'a dönüştür
      const successMessage = typeof success === 'function' ? success(data) : success;
      getToastState().updateToast(id, {
        type: 'success',
        title: successMessage,
        duration: successDuration ?? DEFAULT_DURATIONS.success,
      });

      return data;
    } catch (err) {
      // Error'a dönüştür
      const errorMessage = typeof error === 'function' ? error(err) : error;
      getToastState().updateToast(id, {
        type: 'error',
        title: 'Hata',
        message: errorMessage,
        duration: errorDuration ?? DEFAULT_DURATIONS.error,
      });

      throw err;
    }
  },

  /**
   * Custom toast ile action butonu
   *
   * @example
   * toast.custom({
   *   type: 'info',
   *   title: 'Yeni versiyon!',
   *   message: 'Sayfayı yenileyin',
   *   action: {
   *     label: 'Yenile',
   *     onClick: () => window.location.reload()
   *   }
   * });
   */
  custom: (toast: ToastInput): string => {
    return getToastState().addToast(toast);
  },
};
