/**
 * @fileoverview Admin panel üst çubuğu — dinamik başlık, tema, kullanıcı
 */

'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/adminStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu, Bell, ExternalLink } from 'lucide-react';
import { getAdminPageTitle } from '@/config/admin-menu';

function userInitials(name: string | null | undefined): string {
  const t = name?.trim();
  if (!t) return 'A';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w[0].toUpperCase();
  }
  const a = parts[0][0];
  const b = parts[parts.length - 1][0];
  return `${a}${b}`.toUpperCase();
}

export function AdminHeader() {
  const pathname = usePathname();
  const { toggleSidebar, sidebarOpen } = useAdminStore();
  const { session } = useAuth();

  const pageTitle = useMemo(() => getAdminPageTitle(pathname ?? ''), [pathname]);
  const displayName = session?.user?.name?.trim() || 'Admin';
  const initials = useMemo(() => userInitials(session?.user?.name), [session?.user?.name]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/90',
        'left-0 transition-[left] duration-300',
        sidebarOpen ? 'lg:left-[280px]' : 'lg:left-20'
      )}
      role="banner"
      aria-label="Yönetim paneli üst çubuğu"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleToggleSidebar}
          className="hidden rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 lg:flex"
          aria-label={sidebarOpen ? 'Menüyü daralt' : 'Menüyü genişlet'}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          title={sidebarOpen ? 'Menüyü daralt' : 'Menüyü genişlet'}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 pl-12 lg:pl-0">
          <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Konum">
            <Link
              href="/admin/dashboard"
              className="shrink-0 text-slate-500 transition-colors hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              Yönetim
            </Link>
            <span className="shrink-0 text-slate-300 dark:text-slate-600" aria-hidden>
              /
            </span>
            <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              {pageTitle}
            </h1>
          </nav>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:inline-flex"
          aria-label="Ana siteyi yeni sekmede aç"
        >
          <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <span className="hidden md:inline">Site</span>
        </Link>

        <ThemeToggle />

        <button
          type="button"
          disabled
          className="relative rounded-xl p-2 text-slate-400 opacity-60 dark:text-slate-500"
          title="Bildirimler yakında kullanıma sunulacak"
          aria-label="Bildirimler (yakında)"
        >
          <Bell className="h-5 w-5" aria-hidden />
        </button>

        <div
          className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-700 sm:gap-3 sm:pl-3"
          role="group"
          aria-label="Oturum"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
            aria-hidden
          >
            {initials}
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{displayName}</p>
            {session?.user?.email && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
