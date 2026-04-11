/**
 * ============================================
 * TEMEL ENTITY TİPLERİ (Base Types)
 * ============================================
 */

/**
 * Tüm veritabanı entity'leri için temel interface
 * DRY prensibi: id, createdAt, updatedAt alanlarını merkezileştirir
 */
export interface BaseEntity {
  /** Benzersiz tanımlayıcı (UUID veya benzeri) */
  id: string;
  /** Oluşturulma zamanı (ISO 8601 formatında) */
  createdAt: string;
  /** Son güncelleme zamanı (ISO 8601 formatında) */
  updatedAt: string;
}

/**
 * Zaman damgası içeren entity'ler için utility type
 * @example type MyEntity = WithTimestamps<{ name: string }>;
 */
export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
};

/**
 * ============================================
 * İÇERİK YÖNETİMİ TİPLERİ (Content Types)
 * ============================================
 */

/**
 * Temizlik hizmeti tanımı
 * Ana hizmetler sayfasında ve detay sayfalarında kullanılır
 */
export interface Service extends BaseEntity {
  /** Hizmet başlığı (örn: "Profesyonel Halı Yıkama") */
  title: string;
  /** URL-friendly tanımlayıcı (örn: "hali-yikama") */
  slug: string;
  /** Detaylı açıklama (HTML içerebilir) */
  description: string;
  /** Kart görünümünde kısa açıklama (max 150 karakter önerilir) */
  shortDesc: string;
  /** Hero görsel URL'i */
  image?: string;
  /** Lucide icon ismi (örn: "Sparkles", "Home", "Car") */
  icon: string;
  /** Hizmet özellikleri listesi (örn: ["Derinlemesine temizlik", "Hızlı kuruma"]) */
  features: string[];
  /** Fiyat aralığı gösterimi (örn: "₺500 - ₺1.500" veya "Fiyat için arayın") */
  priceRange?: string;
  /** Sıralama indeksi (düşük değer = önce göster) */
  order: number;
  /** Yayın durumu (false = taslak) */
  isActive: boolean;
  /** SEO meta başlığı (opsiyonel, varsayılan: title) */
  metaTitle?: string;
  /** SEO meta açıklaması (opsiyonel, varsayılan: shortDesc) */
  metaDesc?: string;
}

/**
 * Blog yazısı tanımı
 * Blog listeleme ve detay sayfalarında kullanılır
 */
export interface BlogPost extends BaseEntity {
  /** Yazı başlığı */
  title: string;
  /** URL-friendly tanımlayıcı */
  slug: string;
  /** Tam içerik (Markdown veya HTML) */
  content: string;
  /** Listelemede gösterilen özet (max 200 karakter) */
  excerpt: string;
  /** Kapak görseli URL'i */
  image?: string;
  /** Kategori adı (örn: "Temizlik İpuçları", "Haberler") */
  category: string;
  /** Etiketler listesi (SEO ve filtreleme için) */
  tags: string[];
  /** Yazar adı */
  author: string;
  /** Yayınlanma durumu */
  published: boolean;
  /** Görüntülenme sayısı (analitik) */
  views: number;
  /** SEO meta başlığı */
  metaTitle?: string;
  /** SEO meta açıklaması */
  metaDesc?: string;
}

/**
 * Sıkça Sorulan Soru (FAQ)
 * SSS sayfasında kullanılır
 */
export interface FAQ extends BaseEntity {
  /** Soru metni */
  question: string;
  /** Cevap metni (HTML içerebilir) */
  answer: string;
  /** Kategori (örn: "Genel", "Hizmetler", "Fiyatlandırma") */
  category: string;
  /** Sıralama indeksi */
  order: number;
  /** Yayın durumu */
  isActive: boolean;
}

/**
 * Fiyat listesi öğesi
 * Fiyatlandırma sayfasında kullanılır
 */
export interface PricingItem extends BaseEntity {
  /** Hizmet adı */
  serviceName: string;
  /** Açıklama */
  description: string;
  /** Başlangıç fiyatı (örn: "₺500") */
  startingPrice: string;
  /** Detaylı fiyatlandırma (opsiyonel) */
  details?: string;
  /** Hizmet kategorisi */
  category: string;
  /** Yayın durumu */
  isActive: boolean;
  /** Sıralama indeksi */
  order: number;
}

/**
 * Galeri görseli
 * Galeri sayfasında kullanılır
 */
export interface GalleryImage extends BaseEntity {
  /** Görsel URL'i */
  image: string;
  /** Başlık / Açıklama */
  title?: string;
  /** Kategori (örn: "Halı Yıkama", "Koltuk Temizliği") */
  category: string;
  /** Yayın durumu */
  isActive: boolean;
  /** Sıralama indeksi */
  order: number;
}

/**
 * Sertifika
 * Hakkımızda sayfasında kullanılır
 */
export interface Certificate extends BaseEntity {
  /** Sertifika adı */
  name: string;
  /** Veren kurum */
  issuer: string;
  /** Sertifika görseli URL'i */
  image?: string;
  /** Açıklama */
  description?: string;
  /** Yayın durumu */
  isActive: boolean;
  /** Sıralama indeksi */
  order: number;
}

/**
 * Ekip üyesi
 * Ekibimiz sayfasında kullanılır
 */
export interface TeamMember extends BaseEntity {
  /** Tam isim */
  name: string;
  /** Unvan / Pozisyon (örn: "Operasyon Müdürü") */
  position: string;
  /** Biyografi / Açıklama */
  bio?: string;
  /** Profil fotoğrafı URL'i */
  image?: string;
  /** Telefon numarası */
  phone?: string;
  /** E-posta adresi */
  email?: string;
  /** LinkedIn profil URL'i */
  linkedin?: string;
  /** Sıralama indeksi */
  order: number;
  /** Yayın durumu */
  isActive: boolean;
  /** SEO meta başlığı */
  metaTitle?: string;
  /** SEO meta açıklaması */
  metaDesc?: string;
}

/**
 * ============================================
 * KULLANICI & ETKİLEŞİM TİPLERİ (User Types)
 * ============================================
 */

/**
 * İletişim talebi / Form gönderimi
 * Talepler sayfasında kullanılır
 */
export interface ContactRequest {
  /** Benzersiz ID */
  id: string;
  /** Gönderenin adı soyadı */
  name: string;
  /** E-posta adresi */
  email: string;
  /** Telefon numarası (opsiyonel) */
  phone?: string;
  /** İlgili hizmet (opsiyonel) */
  service?: string;
  /** Mesaj içeriği */
  message: string;
  /** Okunma durumu (admin tarafından) */
  read: boolean;
  /** Gönderim zamanı */
  createdAt: string;
}

/**
 * Müşteri yorumu (Referans)
 * Referanslar sayfasında kullanılır
 */
export interface Testimonial {
  /** Benzersiz ID */
  id: string;
  /** Müşteri adı */
  name: string;
  /** Konum / Şehir (örn: "İstanbul, Kadıköy") */
  location: string;
  /** Değerlendirme puanı (1-5) */
  rating: number;
  /** Yorum içeriği */
  content: string;
  /** Avatar URL'i veya emoji (örn: "👤", "👩") */
  avatar?: string;
  /** İlgili hizmet (opsiyonel) */
  service?: string;
  /** Seed ile gelen kanonik yorum anahtarı (panel kayıtlarında genelde yok) */
  seedKey?: string | null;
  /** Yayın durumu */
  isActive: boolean;
  /** Sıralama indeksi */
  order: number;
  /** Oluşturulma zamanı */
  createdAt: string;
}

/**
 * Kullanıcı (Admin/Normal)
 * Auth sistemi için
 */
export interface User {
  /** Benzersiz ID */
  id: string;
  /** Görünen isim (opsiyonel) */
  name?: string;
  /** E-posta adresi (benzersiz) */
  email: string;
  /** Profil fotoğrafı URL'i */
  image?: string;
  /** Kullanıcı rolü */
  role: UserRole;
  /** Hesap oluşturulma zamanı */
  createdAt?: string;
  /** Son giriş zamanı */
  lastLoginAt?: string;
}

/**
 * Kullanıcı rolleri
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * ============================================
 * UI & SEO TİPLERİ (UI Types)
 * ============================================
 */

/**
 * Navigasyon menü öğesi
 * Header ve sidebar'da kullanılır
 */
export interface NavItem {
  /** Hedef URL */
  href: string;
  /** Görünen etiket */
  label: string;
  /** Lucide icon ismi (opsiyonel) */
  icon?: string;
  /** Alt menü öğeleri (opsiyonel) */
  children?: NavItem[];
  /** Sadece admin görür (opsiyonel) */
  adminOnly?: boolean;
}

/**
 * SEO meta verileri
 * Next.js Head ve meta tag'ler için
 */
export interface SEOProps {
  /** Sayfa başlığı (60 karakter önerilir) */
  title: string;
  /** Meta açıklama (160 karakter önerilir) */
  description: string;
  /** Anahtar kelimeler (opsiyonel) */
  keywords?: string[];
  /** Open Graph görsel URL'i */
  ogImage?: string;
  /** Canonical URL */
  canonical?: string;
  /** Arama motorları indekslemesini engelle */
  noIndex?: boolean;
  /** Yapısal veri (JSON-LD) */
  structuredData?: Record<string, unknown>;
}

/**
 * API yanıt tipi
 * Standart API yanıt yapısı
 */
export interface ApiResponse<T> {
  /** Başarı durumu */
  success: boolean;
  /** Yanıt verisi */
  data?: T;
  /** Hata mesajı (başarısızsa) */
  error?: string;
  /** Sayfalama bilgisi (liste endpointleri için) */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sayfalama parametreleri
 * Liste API'leri için
 */
export interface PaginationParams {
  /** Sayfa numarası (1-based) */
  page?: number;
  /** Sayfa başına öğe sayısı */
  limit?: number;
  /** Sıralama alanı */
  sortBy?: string;
  /** Sıralama yönü */
  sortOrder?: 'asc' | 'desc';
  /** Arama sorgusu */
  search?: string;
}

/**
 * ============================================
 * UTILITY TİPLERİ (Helper Types)
 * ============================================
 */

/**
 * Form durumları için utility type
 */
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Yayın durumu için reusable type
 */
export type PublishStatus = 'draft' | 'published' | 'archived';

/**
 * Nullable utility (strict null checks için)
 */
export type Nullable<T> = T | null;

/**
 * Optional utility (partial type için)
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * API Entity oluşturma için (id ve timestamps olmadan)
 * @example type CreateServiceInput = CreateInput<Service>;
 */
export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * API Entity güncelleme için (tüm alanlar opsiyonel)
 * @example type UpdateServiceInput = UpdateInput<Service>;
 */
export type UpdateInput<T extends BaseEntity> = Partial<CreateInput<T>>;

/**
 * Tema tipleri
 */
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
