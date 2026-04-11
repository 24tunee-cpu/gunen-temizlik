'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { ToastContainer } from '@/components/ui/Toast';
import { useAdminStore } from '@/store/adminStore';
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
    initTheme();
  }, []);

  return (
    <SessionProvider>
      <ProtectedRoute requiredRole="ADMIN">
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <ToastContainer />
          <Sidebar />
          <AdminHeader />
          <main
            className={cn(
              'min-h-screen w-full min-w-0 max-w-full pt-14 transition-all duration-300 sm:pt-16',
              'ml-0 lg:transition-[margin]',
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
            )}
          >
            <div className="max-w-full overflow-x-auto p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </ProtectedRoute>
    </SessionProvider>
  );
}
