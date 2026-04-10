/**
 * @fileoverview Navbar Component
 * @description Ana navigasyon bileşeni.
 * Scroll progress, mobile menu, keyboard navigation, ve accessibility desteği ile.
 *
 * @example
 * <Navbar />
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Menu, X, Phone } from 'lucide-react';
import Image from 'next/image';

// ============================================
// TYPES & CONSTANTS
// ============================================

/** Nav link tipi */
interface NavLink {
  href: string;
  label: string;
}

/** Telefon numarası (güncellenebilir) */
const PHONE_NUMBER = '+905551234567';
const PHONE_DISPLAY = '0555 123 45 67';

/** Navigasyon linkleri */
const navLinks: NavLink[] = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/hizmetler', label: 'Hizmetlerimiz' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/fiyatlar', label: 'Fiyatlar' },
  { href: '/sss', label: 'SSS' },
  { href: '/blog', label: 'Blog' },
  { href: '/referanslar', label: 'Referanslar' },
  { href: '/iletisim', label: 'İletişim' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Throttle fonksiyonu
 */
function throttle<T extends (...args: unknown[]) => void>(fn: T, wait: number) {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

// ============================================
// COMPONENT
// ============================================

/**
 * Navbar Component
 * Responsive navigation with mobile menu, scroll progress, and keyboard support.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  // Scroll progress animation (disabled if reduced motion preferred)
  const scaleX = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [0, 1]
  );

  // ============================================
  // SCROLL HANDLER (throttled)
  // ============================================
  const handleScroll = useCallback(
    throttle(() => {
      setScrolled(window.scrollY > 50);
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // ============================================
  // MOBILE MENU HANDLERS
  // ============================================
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        // Return focus to menu button
        mobileButtonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeMenu]);

  // ============================================
  // BODY SCROLL LOCK
  // ============================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <motion.nav
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
          }`}
        role="navigation"
        aria-label="Ana navigasyon"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                <Image
                  src="/logo.png"
                  alt="Günen Temizlik"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-slate-900' : 'text-white'
                  }`}>
                  Günen
                </span>
                <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-emerald-600' : 'text-emerald-400'
                  }`}>
                  {' '}Temizlik
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-emerald-500 ${scrolled ? 'text-slate-700' : 'text-white/90'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${scrolled ? 'text-slate-700' : 'text-white'}`}
                aria-label={`Telefon: ${PHONE_DISPLAY}`}
              >
                <Phone size={16} />
                {PHONE_DISPLAY}
              </a>
              <Link
                href="/iletisim"
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40"
              >
                Hemen Fiyat Al
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={mobileButtonRef}
              onClick={toggleMenu}
              className={`rounded-lg p-2 lg:hidden ${scrolled ? 'text-slate-700' : 'text-white'}`}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Scroll Progress Indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600"
          style={{ scaleX, transformOrigin: "left" }}
          aria-hidden="true"
        />
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobil menü"
            id="mobile-menu"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: shouldReduceMotion ? 0 : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: shouldReduceMotion ? 0 : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl"
            >
              <div className="flex h-20 items-center justify-between border-b px-6">
                <span className="text-xl font-bold text-slate-900">Menü</span>
                <button
                  onClick={closeMenu}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Menüyü kapat"
                >
                  <X size={24} aria-hidden="true" />
                </button>
              </div>
              <div className="p-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block border-b border-slate-100 py-4 text-lg font-medium text-slate-700 transition-colors hover:text-emerald-500"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/iletisim"
                  onClick={closeMenu}
                  className="mt-6 block rounded-lg bg-emerald-500 py-3 text-center font-medium text-white hover:bg-emerald-600"
                >
                  Hemen Fiyat Al
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
