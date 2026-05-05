/**
 * Blog yazıları için meta başlık ve açıklama (SEO).
 * Özel meta yoksa başlık + marka ve özetten güvenli uzunlukta türetilir.
 * CTR optimizasyonu ile clickbait + profesyonel yaklaşım.
 */

const TITLE_MAX = 58;
const DESC_MAX = 155;
const TITLE_SUFFIX = ' | Günen Temizlik Blog';

function truncateChars(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function normalizeTitleBrand(input: string): string {
  return input
    .replace(/(\s*\|\s*G[uü]nen Temizlik(?: Blog)?\s*)+$/iu, '')
    .trim();
}

/**
 * Sayfa <title> ve OpenGraph title için.
 * `storedMeta` doluysa öncelikli; yoksa yazı başlığı + marka (uzunluk sınırlı).
 */
export function resolveBlogMetaTitle(
  title: string,
  storedMeta: string | null | undefined
): string {
  const custom = storedMeta?.trim();
  if (custom) return truncateChars(normalizeTitleBrand(custom), 60);

  const base = normalizeTitleBrand(title.trim());
  const suffix = TITLE_SUFFIX;
  if (base.length + suffix.length <= TITLE_MAX) return base + suffix;

  const maxBase = TITLE_MAX - suffix.length - 1;
  const shortened = base.slice(0, Math.max(8, maxBase)).trimEnd();
  return `${shortened}…${suffix}`;
}

/**
 * Meta description ve OG/Twitter açıklaması.
 * `storedMeta` doluysa öncelikli; yoksa özet (tek satır, uzunluk sınırlı).
 */
export function resolveBlogMetaDesc(
  excerpt: string,
  storedMeta: string | null | undefined
): string {
  const custom = storedMeta?.trim();
  if (custom) return truncateChars(custom, 160);

  const plain = excerpt.replace(/\s+/g, ' ').trim();
  return truncateChars(plain, DESC_MAX);
}

// ============================================
// CTR OPTIMIZASYON FONKSİYONLARI
// ============================================

import { generateCTROptimizedBlogMeta } from './ctr-optimized-meta';

/**
 * CTR optimize edilmiş blog meta başlığı
 * Mevcut sistemi korurken CTR artışı sağlar
 */
export function resolveCTROptimizedBlogTitle(
  title: string,
  storedMeta: string | null | undefined,
  category: string,
  content: string
): string {
  const custom = storedMeta?.trim();
  if (custom) return truncateChars(normalizeTitleBrand(custom), 60);

  const optimized = generateCTROptimizedBlogMeta(title, '', category, content, custom);
  return truncateChars(normalizeTitleBrand(optimized.title), 60);
}

/**
 * CTR optimize edilmiş blog meta açıklaması
 * Mevcut sistemi korurken CTR artışı sağlar
 */
export function resolveCTROptimizedBlogDesc(
  excerpt: string,
  storedMeta: string | null | undefined,
  title: string,
  category: string
): string {
  const custom = storedMeta?.trim();
  if (custom) return truncateChars(custom, 160);

  const optimized = generateCTROptimizedBlogMeta(title, excerpt, category, excerpt, null, custom);
  return truncateChars(optimized.description, DESC_MAX);
}
