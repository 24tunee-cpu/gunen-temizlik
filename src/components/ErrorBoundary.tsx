/**
 * @fileoverview Error Boundary Component
 * @description React Error Boundary ile hata yakalama, loglama, ve recovery.
 * Reset functionality, retry logic, ve error reporting servisi entegrasyonu.
 *
 * @example
 * // Basit kullanım
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // Custom fallback
 * <ErrorBoundary fallback={<CustomErrorScreen />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // Reset keys ile dışarıdan reset
 * <ErrorBoundary resetKeys={[userId]} onReset={() => console.log('Reset!')}>
 *   <UserProfile userId={userId} />
 * </ErrorBoundary>
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

/** Error Boundary Props */
export interface ErrorBoundaryProps {
  /** Children */
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Fallback render fonksiyonu (error detayları ile) */
  fallbackRender?: (props: FallbackProps) => ReactNode;
  /** Hata oluştuğunda çağrılacak callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset yapıldığında çağrılacak callback */
  onReset?: () => void;
  /** Reset keys - değiştiğinde error boundary resetlenir */
  resetKeys?: Array<string | number>;
  /** Max retry sayısı (0 = retry yok) */
  maxRetries?: number;
  /** Hata servisi (Sentry vb.) */
  errorReporter?: ErrorReporter;
}

/** Fallback props */
export interface FallbackProps {
  /** Hata objesi */
  error: Error;
  /** Reset fonksiyonu (retry) */
  reset: () => void;
  /** Tekrar deneme sayısı */
  retryCount: number;
  /** Max retry sayısı aşıldı mı */
  maxRetriesReached: boolean;
}

/** Error Boundary State */
export interface ErrorBoundaryState {
  /** Hata var mı */
  hasError: boolean;
  /** Hata objesi */
  error: Error | null;
  /** React ErrorInfo */
  errorInfo: ErrorInfo | null;
  /** Tekrar deneme sayısı */
  retryCount: number;
}

/** Error reporting servisi interface */
export interface ErrorReporter {
  /** Hata raporla */
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  /** Mesaj raporla */
  captureMessage: (message: string, context?: Record<string, unknown>) => void;
}

// ============================================
// ERROR BOUNDARY CLASS
// ============================================

/**
 * React Error Boundary Component
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  /**
   * Hata durumundan state oluştur
   */
  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * Props değiştiğinde reset keys kontrolü
   */
  public componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { hasError, retryCount } = this.state;
    const { resetKeys, maxRetries = 0 } = this.props;

    // Hata varsa ve reset keys değiştiyse resetle
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        if (retryCount < maxRetries || maxRetries === 0) {
          this.reset();
        }
      }
    }
  }

  /**
   * Hata yakalama
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, errorReporter } = this.props;
    const { retryCount } = this.state;

    console.error('React Error Boundary caught an error', error, errorInfo);

    // Error reporter servisi (Sentry, vb.)
    if (errorReporter) {
      errorReporter.captureException(error, {
        componentStack: errorInfo.componentStack,
        retryCount,
      });
    }

    // Custom callback
    if (onError) {
      onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * Error boundary'i resetle (retry)
   */
  private reset = () => {
    const { onReset } = this.props;
    const previousRetryCount = this.state.retryCount;

    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));

    if (onReset) {
      onReset();
    }

    console.log('ErrorBoundary reset', { previousRetryCount });
  };

  /**
   * Render
   */
  public render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, fallbackRender, maxRetries = 0 } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Custom fallback render fonksiyonu
    if (fallbackRender) {
      return fallbackRender({
        error,
        reset: this.reset,
        retryCount,
        maxRetriesReached: maxRetries > 0 && retryCount >= maxRetries,
      });
    }

    // Custom fallback node
    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    const maxRetriesReached = maxRetries > 0 && retryCount >= maxRetries;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Bir Hata Oluştu
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            {maxRetriesReached
              ? 'Üzgünüz, birden fazla denemeye rağmen sorun çözülemedi. Lütfen sayfayı yenileyin.'
              : 'Üzgünüz, bir şeyler yanlış gitti. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!maxRetriesReached && (
              <button
                onClick={this.reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tekrar Dene {retryCount > 0 && `(${retryCount})`}
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sayfayı Yenile
            </button>
          </div>

          {maxRetries > 0 && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Deneme: {retryCount} / {maxRetries}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-left">
              <details className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  Hata Detayları (Geliştirici)
                </summary>
                <pre className="mt-4 text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// ============================================
// UTILITY COMPONENTS
// ============================================

/**
 * Global Error Boundary Wrapper
 * Tüm uygulamayı saran ana error boundary
 */
export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Global error handling
        console.error('Global error:', error);
      }}
      maxRetries={1}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Section Error Boundary
 * Belirli bir section'ı saran error boundary (graceful degradation)
 */
export function SectionErrorBoundary({
  children,
  sectionName,
}: {
  children: ReactNode;
  sectionName: string;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, reset }) => (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
            {sectionName} yüklenirken bir hata oluştu
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-3">
            {error.message}
          </p>
          <button
            onClick={reset}
            className="text-sm px-3 py-1 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
