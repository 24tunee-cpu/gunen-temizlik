/**
 * @fileoverview Admin Sidebar — gruplu menü, dar/geniş mod, mobil drawer
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAdminStore } from '@/store/adminStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import {
  ADMIN_MENU_GROUPS,
  isAdminNavActive,
} from '@/config/admin-menu';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAdminStore();
  const { logout, isLoading } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isLg, setIsLg] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const set = () => setIsLg(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const closeSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

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

  const drawerX = !isLg ? (sidebarOpen ? 0 : -280) : 0;

  return (
    <>
      <motion.button
        type="button"
        onClick={toggleSidebar}
        whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-1 ring-white/10 lg:hidden"
        aria-label={sidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={sidebarOpen}
        aria-controls="admin-sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </motion.button>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={closeSidebar}
          aria-label="Menüyü kapat"
        />
      )}

      <motion.aside
        ref={sidebarRef}
        id="admin-sidebar"
        className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl shadow-black/20 lg:shadow-none"
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x: drawerX,
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
        role="navigation"
        aria-label="Yönetim menüsü"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-800/80 px-3 py-4">
            <Link
              href="/admin/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
              aria-label="Dashboard’a git"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 ring-1 ring-white/20">
                <Image
                  src="/logo.png"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                  sizes="40px"
                />
              </div>
              <motion.div
                className="min-w-0 flex-1 overflow-hidden"
                initial={false}
                animate={{
                  opacity: sidebarOpen ? 1 : 0,
                  marginLeft: sidebarOpen ? 0 : -8,
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              >
                {sidebarOpen && (
                  <>
                    <span className="block truncate text-base font-bold tracking-tight text-white">Günen Temizlik</span>
                    <span className="block truncate text-xs font-medium text-emerald-400/90">Yönetim paneli</span>
                  </>
                )}
              </motion.div>
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="mx-2 mt-2 hidden shrink-0 items-center justify-center gap-2 rounded-lg py-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 lg:flex"
            aria-label={sidebarOpen ? 'Menüyü daralt' : 'Menüyü genişlet'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronRight className="h-5 w-5" aria-hidden />
            )}
            {sidebarOpen && <span className="text-xs font-medium">Daralt</span>}
          </button>

          <nav
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700"
            aria-label="Sayfa bağlantıları"
          >
            {ADMIN_MENU_GROUPS.map((group) => (
              <div key={group.id}>
                {sidebarOpen && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5" role="list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isAdminNavActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeSidebar}
                          title={!sidebarOpen ? item.label : undefined}
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
                            active
                              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          )}
                          aria-current={active ? 'page' : undefined}
                          aria-label={item.ariaLabel || item.label}
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                              active
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-800 group-hover:text-white'
                            )}
                          >
                            <Icon className="h-[18px] w-[18px]" aria-hidden />
                          </span>
                          <motion.span
                            className="truncate"
                            initial={false}
                            animate={{
                              opacity: sidebarOpen ? 1 : 0,
                              width: sidebarOpen ? 'auto' : 0,
                              marginLeft: sidebarOpen ? 0 : -4,
                            }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          >
                            {item.label}
                          </motion.span>
                          {active && sidebarOpen && (
                            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="shrink-0 space-y-1 border-t border-slate-800/80 p-2">
            {sidebarOpen && (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeSidebar}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/80">
                  <ExternalLink className="h-[18px] w-[18px]" aria-hidden />
                </span>
                Ana siteyi aç
              </Link>
            )}
            {!sidebarOpen && (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                title="Ana site"
                className="flex justify-center rounded-xl py-2 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Ana siteyi yeni sekmede aç"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              title={!sidebarOpen ? 'Çıkış' : undefined}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              aria-label={isLoading ? 'Çıkış yapılıyor' : 'Oturumu kapat'}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/80">
                {isLoading ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-[18px] w-[18px]" aria-hidden />
                )}
              </span>
              <motion.span
                className="truncate"
                initial={false}
                animate={{
                  opacity: sidebarOpen ? 1 : 0,
                  width: sidebarOpen ? 'auto' : 0,
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              >
                {isLoading ? 'Çıkılıyor…' : 'Çıkış yap'}
              </motion.span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
