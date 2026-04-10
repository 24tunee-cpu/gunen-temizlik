/**
 * @fileoverview Merkezi Hata Yönetim Sistemi
 * @description Custom error class'ları, HTTP error handling,
 * request tracking (correlation ID), ve retry logic desteği.
 *
 * @example
 * // Route handler'da kullanım
 * export const POST = withErrorHandler(async (req) => {
 *   const data = await req.json();
 *   if (!data.name) throw createValidationError('name', 'Zorunlu alan');
 *   return NextResponse.json({ success: true });
 * });
 *
 * // Manuel hata fırlatma
 * throw createNotFoundError('Service');
 * throw new AppError('Custom error', ErrorCodes.BAD_REQUEST, 400);
 *
 * // Retryable error
 * throw new AppError('DB timeout', ErrorCodes.DATABASE_ERROR, 503, {}, true);
 */

import { NextRequest, NextResponse } from 'next/server';
// import { logger, setGlobalCorrelationId, clearGlobalCorrelationId } from '@/lib/logger'; // DISABLED

// ============================================
// TYPES & INTERFACES
// ============================================

/** Hata yanıt arayüzü */
export interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  retryable?: boolean;
}

/** Hata kategorileri */
export type ErrorCategory = 'CLIENT' | 'SERVER' | 'NETWORK' | 'DATABASE' | 'EXTERNAL';

/** Hata kodu tipi */
export type ErrorCode = keyof typeof ErrorCodes;

// ============================================
// APP ERROR CLASS
// ============================================

/**
 * Uygulama özel hata sınıfı
 *
 * @example
 * throw new AppError('Invalid input', ErrorCodes.BAD_REQUEST, 400);
 *
 * // Retryable error (otomatik retry için)
 * throw new AppError('DB timeout', ErrorCodes.DATABASE_ERROR, 503, {}, true);
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = new Date();

    // Stack trace düzeltmesi
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Error kategorisini tespit et
   * @returns ErrorCategory
   */
  getCategory(): ErrorCategory {
    if (this.statusCode >= 500) {
      if (this.code.includes('DATABASE')) return 'DATABASE';
      if (this.code.includes('EXTERNAL')) return 'EXTERNAL';
      return 'SERVER';
    }
    if (this.statusCode >= 400) {
      if (this.code === 'RATE_LIMITED') return 'NETWORK';
      return 'CLIENT';
    }
    return 'SERVER';
  }

  /**
   * Error'ı JSON'a çevir
   * @returns Serileştirilmiş error objesi
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

// ============================================
// ERROR CODES
// ============================================

/** HTTP hata kodları ve mesajları */
export const ErrorCodes = {
  // 2xx Success (Retry için)
  OK: 'OK',
  CREATED: 'CREATED',

  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',
  CACHE_ERROR: 'CACHE_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/** HTTP Status Code → Error Message mapping */
export const HttpStatusMessages: Record<number, string> = {
  400: 'Geçersiz istek',
  401: 'Kimlik doğrulama gerekli',
  403: 'Erişim reddedildi',
  404: 'Kaynak bulunamadı',
  405: 'İzin verilmeyen metod',
  408: 'İstek zaman aşımına uğradı',
  409: 'Çakışma (Conflict)',
  413: 'İstek boyutu çok büyük',
  429: 'Çok fazla istek',
  500: 'Sunucu hatası',
  502: 'Geçersiz yanıt',
  503: 'Hizmet kullanılamıyor',
  504: 'Ağ geçidi zaman aşımı',
};

/** Error kodu → HTTP status mapping */
export const ErrorCodeToStatus: Record<string, number> = {
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.METHOD_NOT_ALLOWED]: 405,
  [ErrorCodes.REQUEST_TIMEOUT]: 408,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.NOT_IMPLEMENTED]: 501,
  [ErrorCodes.BAD_GATEWAY]: 502,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.GATEWAY_TIMEOUT]: 504,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.DATABASE_TIMEOUT]: 503,
  [ErrorCodes.DATABASE_CONNECTION_ERROR]: 503,
  [ErrorCodes.EXTERNAL_API_ERROR]: 502,
  [ErrorCodes.EXTERNAL_API_TIMEOUT]: 504,
  [ErrorCodes.CACHE_ERROR]: 500,
  [ErrorCodes.QUEUE_ERROR]: 500,
  [ErrorCodes.UNKNOWN_ERROR]: 500,
};

/** Retryable error kodları (otomatik retry için) */
export const RetryableErrorCodes: string[] = [
  ErrorCodes.DATABASE_TIMEOUT,
  ErrorCodes.DATABASE_CONNECTION_ERROR,
  ErrorCodes.EXTERNAL_API_TIMEOUT,
  ErrorCodes.EXTERNAL_API_ERROR,
  ErrorCodes.REQUEST_TIMEOUT,
  ErrorCodes.GATEWAY_TIMEOUT,
  ErrorCodes.BAD_GATEWAY,
  ErrorCodes.SERVICE_UNAVAILABLE,
  ErrorCodes.RATE_LIMITED,
];

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Error'ı AppError'a normalize et
 * @param error Herhangi bir error objesi
 * @returns AppError
 */
function normalizeError(error: unknown): AppError {
  // AppError ise direkt kullan
  if (error instanceof AppError) {
    return error;
  }

  // Prisma error kontrolü (eğer prisma.ts'den handlePrismaError kullanılmadıysa)
  if (error instanceof Error && error.name?.includes('Prisma')) {
    return new AppError(
      error.message,
      ErrorCodes.DATABASE_ERROR,
      500,
      { originalError: error.name, prisma: true },
      true // Retryable
    );
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      500,
      { originalError: error.name }
    );
  }

  // Bilinmeyen hatalar
  return new AppError(
    'Bilinmeyen bir hata oluştu',
    ErrorCodes.UNKNOWN_ERROR,
    500,
    { originalError: String(error) }
  );
}

/**
 * Merkezi hata işleyici
 * @param error Fırlatılan hata
 * @param request NextRequest (opsiyonel)
 * @returns NextResponse
 *
 * @example
 * try {
 *   // ... işlem
 * } catch (error) {
 *   return handleError(error, request);
 * }
 */
export function handleError(error: unknown, request?: NextRequest): NextResponse {
  const appError = normalizeError(error);

  // Correlation ID al (request'ten veya global'den)
  const correlationId = request?.headers.get('x-correlation-id') ||
    logger.getCorrelationId?.();

  // Log seviyesi belirle
  const isServerError = appError.statusCode >= 500;
  const logLevel = isServerError ? 'error' : 'warn';

  // Log context
  const logContext = {
    url: request?.url,
    method: request?.method,
    code: appError.code,
    statusCode: appError.statusCode,
    category: appError.getCategory(),
    retryable: appError.retryable,
    correlationId,
    ...(isServerError && {
      stack: appError.stack,
      details: appError.details,
    }),
    ...(!isServerError && {
      details: appError.details,
    }),
  };

  // Logla
  if (isServerError) {
    logger.error(`[${appError.code}] ${appError.message}`, logContext, appError);
  } else {
    logger.warn(`[${appError.code}] ${appError.message}`, logContext);
  }

  // Error response oluştur
  const errorResponse: ErrorResponse = {
    error: appError.code,
    message: isServerError
      ? HttpStatusMessages[appError.statusCode] || 'Bir hata oluştu'
      : appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
    requestId: correlationId,
    retryable: appError.retryable,
  };

  // Geliştirme ortamında detayları ekle
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      ...appError.details,
      ...(appError.stack && { stack: appError.stack.split('\n').slice(0, 5) }),
      category: appError.getCategory(),
    };
  }

  return NextResponse.json(
    errorResponse,
    {
      status: appError.statusCode,
      headers: correlationId
        ? { 'X-Correlation-Id': correlationId }
        : undefined,
    }
  );
}

/**
 * Hata retryable mı kontrol et
 * @param error Hata objesi veya kod
 * @returns boolean
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  if (typeof error === 'string') {
    return RetryableErrorCodes.includes(error);
  }
  return false;
}

// ============================================
// ASYNC HANDLER WRAPPERS
// ============================================

/**
 * Route handler'ı error handling ile wrap et
 * @param handler Next.js route handler fonksiyonu
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * });
 */
export function withErrorHandler<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T
): (request: NextRequest) => Promise<NextResponse> {
  return async function (request: NextRequest): Promise<NextResponse> {
    // Correlation ID set et
    const correlationId = request.headers.get('x-correlation-id') ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setGlobalCorrelationId(correlationId);

    try {
      return await handler(request);
    } catch (error) {
      return handleError(error, request);
    } finally {
      clearGlobalCorrelationId();
    }
  };
}

/**
 * Generic async fonksiyonu error handling ile wrap et
 * @param fn Async fonksiyon
 * @returns Wrapped fonksiyon (result | error tuple)
 *
 * @example
 * const [result, error] = await safeAsync(() => fetchData());
 * if (error) {
 *   // Hata işleme
 * } else {
 *   // Başarılı işlem
 * }
 */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, normalizeError(error)];
  }
}

// ============================================
// ERROR FACTORIES
// ============================================

/**
 * Validation error oluştur
 * @param field Hatalı alan adı
 * @param message Hata mesajı
 * @param details Ek detaylar
 * @returns AppError
 */
export function createValidationError(
  field: string,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return new AppError(
    `Validasyon hatası: ${field}`,
    ErrorCodes.VALIDATION_ERROR,
    400,
    { field, message, ...details }
  );
}

/**
 * Not found error oluştur
 * @param resource Kaynak adı
 * @param id Kaynak ID'si (opsiyonel)
 * @returns AppError
 */
export function createNotFoundError(resource: string, id?: string | number): AppError {
  const message = id
    ? `${resource} (id: ${id}) bulunamadı`
    : `${resource} bulunamadı`;

  return new AppError(
    message,
    ErrorCodes.NOT_FOUND,
    404,
    { resource, ...(id && { id }) }
  );
}

/**
 * Auth error oluştur
 * @param message Hata mesajı
 * @param details Ek detaylar
 * @returns AppError
 */
export function createAuthError(
  message: string = 'Yetkisiz erişim',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCodes.UNAUTHORIZED, 401, details);
}

/**
 * Forbidden error oluştur
 * @param message Hata mesajı
 * @param details Ek detaylar
 * @returns AppError
 */
export function createForbiddenError(
  message: string = 'Erişim reddedildi',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCodes.FORBIDDEN, 403, details);
}

/**
 * Database error oluştur (retryable)
 * @param message Hata mesajı
 * @param details Ek detaylar
 * @returns AppError
 */
export function createDatabaseError(
  message: string = 'Veritabanı hatası',
  details?: Record<string, unknown>
): AppError {
  return new AppError(
    message,
    ErrorCodes.DATABASE_ERROR,
    500,
    details,
    true // Retryable
  );
}

/**
 * External API error oluştur (retryable)
 * @param service API servis adı
 * @param message Hata mesajı
 * @param details Ek detaylar
 * @returns AppError
 */
export function createExternalAPIError(
  service: string,
  message: string = 'Harici servis hatası',
  details?: Record<string, unknown>
): AppError {
  return new AppError(
    `[${service}] ${message}`,
    ErrorCodes.EXTERNAL_API_ERROR,
    502,
    { service, ...details },
    true // Retryable
  );
}

/**
 * Rate limit error oluştur
 * @param retryAfter Saniye cinsinden bekleme süresi
 * @returns AppError
 */
export function createRateLimitError(retryAfter: number = 60): AppError {
  return new AppError(
    `Çok fazla istek. Lütfen ${retryAfter} saniye sonra tekrar deneyin.`,
    ErrorCodes.RATE_LIMITED,
    429,
    { retryAfter },
    true // Retryable
  );
}

/**
 * Conflict error oluştur (duplicate, vb.)
 * @param resource Kaynak adı
 * @param message Hata mesajı
 * @returns AppError
 */
export function createConflictError(
  resource: string,
  message?: string
): AppError {
  return new AppError(
    message || `${resource} zaten mevcut`,
    ErrorCodes.CONFLICT,
    409,
    { resource }
  );
}

// ============================================
// EXPORTS
// ============================================

export default {
  handleError,
  withErrorHandler,
  safeAsync,
  isRetryableError,
  createValidationError,
  createNotFoundError,
  createAuthError,
  createForbiddenError,
  createDatabaseError,
  createExternalAPIError,
  createRateLimitError,
  createConflictError,
  AppError,
  ErrorCodes,
  HttpStatusMessages,
  ErrorCodeToStatus,
  RetryableErrorCodes,
};
