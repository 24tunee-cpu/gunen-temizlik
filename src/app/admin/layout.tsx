'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { ToastContainer } from '@/components/ui/Toast';
import { initAdminStore, useAdminStore } from '@/store/adminStore';
import { initTheme } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { SessionProvider } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useAdminStore();

  useEffect(() => {
    void useAdminStore.persist.rehydrate();
    const cleanupAdminStore = initAdminStore();
    initTheme();
    return cleanupAdminStore;
  }, []);

  return (
    <SessionProvider>
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <ToastContainer />
          <Sidebar />
          <AdminHeader />
          <main
            className={cn(
              'min-h-screen min-w-0 pt-14 transition-[margin,width] duration-300 sm:pt-16',
              /* w-full + margin-left taşır; lg’de genişlik sidebar kadar düşürülür */
              'ml-0 w-full max-w-full',
              sidebarOpen
                ? 'lg:ml-[280px] lg:w-[calc(100%-280px)] lg:max-w-[calc(100%-280px)]'
                : 'lg:ml-20 lg:w-[calc(100%-5rem)] lg:max-w-[calc(100%-5rem)]'
            )}
          >
            <div className="min-w-0 max-w-full p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </ProtectedRoute>
    </SessionProvider>
  );
}
