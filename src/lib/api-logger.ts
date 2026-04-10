/**
 * @fileoverview API Request/Response Logger
 * @description Middleware-based API logging with PII redaction,
 * correlation ID tracking, performance metrics, and configurable sampling.
 *
 * @example
 * // Route handler'da kullanım
 * export const GET = withAPILogging(async (req) => {
 *   return NextResponse.json({ data: [] });
 * });
 *
 * // Manuel kullanım
 * const loggedReq = await apiLogger.logRequest(req);
 * apiLogger.logResponse(res, loggedReq, 45);
 */

import { NextRequest, NextResponse } from 'next/server';
// import { logger, setGlobalCorrelationId, clearGlobalCorrelationId } from '@/lib/logger'; // DISABLED

// ============================================
// TYPES & CONFIGURATION
// ============================================

/** Loglanan request yapısı */
export interface LoggedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  ip?: string;
  timestamp: string;
  correlationId?: string;
}

/** Loglanan response yapısı */
export interface LoggedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: unknown;
  duration: number;
}

/** API Logger yapılandırma seçenekleri */
export interface APILoggerOptions {
  /** Loglanmayacak path'ler */
  excludePaths?: string[];
  /** Minimum log süresi (ms) - daha hızlı olanlar loglanmaz */
  minDuration?: number;
  /** Sampling oranı (0-1) - 0.1 = %10 loglanır */
  sampleRate?: number;
  /** Response body loglansın mı */
  logResponseBody?: boolean;
  /** Max body boyutu (bytes) */
  maxBodySize?: number;
}

/** Hassas header'lar (maskelenir) */
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-csrf-token'];

/** Hassas body alanları (maskelenir) */
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'creditCard', 'cvv', 'ssn'];

// ============================================
// API LOGGER CLASS
// ============================================

/**
 * API Request/Response Logger
 *
 * Özellikler:
 * - PII (Personally Identifiable Information) maskeleme
 * - Correlation ID tracking
 * - Sampling/rate limiting
 * - Performance metrics
 */
export class APILogger {
  private options: APILoggerOptions;

  constructor(options: APILoggerOptions = {}) {
    this.options = {
      excludePaths: ['/health', '/_next', '/favicon.ico'],
      minDuration: 0,
      sampleRate: 1,
      logResponseBody: false,
      maxBodySize: 10000, // 10KB
      ...options,
    };
  }

  /**
   * Header'ları formatla ve hassas verileri maskele
   * @param headers Request/Response headers
   * @returns Maskelenmiş header objesi
   */
  private formatHeaders(headers: Headers): Record<string, string> {
    const formatted: Record<string, string> = {};
    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_HEADERS.some((h) => lowerKey.includes(h))) {
        formatted[key] = '[REDACTED]';
      } else {
        formatted[key] = value;
      }
    });
    return formatted;
  }

  /**
   * Request'ten IP adresini al
   * @param request NextRequest
   * @returns IP adresi
   */
  private getIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    return 'unknown';
  }

  /**
   * Correlation ID al veya oluştur
   * @param request NextRequest
   * @returns Correlation ID
   */
  private getCorrelationId(request: NextRequest): string {
    return (
      request.headers.get('x-correlation-id') ||
      request.headers.get('x-request-id') ||
      `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    );
  }

  /**
   * Body'deki hassas alanları maskele
   * @param body Request/Response body
   * @returns Maskelenmiş body
   */
  private maskSensitiveData(body: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...body };
    for (const key of Object.keys(masked)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((f) => lowerKey.includes(f))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key] as Record<string, unknown>);
      }
    }
    return masked;
  }

  /**
   * Bu request loglanmalı mı kontrol et (sampling)
   * @returns boolean
   */
  private shouldLog(): boolean {
    if (this.options.sampleRate === undefined || this.options.sampleRate >= 1) {
      return true;
    }
    return Math.random() < this.options.sampleRate;
  }

  /**
   * Bu path loglanmalı mı kontrol et
   * @param url Request URL
   * @returns boolean
   */
  private shouldLogPath(url: string): boolean {
    if (!this.options.excludePaths) return true;
    return !this.options.excludePaths.some((path) => url.includes(path));
  }

  /**
   * Request'i logla
   * @param request NextRequest
   * @returns LoggedRequest
   */
  async logRequest(request: NextRequest): Promise<LoggedRequest | null> {
    // Skip check
    if (!this.shouldLog() || !this.shouldLogPath(request.url)) {
      return null;
    }

    const correlationId = this.getCorrelationId(request);
    setGlobalCorrelationId(correlationId);

    const loggedRequest: LoggedRequest = {
      method: request.method,
      url: request.url,
      headers: this.formatHeaders(request.headers),
      ip: this.getIP(request),
      timestamp: new Date().toISOString(),
      correlationId,
    };

    // Body'yi logla (sadece POST, PUT, PATCH için)
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        loggedRequest.body = this.maskSensitiveData(body);
      } catch {
        // Body JSON değilse veya parse edilemezse loglama
      }
    }

    logger.info(`API Request: ${request.method} ${request.url}`, {
      ...loggedRequest,
      source: 'api',
    });

    return loggedRequest;
  }

  /**
   * Response'u logla
   * @param response NextResponse
   * @param loggedRequest LoggedRequest (null ise loglanmaz)
   * @param duration Süre (ms)
   * @returns LoggedResponse veya null
   */
  async logResponse(
    response: NextResponse,
    loggedRequest: LoggedRequest | null,
    duration: number
  ): Promise<LoggedResponse | null> {
    if (!loggedRequest) return null;

    // Min duration kontrolü
    if (this.options.minDuration && duration < this.options.minDuration) {
      return null;
    }

    const loggedResponse: LoggedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: this.formatHeaders(response.headers),
      duration,
    };

    // Response body loglama (opsiyonel)
    if (this.options.logResponseBody && response.status !== 204) {
      try {
        const clonedResponse = response.clone();
        const body = await clonedResponse.json();
        const bodyStr = JSON.stringify(body);
        if (bodyStr.length <= (this.options.maxBodySize || 10000)) {
          loggedResponse.body = this.maskSensitiveData(body);
        } else {
          loggedResponse.body = '[BODY_TOO_LARGE]';
        }
      } catch {
        // JSON değilse loglama
      }
    }

    // Status code'a göre log level seç
    const logMessage = `${loggedRequest.method} ${loggedRequest.url} | ${response.status} | ${duration}ms`;

    if (response.status >= 500) {
      logger.error(`API Error: ${logMessage}`, {
        request: loggedRequest,
        response: loggedResponse,
        source: 'api',
      });
    } else if (response.status >= 400) {
      logger.warn(`API Warning: ${logMessage}`, {
        request: loggedRequest,
        response: loggedResponse,
        source: 'api',
      });
    } else {
      logger.info(`API Success: ${logMessage}`, {
        request: loggedRequest,
        response: loggedResponse,
        source: 'api',
      });
    }

    clearGlobalCorrelationId();
    return loggedResponse;
  }

  /**
   * Error logla
   * @param error Error objesi
   * @param request NextRequest
   * @param loggedRequest LoggedRequest (opsiyonel)
   */
  logError(
    error: Error,
    request: NextRequest,
    loggedRequest: LoggedRequest | null
  ): void {
    const context: Record<string, unknown> = {
      url: request.url,
      method: request.method,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      source: 'api',
    };

    if (loggedRequest) {
      context.request = loggedRequest;
    }

    logger.error(
      `API Exception: ${error.message} | ${request.method} ${request.url}`,
      context,
      error
    );

    clearGlobalCorrelationId();
  }
}

// ============================================
// MIDDLEWARE WRAPPER
// ============================================

/**
 * API handler'ı logging ile wrap et
 * @param handler Next.js API handler
 * @param options Logger options
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withAPILogging(async (req) => {
 *   return NextResponse.json({ data: [] });
 * });
 *
 * @example
 * export const POST = withAPILogging(
 *   async (req) => { ... },
 *   { excludePaths: ['/health'], sampleRate: 0.5 }
 * );
 */
export function withAPILogging(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: APILoggerOptions
) {
  return async function (request: NextRequest): Promise<NextResponse> {
    const apiLogger = new APILogger(options);
    const startTime = Date.now();

    // Request logla
    const loggedRequest = await apiLogger.logRequest(request);

    try {
      // Handler'ı çalıştır
      const response = await handler(request);

      // Response logla (fire-and-forget, response'u block etme)
      const duration = Date.now() - startTime;
      apiLogger.logResponse(response, loggedRequest, duration).catch(() => {
        // Log hatası response'u etkilemez
      });

      return response;
    } catch (error) {
      // Error logla
      apiLogger.logError(error as Error, request, loggedRequest);

      // Error response dön
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

// ============================================
// EXPORTS
// ============================================

/** Varsayılan API logger instance'ı */
export const apiLogger = new APILogger();
export default apiLogger;
