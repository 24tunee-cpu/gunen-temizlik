'use client';

import { Suspense, useCallback } from 'react';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AUTH_DEFAULT_REDIRECT_PATH } from '@/lib/auth-paths';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-white font-medium">Yükleniyor...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl');
  const resolveSafeCallbackUrl = useCallback((url: string | null): string => {
    if (!url) return AUTH_DEFAULT_REDIRECT_PATH;
    const trimmed = url.trim();
    if (!trimmed.startsWith('/')) return AUTH_DEFAULT_REDIRECT_PATH;
    if (trimmed.startsWith('//')) return AUTH_DEFAULT_REDIRECT_PATH;
    return trimmed;
  }, []);
  const safeCallbackUrl = resolveSafeCallbackUrl(callbackUrl);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Eğer kullanıcı zaten giriş yapmışsa, dashboard'a yönlendir
  useEffect(() => {
    console.log('Login page mounted', { status, callbackUrl: safeCallbackUrl });

    if (status === 'authenticated') {
      console.log('User already authenticated, redirecting to dashboard');
      router.push(safeCallbackUrl);
      return;
    }

    if (status !== 'loading') {
      setIsChecking(false);
    }
  }, [status, router, safeCallbackUrl]);

  // Clear error when user starts typing
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim()) {
      setError('E-posta adresi gerekli');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    if (!password) {
      setError('Şifre gerekli');
      return;
    }

    setLoading(true);
    setError('');

    console.log('Login attempt', { email });

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: safeCallbackUrl,
      });

      if (result?.error) {
        console.warn('Login failed', { email, error: result.error });

        // Map NextAuth error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          'CredentialsSignin': 'Geçersiz e-posta veya şifre',
          'SessionRequired': 'Oturum süreniz doldu, lütfen tekrar giriş yapın',
          'AccessDenied': 'Erişim reddedildi',
          'Default': 'Giriş yapılırken bir hata oluştu'
        };

        setError(errorMessages[result.error] || errorMessages['Default']);
      } else if (result?.ok) {
        console.log('Login successful', { email, callbackUrl: safeCallbackUrl });
        router.push(safeCallbackUrl);
      }
    } catch (error) {
      console.error('Login error', { error: error instanceof Error ? error.message : 'Unknown' });
      setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Auth durumu kontrol edilirken göster
  if (isChecking || status === 'loading') {
    return (
      <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-white font-medium">Oturum kontrol ediliyor...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo ve Başlık */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Günen Temizlik</h1>
          <p className="text-slate-400">Yönetim Paneli</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
            Giriş Yap
          </h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center gap-2"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit(e as any)}
                className={`w-full rounded-lg border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${error && !email.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-emerald-500'
                  }`}
                placeholder="admin@gunentemizlik.com"
                required
                autoFocus
                autoComplete="email"
                aria-invalid={error && !email.trim() ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit(e as any)}
                  className={`w-full rounded-lg border px-4 py-3 pr-12 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${error && !password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  aria-invalid={error && !password ? 'true' : 'false'}
                  aria-describedby={error ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <span aria-hidden="true">←</span> Ana Sayfaya Dön
            </Link>
            <p className="text-xs text-slate-400">
              Giriş yaparak{' '}
              <Link href="/gizlilik" className="text-emerald-600 hover:underline">
                gizlilik politikamızı
              </Link>{' '}
              kabul etmiş olursunuz
            </p>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-sm text-slate-500">
          © 2024 Günen Temizlik. Tüm hakları saklıdır.
        </p>
      </motion.div>
    </div>
  );
}
