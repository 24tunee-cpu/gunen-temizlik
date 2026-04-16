/**
 * @fileoverview Authentication Hook
 * @description NextAuth.js entegrasyonu ile authentication state yönetimi,
 * role-based authorization, ve otomatik redirect.
 *
 * @example
 * // Basit kullanım (auth gerektiren sayfa)
 * const { session, isAuthenticated, isLoading, logout } = useAuth();
 *
 * // Belirli role gerektiren kullanım
 * const { hasRole } = useAuth({ requiredRole: 'ADMIN' });
 *
 * // Auth gerektirmeyen kullanım
 * const { isAuthenticated } = useAuth({ requireAuth: false });
 */

'use client';

import { useSession, signOut, SessionContextValue } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useMemo } from 'react';
import { AUTH_LOGIN_PATH } from '@/lib/auth-paths';

// ============================================
// TYPES
// ============================================

/** Kullanıcı rolleri */
export type UserRole = 'ADMIN' | 'USER';

/** useAuth options */
export interface UseAuthOptions {
  /** Auth gerekli mi */
  requireAuth?: boolean;
  /** Gerekli role (ADMIN için sadece adminler erişebilir) */
  requiredRole?: UserRole;
  /** Yetkisiz erişimde yönlendirilecek path */
  redirectTo?: string;
}

/** useAuth return type */
export interface UseAuthReturn {
  /** NextAuth session objesi */
  session: SessionContextValue['data'];
  /** Auth durumu */
  status: SessionContextValue['status'];
  /** Giriş yapılmış mı */
  isAuthenticated: boolean;
  /** Yükleniyor mu */
  isLoading: boolean;
  /** Kullanıcı ADMIN mi */
  isAdmin: boolean;
  /** Belirtilen role sahip mi */
  hasRole: (role: UserRole) => boolean;
  /** Çıkış yap */
  logout: () => Promise<void>;
  /** Session yenile */
  refresh: () => Promise<void>;
  /** Kullanıcı bilgileri */
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Authentication hook
 * @param options Auth options
 * @returns Auth state ve utilities
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    requireAuth = true,
    requiredRole,
    redirectTo = AUTH_LOGIN_PATH,
  } = options;

  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  // Auth durumları
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const userRole = session?.user?.role as UserRole | undefined;
  const isAdmin = userRole === 'ADMIN';

  // Yetki kontrolü
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!userRole) return false;
      if (role === 'ADMIN') return userRole === 'ADMIN';
      return true; // USER rolü her authenticated user'a açık
    },
    [userRole]
  );

  // Yönlendirme effect'i
  useEffect(() => {
    if (isLoading) return;

    // Auth gerekli ve giriş yapılmamış
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Belirli role gerekli ve yetki yok
    if (requireAuth && requiredRole && !hasRole(requiredRole)) {
      console.warn(`[useAuth] Access denied. Required: ${requiredRole}, User: ${userRole}`);
      router.push(redirectTo);
    }
  }, [
    isLoading,
    isAuthenticated,
    requireAuth,
    requiredRole,
    hasRole,
    router,
    redirectTo,
    userRole,
  ]);

  // Çıkış fonksiyonu
  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut({ redirect: false });
      router.push(redirectTo);
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
      // Hata durumunda da yönlendir
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  // Session yenileme
  const refresh = useCallback(async (): Promise<void> => {
    try {
      await updateSession();
    } catch (error) {
      console.error('[useAuth] Session refresh error:', error);
    }
  }, [updateSession]);

  // Kullanıcı bilgileri (memoized)
  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }, [session?.user]);

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasRole,
    logout,
    refresh,
    user,
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Sadece admin yetkisi kontrolü
 * @returns { isAdmin, isLoading }
 */
export function useAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { hasRole, isLoading } = useAuth({ requireAuth: true });
  return { isAdmin: hasRole('ADMIN'), isLoading };
}

/**
 * Guest-only hook (giriş yapılmamış kullanıcılar için)
 * Giriş yapılmışsa yönlendirme yapar
 */
export function useGuest(redirectTo: string = '/admin/dashboard'): void {
  const { isAuthenticated, isLoading } = useAuth({ requireAuth: false });
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
}

export default useAuth;
