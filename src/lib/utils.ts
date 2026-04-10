/**
 * @fileoverview Genel Yardımcı Fonksiyonlar (Utility Functions)
 * @description Tarih formatlama, slug oluşturma, validasyon,
 * ve UI yardımcı fonksiyonları.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// TAILWIND CSS UTILITIES
// ============================================

/**
 * Tailwind CSS className birleştirme
 * clsx + tailwind-merge kombinasyonu
 *
 * @example
 * cn('px-2 py-1', 'bg-red-500', { 'text-white': true });
 * // => 'px-2 py-1 bg-red-500 text-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Türkçe karakterleri İngilizce karşılıklarına dönüştür
 *
 * @example
 * trToEn('Çöp Kutusu'); // => 'Cop Kutusu'
 */
export function trToEn(text: string): string {
  const turkishChars: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'i': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };

  return text.replace(/[çÇğĞıIiİöÖşŞüÜ]/g, char => turkishChars[char] || char);
}

/**
 * URL-friendly slug oluştur
 * Türkçe karakter dönüşümü + normalize
 *
 * @example
 * generateSlug('Profesyonel Halı Yıkama');
 * // => 'profesyonel-hali-yikama'
 *
 * generateSlug('  Çöp   Kutusu  ');
 * // => 'cop-kutusu'
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return trToEn(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Aksanları kaldır
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Boşlukları tire yap
    .replace(/[^\w\-]+/g, '') // Alfanümerik olmayanları kaldır
    .replace(/\-\-+/g, '-') // Çoklu tireleri tek yap
    .replace(/^-+|-+$/g, ''); // Baştaki/sondaki tireleri kaldır
}

/**
 * Baş harfleri al (Avatar için)
 *
 * @example
 * getInitials('Ahmet Yılmaz'); // => 'AY'
 * getInitials('Günen Temizlik'); // => 'GT'
 */
export function getInitials(name: string): string {
  if (!name) return '';

  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Metin kısaltma
 *
 * @example
 * truncate('Uzun bir metin burada...', 20);
 * // => 'Uzun bir metin...'
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + suffix;
}

/**
 * İlk harfi büyük yap
 *
 * @example
 * capitalize('temizlik'); // => 'Temizlik'
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ============================================
// DATE UTILITIES
// ============================================

/** Tarih format seçenekleri */
export type DateFormat = 'short' | 'long' | 'full' | 'time' | 'datetime' | 'relative';

/**
 * Tarih formatla
 *
 * @example
 * formatDate(new Date(), 'short'); // => '09.04.2026'
 * formatDate(new Date(), 'long'); // => '9 Nisan 2026'
 * formatDate(new Date(), 'time'); // => '14:30'
 * formatDate(new Date(), 'datetime'); // => '9 Nisan 2026, 14:30'
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormat = 'long'
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return '';
  }

  const formats: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    relative: {}, // Relative time ayrı işlenir
  };

  if (format === 'relative') {
    return formatRelativeTime(d);
  }

  return new Intl.DateTimeFormat('tr-TR', formats[format]).format(d);
}

/**
 * Relative time formatla ("2 saat önce", "3 gün önce")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)); // => '1 saat önce'
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = [
    { label: 'yıl', seconds: 31536000 },
    { label: 'ay', seconds: 2592000 },
    { label: 'hafta', seconds: 604800 },
    { label: 'gün', seconds: 86400 },
    { label: 'saat', seconds: 3600 },
    { label: 'dakika', seconds: 60 },
    { label: 'saniye', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? '' : ''} önce`;
    }
  }

  return 'şimdi';
}

// ============================================
// CURRENCY UTILITIES
// ============================================

/**
 * Para birimi formatla (Türk Lirası)
 *
 * @example
 * formatCurrency(1500); // => '₺1.500,00'
 * formatCurrency(99.99); // => '₺99,99'
 */
export function formatCurrency(
  amount: number,
  currency: string = 'TRY',
  locale: string = 'tr-TR'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('Invalid amount provided to formatCurrency:', amount);
    return '';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Fiyat aralığı formatla
 *
 * @example
 * formatPriceRange(500, 1500); // => '₺500 - ₺1.500'
 */
export function formatPriceRange(min: number, max: number): string {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * E-posta validasyonu
 *
 * @example
 * validateEmail('test@example.com'); // => true
 * validateEmail('invalid'); // => false
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Telefon numarası validasyonu (Türkiye)
 *
 * @example
 * validatePhone('0532 123 45 67'); // => true
 * validatePhone('+90 532 123 45 67'); // => true
 */
export function validatePhone(phone: string): boolean {
  // Başında 0 veya +90, toplam 10-11 rakam
  const cleaned = phone.replace(/\s|-|\+|\(|\)/g, '');
  const regex = /^(0|90)?[0-9]{10}$/;
  return regex.test(cleaned);
}

/**
 * Telefon numarası temizle ve formatla
 *
 * @example
 * formatPhone('05321234567'); // => '0532 123 45 67'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  return phone;
}

// ============================================
// ASYNC UTILITIES
// ============================================

/**
 * Belirli süre bekle (Promise wrapper)
 *
 * @example
 * await sleep(1000); // 1 saniye bekle
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce fonksiyonu
 * Son çağrıdan belirli süre sonra çalışır
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   api.search(query);
 * }, 300);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle fonksiyonu
 * Belirli aralıklarla çalışır
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// ============================================
// CLIPBOARD UTILITIES
// ============================================

/**
 * Panoya kopyala
 *
 * @example
 * const success = await copyToClipboard('kopyalanacak metin');
 * if (success) toast.success('Kopyalandı!');
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

// ============================================
// FILE UTILITIES
// ============================================

/**
 * Dosya boyutunu formatla
 *
 * @example
 * formatFileSize(1024); // => '1 KB'
 * formatFileSize(1024 * 1024); // => '1 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Dosya uzantısı al
 *
 * @example
 * getFileExtension('image.jpg'); // => 'jpg'
 * getFileExtension('document.PDF'); // => 'pdf'
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// ============================================
// ARRAY & OBJECT UTILITIES
// ============================================

/**
 * Diziyi grupla (groupBy)
 *
 * @example
 * groupBy([{ category: 'A' }, { category: 'B' }], 'category');
 * // => { A: [{...}], B: [{...}] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Rastgele karakter dizisi oluştur
 *
 * @example
 * generateId(); // => 'a3f7k9m2'
 * generateId(12); // => 12 karakterlik ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
