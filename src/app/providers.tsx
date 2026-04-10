/**
 * @fileoverview Root Providers Component
 * @description Tüm uygulamayı saran provider'lar.
 * ErrorBoundary, SiteSettingsContext ve global error handling ile.
 * Admin panel ve site arasındaki senkronizasyonu sağlar.
 *
 * @example
 * <Providers>
 *   <App />
 * </Providers>
 */

'use client';

import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
// import { setupGlobalErrorHandlers, logPerformanceMetrics } from '@/lib/client-error-handler'; // DISABLED

// ============================================
// TYPES
// ============================================

/** Providers component props */
interface ProvidersProps {
  /** Uygulama içeriği */
  children: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Root Providers Component
 * Wraps the application with all necessary providers and error handlers.
 * 
 * @param children Application content
 */
export function Providers({ children }: ProvidersProps) {
  // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    setIsMounted(true);

    // Initialize client-side features - DISABLED to prevent Turbopack infinite loop
    // setupGlobalErrorHandlers();
    // logPerformanceMetrics();

    // Cleanup function
    return () => {
      // Any necessary cleanup would go here
      // (Most listeners are page-lifetime and don't need cleanup)
    };
  }, []);

  // Prevent hydration mismatch - render minimal during SSR
  if (!isMounted) {
    return (
      <SiteSettingsProvider>
        {children}
      </SiteSettingsProvider>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Bir Hata Oluştu</h2>
            <p className="text-slate-600 mb-4">
              Uygulama yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      }
    >
      <SiteSettingsProvider>
        {children}
      </SiteSettingsProvider>
    </ErrorBoundary>
  );
}

export default Providers;
