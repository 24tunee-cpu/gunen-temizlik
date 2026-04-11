/**
 * @fileoverview Zod Validation Schemas
 * @description Form validation ve API input validasyon için Zod schema'ları.
 * Türkçe hata mesajları, coerce dönüşümleri, ve tip çıkarımları içerir.
 *
 * @example
 * // Form validasyonu
 * const result = serviceSchema.safeParse(formData);
 * if (!result.success) {
 *   console.log(result.error.flatten());
 * }
 *
 * // API validasyonu
 * const validated = await serviceSchema.parseAsync(req.body);
 */

import { z } from 'zod';

// ============================================
// HELPER FONKSİYONLAR
// ============================================

/**
 * Türkiye telefon numarası validasyonu
 * Format: 05XX XXX XX XX veya +90 5XX XXX XX XX
 */
const phoneRegex = /^(\+90|0)?\s*5[0-9]{2}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}$/;

/**
 * URL validasyonu (görsel URL'leri için)
 */
const urlRegex = /^https?:\/\/.+/;

/**
 * Telefon numarası schema helper
 */
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || phoneRegex.test(val.replace(/\s/g, '')),
    'Geçerli bir telefon numarası girin (örn: 0555 123 45 67)'
  );

/**
 * Görsel URL schema helper
 */
const imageUrlSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || urlRegex.test(val) || val.startsWith('/') || val.startsWith('data:image'),
    'Geçerli bir görsel URL girin'
  );

// ============================================
// SERVİS SCHEMA
// ============================================

/**
 * Hizmet (Service) validasyon şeması
 */
export const serviceSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı').max(100, 'Başlık en fazla 100 karakter olabilir'),
  slug: z
    .string()
    .min(3, 'Slug en az 3 karakter olmalı')
    .max(100, 'Slug en fazla 100 karakter olabilir')
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalı').max(5000, 'Açıklama çok uzun'),
  shortDesc: z.string().min(5, 'Kısa açıklama en az 5 karakter olmalı').max(200, 'Kısa açıklama en fazla 200 karakter'),
  image: imageUrlSchema,
  icon: z.string().min(1, 'İkon seçilmeli').default('Sparkles'),
  features: z.array(z.string().min(1)).min(1, 'En az bir özellik ekleyin'),
  priceRange: z.string().max(50, 'Fiyat aralığı çok uzun').optional(),
  order: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  metaTitle: z.string().max(60, 'Meta başlık en fazla 60 karakter').optional(),
  metaDesc: z.string().max(160, 'Meta açıklama en fazla 160 karakter').optional(),
});

/**
 * Hizmet güncelleme şeması (partial)
 */
export const serviceUpdateSchema = serviceSchema.partial();

// ============================================
// BLOG POST SCHEMA
// ============================================

/**
 * Blog yazısı validasyon şeması
 */
export const blogPostSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı').max(100, 'Başlık çok uzun'),
  slug: z
    .string()
    .min(3, 'Slug en az 3 karakter olmalı')
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  content: z.string().min(10, 'İçerik en az 10 karakter olmalı').max(50000, 'İçerik çok uzun'),
  excerpt: z.string().min(5, 'Özet en az 5 karakter olmalı').max(500, 'Özet en fazla 500 karakter'),
  image: imageUrlSchema,
  category: z.string().min(1, 'Kategori seçilmeli').max(50, 'Kategori adı çok uzun'),
  tags: z.array(z.string().min(1).max(30)).max(10, 'En fazla 10 etiket ekleyebilirsiniz'),
  published: z.coerce.boolean().default(false),
  metaTitle: z.string().max(200).optional(),
  metaDesc: z.string().max(300).optional(),
});

/**
 * Blog yazısı güncelleme şeması
 */
export const blogPostUpdateSchema = blogPostSchema.partial();

// ============================================
// CONTACT SCHEMA
// ============================================

/**
 * İletişim formu validasyon şeması
 */
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalı')
    .max(50, 'İsim en fazla 50 karakter olabilir')
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'İsim sadece harf içerebilir'),
  email: z.string().email('Geçerli bir e-posta adresi girin').max(100, 'E-posta çok uzun'),
  phone: phoneSchema,
  service: z.string().optional(),
  message: z
    .string()
    .min(10, 'Mesaj en az 10 karakter olmalı')
    .max(2000, 'Mesaj en fazla 2000 karakter olabilir'),
  privacyAccepted: z.coerce.boolean().refine((val) => val === true, {
    message: 'Gizlilik politikasını kabul etmelisiniz',
  }),
});

// ============================================
// AUTH SCHEMAS
// ============================================

/**
 * Login validasyon şeması
 */
export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin').max(100),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı').max(100, 'Şifre çok uzun'),
  rememberMe: z.coerce.boolean().optional(),
});

/**
 * Şifre değiştirme şeması
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalı').max(100),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

// ============================================
// FAQ SCHEMA
// ============================================

/**
 * SSS (FAQ) validasyon şeması
 */
export const faqSchema = z.object({
  question: z.string().min(5, 'Soru en az 5 karakter olmalı').max(200, 'Soru çok uzun'),
  answer: z.string().min(10, 'Cevap en az 10 karakter olmalı').max(2000, 'Cevap çok uzun'),
  category: z.string().min(1, 'Kategori seçilmeli').optional(),
  order: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const faqUpdateSchema = faqSchema.partial();

// ============================================
// CERTIFICATE SCHEMA
// ============================================

/**
 * Sertifika validasyon şeması
 */
export const certificateSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı').max(100),
  issuer: z.string().min(2, 'Veren kurum en az 2 karakter olmalı').max(100),
  date: z.coerce.date().optional(),
  image: imageUrlSchema,
  description: z.string().max(500).optional(),
  order: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const certificateUpdateSchema = certificateSchema.partial();

// ============================================
// REFERENCE SCHEMA
// ============================================

/**
 * Referans/Müşteri yorumu validasyon şeması
 */
export const referenceSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(50),
  company: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  content: z.string().min(10, 'Yorum en az 10 karakter olmalı').max(1000),
  rating: z.coerce.number().min(1).max(5).default(5),
  image: imageUrlSchema,
  isActive: z.coerce.boolean().default(true),
  order: z.coerce.number().min(0).default(0),
});

export const referenceUpdateSchema = referenceSchema.partial();

// ============================================
// PRICING SCHEMA
// ============================================

/**
 * Fiyatlandırma validasyon şeması
 */
export const pricingSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalı').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, 'Fiyat negatif olamaz'),
  unit: z.string().min(1, 'Birim gerekli').max(20).default('m²'),
  features: z.array(z.string().min(1)).default([]),
  isPopular: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  order: z.coerce.number().min(0).default(0),
});

export const pricingUpdateSchema = pricingSchema.partial();

// ============================================
// USER SCHEMA (Admin)
// ============================================

/**
 * Kullanıcı oluşturma şeması
 */
export const userSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(50),
  email: z.string().email('Geçerli e-posta girin').max(100),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı').max(100),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  isActive: z.coerce.boolean().default(true),
});

export const userUpdateSchema = userSchema.omit({ password: true }).partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

export type ContactInput = z.infer<typeof contactSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type FAQInput = z.infer<typeof faqSchema>;
export type FAQUpdateInput = z.infer<typeof faqUpdateSchema>;

export type CertificateInput = z.infer<typeof certificateSchema>;
export type CertificateUpdateInput = z.infer<typeof certificateUpdateSchema>;

export type ReferenceInput = z.infer<typeof referenceSchema>;
export type ReferenceUpdateInput = z.infer<typeof referenceUpdateSchema>;

export type PricingInput = z.infer<typeof pricingSchema>;
export type PricingUpdateInput = z.infer<typeof pricingUpdateSchema>;

export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
