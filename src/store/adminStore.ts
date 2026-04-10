/**
 * @fileoverview Admin Panel State Yönetimi - Zustand Store
 * @description Sidebar durumu, mobil uyumluluk, ve kullanıcı tercihleri.
 * Otomatik mobil algılama ve localStorage persist içerir.
 *
 * @example
 * // Hook kullanımı
 * const { sidebarOpen, toggleSidebar, setSidebarOpen, isMobile } = useAdminStore();
 *
 * // Sidebar aç/kapat
 * toggleSidebar();
 *
 * // Manuel ayarlama
 * setSidebarOpen(false);
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ui/admin');

/** Mobil breakpoint (px) - lg tailwind breakpoint */
const MOBILE_BREAKPOINT = 1024;

/** Storage key */
const STORAGE_KEY = 'admin-storage';

/** Admin panel state arayüzü */
export interface AdminState {
  /** Sidebar açık/kapalı durumu */
  sidebarOpen: boolean;
  /** Mobil görünüm modu */
  isMobile: boolean;
  /** Sidebar toggle (aç/kapat) */
  toggleSidebar: () => void;
  /** Sidebar durumunu ayarla */
  setSidebarOpen: (open: boolean) => void;
  /** Mobil modu ayarla */
  setIsMobile: (isMobile: boolean) => void;
  /** Mobil'de sidebar kapat (overlay click için) */
  closeSidebarOnMobile: () => void;
}

/**
 * Ekran boyutu kontrolü
 * @returns {boolean} true = mobil
 */
function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Admin Panel Zustand Store
 *
 * Özellikler:
 * - Sidebar durumu persist (localStorage)
 * - Otomatik mobil algılama
 * - Mobil'de sidebar otomatik kapanma
 * - SSR-safe hydration
 */
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      isMobile: false,

      toggleSidebar: () => {
        set((state) => {
          const newState = !state.sidebarOpen;
          logger.debug('Sidebar toggled', { from: state.sidebarOpen, to: newState });
          return { sidebarOpen: newState };
        });
      },

      setSidebarOpen: (open) => {
        logger.debug('Sidebar state set', { open });
        set({ sidebarOpen: open });
      },

      setIsMobile: (isMobile) => {
        const prevMobile = get().isMobile;
        if (prevMobile !== isMobile) {
          logger.debug('Mobile mode changed', { isMobile });
          set({ isMobile });

          // Mobil'e geçişte sidebar'ı kapat
          if (isMobile) {
            set({ sidebarOpen: false });
          } else {
            // Desktop'a geçişte sidebar'ı aç
            set({ sidebarOpen: true });
          }
        }
      },

      closeSidebarOnMobile: () => {
        if (get().isMobile) {
          logger.debug('Sidebar closed on mobile');
          set({ sidebarOpen: false });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // SSR'da hydration mismatch önle
      skipHydration: true,
      // Sadece sidebarOpen kaydet, isMobile runtime'da hesaplanır
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);

/** Aktif listener'ı temizlemek için */
let resizeCleanup: (() => void) | null = null;

/**
 * Admin store başlatma - Layout'da bir kez çağrılır
 * Mobil algılama ve resize listener kurar
 *
 * @returns Cleanup function (StrictMode için)
 */
export function initAdminStore(): () => void {
  // SSR check
  if (typeof window === 'undefined') {
    return () => { }; // Noop cleanup
  }

  // Önceki listener'ı temizle
  if (resizeCleanup) {
    resizeCleanup();
    resizeCleanup = null;
  }

  // İlk mobil kontrol
  const isMobile = checkIsMobile();
  useAdminStore.setState({ isMobile });

  // Mobil'e geçişte sidebar'ı kapat
  if (isMobile) {
    useAdminStore.setState({ sidebarOpen: false });
  }

  // Resize listener
  const handleResize = () => {
    const newIsMobile = checkIsMobile();
    useAdminStore.getState().setIsMobile(newIsMobile);
  };

  window.addEventListener('resize', handleResize);

  resizeCleanup = () => {
    window.removeEventListener('resize', handleResize);
  };

  return resizeCleanup;
}
