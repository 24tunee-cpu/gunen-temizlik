/**
 * @fileoverview Theme Toggle Components
 * @description Dark/Light/System tema değiştirme bileşenleri.
 * SSR-safe, animasyonlu, ve accessible.
 *
 * @example
 * // Basit toggle
 * <ThemeToggle />
 *
 * @example
 * // Seçici (light/dark/system)
 * <ThemeSelector />
 */

'use client';

import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ============================================
// THEME TOGGLE
// ============================================

/**
 * Basit tema toggle butonu (dark ↔ light)
 * @returns Theme toggle button
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + Shift + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors flex items-center justify-center"
      aria-label={label}
      title={`${label} (Ctrl+Shift+L)`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={shouldReduceMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <Moon className="w-5 h-5" aria-hidden="true" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={shouldReduceMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <Sun className="w-5 h-5" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ============================================
// THEME SELECTOR
// ============================================

/** Tema seçenekleri */
const themeOptions = [
  { value: 'light' as const, label: 'Aydınlık', icon: Sun },
  { value: 'dark' as const, label: 'Karanlık', icon: Moon },
  { value: 'system' as const, label: 'Sistem', icon: Monitor },
] as const;

/** Tema seçenek tipi */
type ThemeOption = (typeof themeOptions)[number]['value'];

/**
 * Tema seçici (light / dark / system)
 * @returns Theme selector component
 */
export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, optionValue: ThemeOption) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setTheme(optionValue);
      }
    },
    [setTheme]
  );

  if (!mounted) {
    return (
      <div
        className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-10 w-32 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
      role="radiogroup"
      aria-label="Tema seçimi"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
            role="radio"
            aria-checked={isActive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${isActive
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
