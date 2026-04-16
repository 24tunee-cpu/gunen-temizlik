/**
 * @fileoverview Protected Route Component
 * @description Admin panel route koruma bileşeni.
 * Kimlik doğrulama, rol bazlı yetkilendirme ve erişim kontrolü ile.
 *
 * @example
 * <ProtectedRoute requiredRole="ADMIN">
 *   <DashboardContent />
 * </ProtectedRoute>
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, ShieldAlert } from 'lucide-react';
import { createLogger } from '@/lib/logger';
import { AUTH_LOGIN_PATH } from '@/lib/auth-paths';

// ============================================
// TYPES
// ============================================

/** Kullanıcı rolleri */
type UserRole = 'ADMIN' | 'USER' | 'EDITOR';

/** Session user with role */
interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
}

/** ProtectedRoute component props */
interface ProtectedRouteProps {
  /** Render edilecek içerik */
  children: React.ReactNode;
  /** Gerekli kullanıcı rolü */
  requiredRole?: UserRole;
  /** Yetkisiz erişimde gösterilecek fallback */
  fallback?: React.ReactNode;
}

/** Auth state tipi */
interface AuthState {
  isAuthorized: boolean;
  isChecking: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const logger = createLogger('admin/protected-route');

// ============================================
// COMPONENT
// ============================================

/**
 * Protected Route Component
 * Authenticates and authorizes access to admin routes.
 * 
 * @param children Protected content
 * @param requiredRole Required role for access (default: ADMIN)
 * @param fallback Fallback UI for unauthorized access
 */
export function ProtectedRoute({
  children,
  requiredRole = 'ADMIN',
  fallback
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthorized: false,
    isChecking: true
  });

  // Ref for stable logger instance
  const loggerRef = useRef(logger);

  // ============================================
  // AUTH CHECK HANDLER
  // ============================================
  const checkAuthorization = useCallback(() => {
    loggerRef.current.info('Checking authentication', {
      path: pathname,
      status,
      requiredRole
    });

    // Auth durumu loading ise bekle
    if (status === 'loading') {
      return;
    }

    // Kullanıcı giriş yapmamışsa login'e yönlendir
    if (status === 'unauthenticated') {
      loggerRef.current.warn('Unauthenticated access attempt', { path: pathname });
      setAuthState({ isAuthorized: false, isChecking: false });
      router.push(`${AUTH_LOGIN_PATH}?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Kullanıcı giriş yapmışsa yetkisini kontrol et
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as SessionUser).role;

      if (userRole !== requiredRole) {
        loggerRef.current.error('Unauthorized access attempt - insufficient role', {
          path: pathname,
          userRole,
          requiredRole,
          userId: (session.user as SessionUser).id,
          email: session.user.email,
        });

        // Yetkisiz erişim - login'e yönlendir
        setAuthState({ isAuthorized: false, isChecking: false });
        router.push(`${AUTH_LOGIN_PATH}?error=unauthorized`);
        return;
      }

      // Yetki kontrolü başarılı
      loggerRef.current.info('Access granted', {
        path: pathname,
        userId: (session.user as SessionUser).id,
        email: session.user.email,
        role: userRole,
      });

      setAuthState({ isAuthorized: true, isChecking: false });
      return;
    }

    setAuthState(prev => ({ ...prev, isChecking: false }));
  }, [status, session, router, pathname, requiredRole]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  // Destructure auth state for easier access
  const { isChecking, isAuthorized } = authState;

  // ============================================
  // RENDER STATES
  // ============================================

  // Loading durumu
  if (isChecking || status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
        role="status"
        aria-live="polite"
        aria-label="Kimlik doğrulanıyor"
      >
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 font-medium">Güvenlik kontrolü yapılıyor...</p>
          <p className="text-slate-400 text-sm mt-2">Lütfen bekleyin</p>
        </motion.div>
      </div>
    );
  }

  // Yetkisiz erişim durumu (fallback varsa göster)
  if (!isAuthorized && fallback) {
    return <>{fallback}</>;
  }

  // Yetkisiz erişim (fallback yoksa boş göster - redirect yapılacak)
  if (!isAuthorized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
        role="alert"
        aria-live="assertive"
      >
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg"
        >
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-600 mb-6">
            Bu sayfaya erişim yetkiniz yok. Lütfen yönetici hesabı ile giriş yapın.
          </p>
          <button
            onClick={() => router.push(AUTH_LOGIN_PATH)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Giriş sayfasına dön"
          >
            Giriş Sayfasına Dön
          </button>
        </motion.div>
      </div>
    );
  }

  // Yetkili erişim - içeriği göster
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="authorized"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default ProtectedRoute;
