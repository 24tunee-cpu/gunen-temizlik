/**
 * @fileoverview Admin Sidebar Component
 * @description Admin panel sidebar bileşeni.
 * Responsive navigation, collapsible menu, accessibility ve keyboard desteği ile.
 *
 * @example
 * <Sidebar />
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAdminStore } from '@/store/adminStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  Image as ImageIcon,
  Quote,
  Loader2,
  Mail,
  Users,
  Award,
  HelpCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

// ============================================
// TYPES
// ============================================

/** Menu item tipi */
interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel?: string;
}

/** Sidebar props */
interface SidebarProps {
  /** Varsayılan açık/kapalı durum */
  defaultOpen?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const MENU_ITEMS: MenuItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, ariaLabel: 'Yönetim paneli' },
  { href: '/admin/hizmetler', label: 'Hizmetler', icon: Sparkles, ariaLabel: 'Hizmetler yönetimi' },
  { href: '/admin/blog', label: 'Blog Yazıları', icon: FileText, ariaLabel: 'Blog yazıları yönetimi' },
  { href: '/admin/referanslar', label: 'Referanslar', icon: Quote, ariaLabel: 'Müşteri referansları' },
  { href: '/admin/talepler', label: 'Müşteri Talepleri', icon: MessageSquare, ariaLabel: 'Müşteri talepleri' },
  { href: '/admin/ebulten', label: 'E-Bülten', icon: Mail, ariaLabel: 'E-bülten abonelikleri' },
  { href: '/admin/galeri', label: 'Galeri', icon: ImageIcon, ariaLabel: 'Galeri yönetimi' },
  { href: '/admin/ekip', label: 'Ekibimiz', icon: Users, ariaLabel: 'Ekip üyeleri yönetimi' },
  { href: '/admin/sertifikalar', label: 'Sertifikalar', icon: Award, ariaLabel: 'Sertifikalar yönetimi' },
  { href: '/admin/sss', label: 'SSS', icon: HelpCircle, ariaLabel: 'Sıkça sorulan sorular' },
  { href: '/admin/fiyatlar', label: 'Fiyat Listesi', icon: DollarSign, ariaLabel: 'Fiyat listesi yönetimi' },
  { href: '/admin/ayarlar', label: 'Site Ayarları', icon: Settings, ariaLabel: 'Site ayarları' },
];

const SIDEBAR_WIDTH_EXPANDED = 'w-64';
const SIDEBAR_WIDTH_COLLAPSED = 'w-20';

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Admin Sidebar Component
 * @param defaultOpen Initial sidebar open state
 */
export function Sidebar({ defaultOpen = true }: SidebarProps = {}) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAdminStore();
  const { logout, isLoading } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = useCallback(async () => {
    console.log('Logout initiated from sidebar');
    await logout();
  }, [logout]);

  const closeSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        sidebarOpen &&
        typeof window !== 'undefined' &&
        window.innerWidth < 1024
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen, setSidebarOpen]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  // ============================================
  // BODY SCROLL LOCK (mobile)
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {/* Mobile Toggle */}
      <motion.button
        onClick={toggleSidebar}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label={sidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={sidebarOpen}
        aria-controls="admin-sidebar"
      >
        {sidebarOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </motion.button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        id="admin-sidebar"
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white lg:block',
          sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED
        )}
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 80,
          x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0)
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeInOut' }}
        role="navigation"
        aria-label="Admin menü"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-800/50 transition-colors"
            aria-label="Admin panel ana sayfa"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white p-1 shrink-0">
              <Image
                src="/logo.png"
                alt="Günen Temizlik"
                fill
                className="object-contain"
                priority
                sizes="40px"
              />
            </div>
            <motion.div
              className="flex flex-col overflow-hidden"
              animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            >
              <span className="text-lg font-bold text-white whitespace-nowrap">
                Günen
              </span>
              <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
                Admin Panel
              </span>
            </motion.div>
          </Link>

          {/* Desktop Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center py-2 text-slate-400 hover:text-white transition-colors"
            aria-label={sidebarOpen ? 'Menüyü daralt' : 'Menüyü genişlet'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto" role="menubar" aria-label="Admin menü">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                  role="menuitem"
                  aria-label={item.ariaLabel || item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <motion.span
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-3">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label={isLoading ? 'Çıkış yapılıyor' : 'Çıkış yap'}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <motion.span
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              >
                {isLoading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
