/**
 * @fileoverview Admin Header Component
 * @description Admin panel header bileşeni.
 * Sidebar toggle, tema değiştirme, bildirimler ve kullanıcı bilgisi ile.
 *
 * @example
 * <AdminHeader />
 */

'use client';

import { useCallback } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu, Bell, User } from 'lucide-react';

// ============================================
// TYPES
// ============================================

/** AdminHeader component props */
interface AdminHeaderProps {
  /** Başlık metni */
  title?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Admin Header Component
 * @param title Header title text
 */
export function AdminHeader({ title = 'Yönetim Paneli' }: AdminHeaderProps) {
  const { toggleSidebar, sidebarOpen } = useAdminStore();
  const { session } = useAuth();

  // ============================================
  // HANDLERS
  // ============================================
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleNotifications = useCallback(() => {
    // TODO: Implement notifications panel
    console.log('Notifications clicked');
  }, []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-20'
      )}
      role="banner"
      aria-label="Admin panel header"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleSidebar}
          className="hidden rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={sidebarOpen ? 'Sidebar daralt' : 'Sidebar genişlet'}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          title={sidebarOpen ? 'Sidebar daralt' : 'Sidebar genişlet'}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          onClick={handleNotifications}
          className="relative rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Bildirimler (3 okunmamış)"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        </button>

        <div
          className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700"
          role="group"
          aria-label="Kullanıcı bilgileri"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          >
            <User size={18} />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-800 dark:text-white">
              {session?.user?.name || 'Admin'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
