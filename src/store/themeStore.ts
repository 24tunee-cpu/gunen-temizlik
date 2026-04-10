/**
 * @fileoverview Tema Yönetim Sistemi - Zustand Store
 * @description Dark/Light/Sistem teması yönetimi. View transitions,
 * CSS variables sync, ve hydration-safe SSR desteği içerir.
 *
 * @example
 * // Hook kullanımı
 * const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
 *
 * // Tema değiştirme
 * setTheme('dark');
 * toggleTheme(); // light ↔ dark
 *
 * // Component dışında
 * initTheme(); // Layout/Provider'da bir kez çağrılır
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ui/theme');

/** Kullanıcı seçebileceği tema tipleri */
export type Theme = 'light' | 'dark' | 'system';

/** Gerçekte uygulanan tema (system çözümlenmiş hali) */
export type ResolvedTheme = 'light' | 'dark';

/** Tema state arayüzü */
export interface ThemeState {
  /** Kullanıcının seçtiği tema (light/dark/system) */
  theme: Theme;
  /** Çözümlenmiş tema (light/dark) - UI render için */
  resolvedTheme: ResolvedTheme;
  /** Tema değiştir */
  setTheme: (theme: Theme) => void;
  /** Light ↔ Dark toggle (sistem modunu aşar) */
  toggleTheme: () => void;
}

/** System tema algılama */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Theme → ResolvedTheme çözümleme */
export function getResolvedTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

/** Tema transition'ı başlat (görsel yumuşak geçiş) */
function startViewTransition(callback: () => void) {
  if (typeof document === 'undefined') {
    callback();
    return;
  }

  // View Transitions API destekleniyorsa kullan
  if ('startViewTransition' in document && document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}

/** CSS custom properties sync (TBD için ileriye dönük) */
function syncCSSVariables(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  // Root CSS değişkenleri senkronize et
  const root = document.documentElement;
  root.style.setProperty('--theme', theme);
  root.style.setProperty('--color-scheme', theme);
}

/** DOM'a tema uygula */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const resolved = getResolvedTheme(theme);

  startViewTransition(() => {
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    syncCSSVariables(resolved);
  });
}

/** Storage key (değiştirilebilir) */
const STORAGE_KEY = 'theme-storage';

/**
 * Tema Zustand Store
 *
 * Özellikler:
 * - SSR-safe hydration (skipHydration)
 * - LocalStorage persist
 * - View transitions desteği
 * - System theme change listener
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolved = getResolvedTheme(theme);
        const prevTheme = get().theme;

        set({ theme, resolvedTheme: resolved });
        applyTheme(theme);

        logger.info('Theme changed', { from: prevTheme, to: theme, resolved });
      },

      toggleTheme: () => {
        const currentResolved = get().resolvedTheme;
        const newTheme: ResolvedTheme = currentResolved === 'light' ? 'dark' : 'light';
        const prevTheme = get().theme;

        set({ theme: newTheme, resolvedTheme: newTheme });
        applyTheme(newTheme);

        logger.info('Theme toggled', { from: prevTheme, to: newTheme });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // SSR'da hydration mismatch önle
      skipHydration: true,
      // Sadece theme kaydet, resolvedTheme hesaplanır
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

/** Aktif listener'ı temizlemek için */
let mediaQueryCleanup: (() => void) | null = null;

/**
 * Tema başlatma - Layout/Provider'da bir kez çağrılır
 *
 * @returns Cleanup function (StrictMode için)
 */
export function initTheme(): () => void {
  // SSR check
  if (typeof window === 'undefined') {
    return () => { }; // Noop cleanup
  }

  // Önceki listener'ı temizle (StrictMode double-mount için)
  if (mediaQueryCleanup) {
    mediaQueryCleanup();
    mediaQueryCleanup = null;
  }

  try {
    // Hydrate sonrası store'dan tema uygula
    const { theme } = useThemeStore.getState();
    const resolved = getResolvedTheme(theme);

    // Sync store resolvedTheme
    useThemeStore.setState({ resolvedTheme: resolved });
    applyTheme(theme);

    // System theme listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const current = useThemeStore.getState().theme;
      if (current === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        useThemeStore.setState({ resolvedTheme: newResolved });
        applyTheme('system');
        logger.debug('System theme changed', { resolved: newResolved });
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    mediaQueryCleanup = () => {
      mediaQuery.removeEventListener('change', handleChange);
    };

    return mediaQueryCleanup;
  } catch (error) {
    logger.error('Theme initialization failed', { error });
    applyTheme('system');
    return () => { };
  }
}

/**
 * Mevcut tema bilgisi (React dışında kullanım için)
 * @returns {Theme, ResolvedTheme} Tema bilgisi
 */
export function getCurrentTheme(): { theme: Theme; resolvedTheme: ResolvedTheme } {
  if (typeof window === 'undefined') {
    return { theme: 'system', resolvedTheme: 'light' };
  }
  return useThemeStore.getState();
}
