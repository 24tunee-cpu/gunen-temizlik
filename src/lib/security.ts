/**
 * @fileoverview Güvenlik Yardımcı Fonksiyonları
 * @description Auth middleware, rate limiting, input sanitization,
 * CSRF koruması, security headers, ve audit logging.
 *
 * @security
 * - Production'da NEXTAUTH_SECRET zorunlu
 * - Rate limiting Redis'e taşınmalı (scale için)
 * - CSP header'ları özelleştirilmeli
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { randomBytes } from 'crypto';

// ============================================
// CONFIGURATION & TYPES
// ============================================

/** Security event tipleri */
export type SecurityEvent =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_HIT'
  | 'CSRF_FAILURE'
  | 'API_KEY_INVALID'
  | 'INPUT_SANITIZED';

/** Rate limit sonuç arayüzü */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

/** Audit log detayları */
interface AuditDetails {
  ip?: string;
  userId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  reason?: string;
  role?: string;
  originalLength?: number;
  sanitizedLength?: number;
  identifier?: string;
  count?: number;
  windowMs?: number;
  hasHeaderToken?: boolean;
  hasCookieToken?: boolean;
  keyPrefix?: string;
  requiredRole?: string;
  actualRole?: string;
  metadata?: Record<string, unknown>;
}

/** Rate limit store kaydı */
interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/** Varsayılan rate limit ayarları */
const DEFAULT_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60000, // 1 dakika
  cleanupIntervalMs: 300000, // 5 dakika cleanup
};

/** CSRF token uzunluğu (bytes) */
const CSRF_TOKEN_LENGTH = 32;

/** CSP Policy - production'da strict hale getir */
const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js için gerekli
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'https://api.gunentemizlik.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Admin yetkilendirmesi için middleware fonksiyonu
 * @param req NextRequest objesi
 * @returns NextResponse (401) veya null (başarılı)
 *
 * @throws Error - NEXTAUTH_SECRET tanımlı değilse (production'da)
 */
export async function requireAdminAuth(
  req: NextRequest
): Promise<NextResponse | null> {
  const secret = process.env.NEXTAUTH_SECRET;

  // Production'da secret zorunlu
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('[SECURITY] NEXTAUTH_SECRET not configured in production');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const token = await getToken({
    req,
    secret: secret || 'development-secret-do-not-use-in-production',
  });

  const ip = getClientIp(req);

  if (!token) {
    logSecurityEvent('AUTH_FAILURE', {
      ip,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: 'No token provided',
    });

    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  const role = String(token.role || '');
  if (role !== 'ADMIN' && role !== 'EDITOR') {
    logSecurityEvent('AUTH_FAILURE', {
      ip,
      userId: token.sub ? String(token.sub) : undefined,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: 'Insufficient role',
      requiredRole: 'ADMIN|EDITOR',
      actualRole: role,
    });

    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  logSecurityEvent('AUTH_SUCCESS', {
    ip,
    userId: token.sub ? String(token.sub) : undefined,
    path: req.nextUrl.pathname,
    method: req.method,
    role: token.role ? String(token.role) : undefined,
  });

  return null; // Auth başarılı
}

/**
 * Yalnızca `ADMIN` rolü (silme, yönlendirme, denetim günlüğü, tam site ayarı vb.).
 */
export async function requireAdminOnly(req: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = await getToken({
    req,
    secret: secret || 'development-secret-do-not-use-in-production',
  });

  const ip = getClientIp(req);

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  if (String(token.role || '') !== 'ADMIN') {
    logSecurityEvent('AUTH_FAILURE', {
      ip,
      userId: token.sub ? String(token.sub) : undefined,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: 'Full admin required',
      requiredRole: 'ADMIN',
      actualRole: String(token.role),
    });
    return NextResponse.json(
      { error: 'Forbidden - Full administrator access required' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * API Key yetkilendirmesi
 * @param req NextRequest objesi
 * @returns NextResponse (401) veya null (başarılı)
 */
export function requireApiKey(req: NextRequest): NextResponse | null {
  const apiKey = req.headers.get('x-api-key');
  const validKey = process.env.INTERNAL_API_KEY;

  const ip = getClientIp(req);

  if (!validKey) {
    console.error('[SECURITY] INTERNAL_API_KEY not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!apiKey) {
    logSecurityEvent('API_KEY_INVALID', {
      ip,
      path: req.nextUrl.pathname,
      reason: 'No API key provided',
    });

    return NextResponse.json(
      { error: 'Unauthorized - API key required' },
      { status: 401 }
    );
  }

  if (apiKey !== validKey) {
    logSecurityEvent('API_KEY_INVALID', {
      ip,
      path: req.nextUrl.pathname,
      reason: 'Invalid API key',
      // API key'in ilk 4 karakterini logla (debug için, tamamı değil)
      keyPrefix: apiKey.substring(0, 4) + '...',
    });

    return NextResponse.json(
      { error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    );
  }

  return null; // Auth başarılı
}

/**
 * Client IP adresini al
 * X-Forwarded-For header'ını da dikkate alır
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (realIp) return realIp;
  if (forwarded) return forwarded.split(',')[0].trim();

  // NextRequest'te ip property yok, placeholder döndür
  return 'unknown';
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Input sanitization - XSS koruması
 * @param input Temizlenecek string
 * @returns Sanitize edilmiş string
 *
 * @note Production'da DOMPurify kullanımı önerilir
 * @see https://github.com/cure53/DOMPurify
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const sanitized = input
    .replace(/[<>]/g, '') // HTML tag karakterlerini kaldır
    .replace(/javascript:/gi, '') // javascript: protokolünü kaldır
    .replace(/data:/gi, '') // data: protokolünü kaldır
    .replace(/on\w+=/gi, '') // Event handler'ları kaldır (onclick, onerror, vb.)
    .replace(/expression\s*\(/gi, '') // CSS expression
    .replace(/import\s*\(/gi, '') // Dynamic import
    .replace(/\[\s*constructor\s*\]/gi, '') // Constructor access
    .trim();

  if (sanitized !== input) {
    logSecurityEvent('INPUT_SANITIZED', {
      originalLength: input.length,
      sanitizedLength: sanitized.length,
    });
  }

  return sanitized;
}

/**
 * HTML içeriği için güvenli encoding
 * @param text Encode edilecek text
 * @returns HTML entity encoded string
 */
export function htmlEncode(text: string): string {
  if (!text) return '';

  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => entities[char] || char);
}

/**
 * Dizi içeriği (array) için recursive sanitization
 * @param data Sanitize edilecek data (string veya array)
 * @returns Sanitize edilmiş data
 */
export function sanitizeArray<T>(data: T[]): T[] {
  return data.map((item) => {
    if (typeof item === 'string') {
      return sanitizeInput(item) as unknown as T;
    }
    if (Array.isArray(item)) {
      return sanitizeArray(item) as unknown as T;
    }
    if (typeof item === 'object' && item !== null) {
      return sanitizeObject(item as Record<string, unknown>) as unknown as T;
    }
    return item;
  });
}

/**
 * Object içeriği için recursive sanitization
 * @param data Sanitize edilecek object
 * @returns Sanitize edilmiş object
 */
export function sanitizeObject<T extends Record<string, unknown>>(data: T): T {
  const result = {} as T;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeArray(value);
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Email validasyonu (RFC 5322 subset)
 * @param email Kontrol edilecek email
 * @returns boolean
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Maksimum uzunluk kontrolü (RFC 5321)
  if (email.length > 254) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Email domain validasyonu (MX lookup yok, sadece format)
 * @param email Kontrol edilecek email
 * @returns { isValid: boolean; isDisposable: boolean }
 */
export function validateEmailExtended(email: string): {
  isValid: boolean;
  isDisposable: boolean;
  domain: string | null;
} {
  if (!isValidEmail(email)) {
    return { isValid: false, isDisposable: false, domain: null };
  }

  const domain = email.split('@')[1]?.toLowerCase() || null;

  // Basit disposable email kontrolü (tam liste için external API gerekli)
  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
    'yopmail.com', 'fakeemail.com', 'temp-mail.org', 'dispostable.com',
  ];

  const isDisposable = domain ? disposableDomains.includes(domain) : false;

  return { isValid: true, isDisposable, domain };
}

/**
 * Telefon numarası validasyonu (Türkiye)
 * @param phone Kontrol edilecek telefon numarası
 * @returns boolean
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;

  // +90 ile başlayan veya 0 ile başlayan formatlar
  // Boşluk ve tire'lara izin ver
  const phoneRegex = /^(\+90|0)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Telefon numarasını normalize et (sadece rakamlar)
 * @param phone Telefon numarası
 * @returns Normalized telefon numarası veya null
 */
export function normalizePhone(phone: string): string | null {
  if (!phone) return null;

  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '');

  // Türkiye formatı: 10 haneli (5xx xxx xxxx) veya 11 haneli (05xx xxx xxxx)
  if (digits.length === 10) {
    return digits; // 5xxxxxxxxx
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.substring(1); // 05xxxxxxxx → 5xxxxxxxxx
  }

  return null;
}

/**
 * Güçlü şifre kontrolü
 * @param password Kontrol edilecek şifre
 * @returns { isValid: boolean; errors: string[] }
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalı');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermeli');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermeli');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('En az bir rakam içermeli');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('En az bir özel karakter içermeli');
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Rate limiting için in-memory store
 * @warning Production'da Redis kullanılmalı!
 * @note Memory leak önlemi için TTL cleanup var
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

/** Store temizleme zamanı */
let lastCleanup = Date.now();

/**
 * Eski kayıtları temizle (memory leak önlemi)
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();

  // 5 dakikada bir temizle
  if (now - lastCleanup < DEFAULT_RATE_LIMIT.cleanupIntervalMs) return;

  let cleaned = 0;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.debug(`[SECURITY] Rate limit store cleanup: ${cleaned} entries removed`);
  }

  lastCleanup = now;
}

/**
 * Rate limit kontrolü
 * @param identifier Rate limit key (IP, userId, vb.)
 * @param maxRequests Maksimum istek sayısı
 * @param windowMs Pencere süresi (ms)
 * @returns RateLimitResult
 *
 * @example
 * const result = checkRateLimit('192.168.1.1', 10, 60000);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = DEFAULT_RATE_LIMIT.maxRequests,
  windowMs: number = DEFAULT_RATE_LIMIT.windowMs
): RateLimitResult {
  cleanupRateLimitStore();

  const now = Date.now();
  const key = identifier;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Yeni pencere
    const resetTime = now + windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
      firstRequest: now,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
      totalHits: 1,
    };
  }

  if (record.count >= maxRequests) {
    logSecurityEvent('RATE_LIMIT_HIT', {
      identifier: key.substring(0, 10) + '...',
      count: record.count,
      windowMs,
    });

    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      totalHits: record.count,
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
    totalHits: record.count,
  };
}

/**
 * Rate limit store'u manuel temizle (test için)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
  lastCleanup = Date.now();
  console.log('[SECURITY] Rate limit store cleared');
}

/**
 * Rate limit middleware'i
 * @param req NextRequest
 * @param maxRequests Maksimum istek sayısı
 * @param windowMs Pencere süresi (ms)
 * @returns NextResponse (429) veya null (başarılı)
 */
export function rateLimitMiddleware(
  req: NextRequest,
  maxRequests: number = DEFAULT_RATE_LIMIT.maxRequests,
  windowMs: number = DEFAULT_RATE_LIMIT.windowMs
): NextResponse | null {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip, maxRequests, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        },
      }
    );
  }

  return null;
}

// ============================================
// CSRF PROTECTION
// ============================================

/**
 * CSRF token oluştur
 * @returns Güvenli random token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF token kontrolü
 * @param req NextRequest
 * @returns boolean - true = valid
 *
 * @note Cookie ve header'daki token'ı karşılaştırır
 * @warning GET istekleri için CSRF kontrolü yapılmamalı!
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // GET, HEAD, OPTIONS istekleri için CSRF kontrolü yok
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return true;
  }

  const csrfToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf-token')?.value;

  const ip = getClientIp(req);

  // Token yoksa reject
  if (!csrfToken || !cookieToken) {
    logSecurityEvent('CSRF_FAILURE', {
      ip,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: 'Missing token',
      hasHeaderToken: !!csrfToken,
      hasCookieToken: !!cookieToken,
    });
    return false;
  }

  // Timing attack koruması için sabit zamanlı karşılaştırma
  const isValid = timingSafeEqual(csrfToken, cookieToken);

  if (!isValid) {
    logSecurityEvent('CSRF_FAILURE', {
      ip,
      path: req.nextUrl.pathname,
      method: req.method,
      reason: 'Token mismatch',
    });
  }

  return isValid;
}

/**
 * Timing attack korumalı string karşılaştırma
 * @param a String A
 * @param b String B
 * @returns boolean
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRF middleware'i
 * @param req NextRequest
 * @returns NextResponse (403) veya null (başarılı)
 */
export function csrfMiddleware(req: NextRequest): NextResponse | null {
  if (!validateCsrfToken(req)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  return null;
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Content Security Policy (CSP) header'ını oluştur
 * @returns CSP string
 */
export function generateCSP(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Security headers ekleme
 * @param response NextResponse
 * @returns Güvenlik header'ları eklenmiş NextResponse
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // XSS Protection (legacy, CSP tercih edilmeli)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Type Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Frame Options
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Content Security Policy (CSP)
  // Production'da nonce kullanımı önerilir
  response.headers.set('Content-Security-Policy', generateCSP());

  // HSTS (HTTPS Strict Transport Security)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Cache Control (sensitive data için)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

/**
 * CORS header'ları ekleme (API routes için)
 * @param response NextResponse
 * @param allowedOrigins İzin verilen origin'ler
 * @returns CORS header'ları eklenmiş NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  allowedOrigins: string[] = []
): NextResponse {
  const origin = allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '*';

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Güvenlik olaylarını logla
 * @param event Olay tipi
 * @param details Olay detayları
 */
export function logSecurityEvent(
  event: SecurityEvent,
  details: AuditDetails
): void {
  const timestamp = new Date().toISOString();

  // Structured logging
  const logEntry = {
    timestamp,
    type: 'SECURITY_EVENT',
    event,
    severity: getEventSeverity(event),
    ...details,
  };

  // Hata seviyesine göre log level seç
  if (logEntry.severity === 'HIGH') {
    console.error(`[SECURITY] ${event}`, logEntry);
  } else if (logEntry.severity === 'MEDIUM') {
    console.warn(`[SECURITY] ${event}`, logEntry);
  } else {
    console.log(`[SECURITY] ${event}`, logEntry);
  }
}

/**
 * Güvenlik olayı seviyesi belirle
 * @param event Olay tipi
 * @returns 'LOW' | 'MEDIUM' | 'HIGH'
 */
function getEventSeverity(event: SecurityEvent): 'LOW' | 'MEDIUM' | 'HIGH' {
  const severityMap: Record<SecurityEvent, 'LOW' | 'MEDIUM' | 'HIGH'> = {
    'AUTH_SUCCESS': 'LOW',
    'AUTH_FAILURE': 'HIGH',
    'RATE_LIMIT_HIT': 'MEDIUM',
    'CSRF_FAILURE': 'HIGH',
    'API_KEY_INVALID': 'HIGH',
    'INPUT_SANITIZED': 'LOW',
  };

  return severityMap[event];
}

// ============================================
// COMPOSITE MIDDLEWARES
// ============================================

/**
 * Tüm güvenlik middleware'lerini birleştir
 * @param req NextRequest
 * @returns NextResponse veya null
 *
 * @example
 * export async function middleware(req: NextRequest) {
 *   const response = securityMiddleware(req);
 *   if (response) return response;
 *
 *   // Devam et...
 * }
 */
export function securityMiddleware(req: NextRequest): NextResponse | null {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(req, 100, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  // CSRF (sadece mutasyon istekleri için)
  const csrfResponse = csrfMiddleware(req);
  if (csrfResponse) return csrfResponse;

  return null;
}
