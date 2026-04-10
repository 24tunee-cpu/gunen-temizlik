/**
 * @fileoverview Client-Side Error Handler - DISABLED
 * @description Disabled due to Turbopack infinite loop bug
 */

export interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  correlationId?: string;
  componentStack?: string;
}

export interface ErrorHandlerOptions {
  deduplication?: boolean;
  rateLimit?: { max: number; windowMs: number };
  offlineQueue?: boolean;
  onError?: (error: ErrorInfo) => void;
}

export function setupGlobalErrorHandlers(_options?: ErrorHandlerOptions): () => void {
  return () => { };
}

export function trackError(_error: Error, _context?: Record<string, unknown>): void {
  // DISABLED - no-op
}

export function createErrorBoundaryHandler(
  _componentName: string,
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
) {
  return {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      onError?.(error, errorInfo);
    },
  };
}

export function initPerformanceMonitoring(): void {
  // DISABLED
}

export function handleReactError(
  _error: Error,
  _errorInfo: { componentStack: string }
): void {
  // DISABLED - React Error Boundary handler
  // Errors are logged natively by React in development
}

export function logPerformanceMetrics(_metrics: Record<string, unknown>): void {
  // DISABLED - Performance logging
}

export default {
  setupGlobalErrorHandlers,
  trackError,
  createErrorBoundaryHandler,
  initPerformanceMonitoring,
  handleReactError,
  logPerformanceMetrics,
};
