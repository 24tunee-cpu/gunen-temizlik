/**
 * @fileoverview Site Settings Context
 * @description Global site ayarları yönetimi. API + localStorage fallback,
 * debounced auto-save, optimistic updates, ve validation.
 *
 * @example
 * // Provider kullanımı (layout.tsx)
 * <SiteSettingsProvider>
 *   {children}
 * </SiteSettingsProvider>
 *
 * @example
 * // Tüm ayarları al
 * const { settings, updateSettings, saveSettings } = useSiteSettings();
 *
 * @example
 * // Tekil ayar
 * const [siteName, setSiteName] = useSetting('siteName');
 *
 * @example
 * // SEO ayarları (subset)
 * const { seoSettings, updateSeo } = useSeoSettings();
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { SITE_CONTACT } from '@/config/site-contact';

// ============================================
// TYPES
// ============================================

/** Site ayarları kategorileri */
export type SettingsCategory = 'general' | 'contact' | 'seo' | 'social' | 'analytics' | 'advanced';

/** Site ayarları interface */
export interface SiteSettings {
  // Genel
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo: string;
  favicon: string;
  /** Marka vurgu rengi (veritabanı: accentColor) */
  accentColor: string;

  // İletişim
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  whatsapp: string;

  // SEO
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  twitterHandle: string;
  canonicalUrl: string;
  language: string;
  region: string;

  // Sosyal Medya
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;

  // Analytics
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;

  // Gelişmiş
  robotsTxt: string;
  sitemapEnabled: boolean;
  customCss: string;
  customJs: string;
  maintenanceMode: boolean;

  /** API’den gelen pazarlama / hukuk alanları (admin /api/admin/site-marketing) */
  promoBannerJson?: unknown;
  trustBandItemsJson?: unknown;
  messageTemplatesJson?: unknown;
  marketingBannerVariant?: string;
  consentPolicyVersion?: string;
}

// ============================================
// DEFAULT SETTINGS
// ============================================

const defaultSettings: SiteSettings = {
  siteName: 'Günen Temizlik',
  siteDescription: "İstanbul'un en güvenilir profesyonel temizlik şirketi",
  siteUrl: 'https://gunentemizlik.com',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  accentColor: '#34d399',

  phone: SITE_CONTACT.phoneDisplay,
  email: SITE_CONTACT.email,
  address: SITE_CONTACT.addressLine,
  workingHours: '24 saat açık',
  whatsapp: SITE_CONTACT.whatsappDigits,

  seoTitle: "Günen Temizlik | İstanbul'un En İyi Temizlik Şirketi | 7/24",
  seoDescription:
    'Profesyonel temizlik hizmetleri. İnşaat sonrası, ofis, ev temizliği, koltuk yıkama. 15+ yıl deneyim, 5000+ mutlu müşteri. Ücretsiz keşif!',
  seoKeywords:
    'istanbul temizlik şirketi, profesyonel temizlik, ofis temizliği, inşaat sonrası temizlik, koltuk yıkama, halı temizliği, ev temizliği',
  ogImage: '/og-image.jpg',
  twitterHandle: '@gunentemizlik',
  canonicalUrl: 'https://gunentemizlik.com',
  language: 'tr-TR',
  region: 'TR',

  facebook: 'https://facebook.com/gunentemizlik',
  instagram: 'https://instagram.com/gunentemizlik',
  twitter: '',
  linkedin: '',
  youtube: '',

  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',

  robotsTxt:
    'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /\nSitemap: https://gunentemizlik.com/sitemap.xml',
  sitemapEnabled: true,
  customCss: '',
  customJs: '',
  maintenanceMode: false,
};

// ============================================
// VALIDATION
// ============================================

/** Setting validasyon hatası */
export interface ValidationError {
  field: keyof SiteSettings;
  message: string;
}

/**
 * Ayarları validasyonla kontrol et
 * @param settings SiteSettings objesi
 * @returns ValidationError array (boş ise valid)
 */
export function validateSettings(settings: Partial<SiteSettings>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Zorunlu alanlar
  if (!settings.siteName || settings.siteName.length < 2) {
    errors.push({ field: 'siteName', message: 'Site adı en az 2 karakter olmalı' });
  }

  if (!settings.siteUrl || !settings.siteUrl.startsWith('http')) {
    errors.push({ field: 'siteUrl', message: 'Geçerli bir site URL girin (https://...)' });
  }

  // Email validasyonu
  if (settings.email && !settings.email.includes('@')) {
    errors.push({ field: 'email', message: 'Geçerli bir e-posta adresi girin' });
  }

  // SEO başlık uzunluğu
  if (settings.seoTitle && settings.seoTitle.length > 60) {
    errors.push({ field: 'seoTitle', message: 'SEO başlığı 60 karakteri aşmamalı' });
  }

  // SEO açıklama uzunluğu
  if (settings.seoDescription && settings.seoDescription.length > 160) {
    errors.push({ field: 'seoDescription', message: 'SEO açıklaması 160 karakteri aşmamalı' });
  }

  return errors;
}

// ============================================
// CONTEXT TYPE
// ============================================

/** Context state ve actions */
export interface SiteSettingsContextType {
  /** Tüm site ayarları */
  settings: SiteSettings;
  /** Ayarları güncelle (optimistic) */
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  /** Ayarları API'ye kaydet */
  saveSettings: () => Promise<void>;
  /** Varsayılana sıfırla */
  resetSettings: () => void;
  /** Validasyon hataları */
  validationErrors: ValidationError[];
  /** Validasyon kontrolü */
  isValid: boolean;
  /** Yükleniyor mu */
  isLoading: boolean;
  /** Kaydediliyor mu */
  isSaving: boolean;
  /** Son kaydedilme zamanı */
  lastSaved: Date | null;
  /** Değişiklik var mı (kaydedilmemiş) */
  hasUnsavedChanges: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

/**
 * Site Settings Provider
 * @param children React children
 */
export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validasyon hataları
  const validationErrors = useMemo(() => validateSettings(settings), [settings]);
  const isValid = validationErrors.length === 0;

  // Kaydedilmemiş değişiklik var mı
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        console.log('Loading site settings from API...');

        // Load from API
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          const merged = { ...defaultSettings, ...data };
          setSettings(merged);
          setSavedSettings(merged);
          console.log('Settings loaded from API');
        } else {
          throw new Error('Failed to fetch settings');
        }
      } catch (error) {
        console.error('Failed to load settings from API, falling back to localStorage', {
          error: String(error),
        });

        // Fallback to localStorage
        const stored = localStorage.getItem('site-settings-v2');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const merged = { ...defaultSettings, ...parsed };
            setSettings(merged);
            setSavedSettings(merged);
          } catch {
            console.error('Failed to parse localStorage settings');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Debounced auto-save to localStorage
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('site-settings-v2', JSON.stringify(settings));
      console.debug('Settings auto-saved to localStorage');
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [settings]);

  /**
   * Ayarları güncelle (optimistic)
   */
  const updateSettings = useCallback((newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      console.log('Settings updated', { keys: Object.keys(newSettings) });
      return updated;
    });
  }, []);

  /**
   * Ayarları API'ye kaydet
   */
  const saveSettings = useCallback(async () => {
    if (!isValid) {
      console.warn('Cannot save invalid settings', { errors: validationErrors });
      throw new Error('Settings validation failed');
    }

    try {
      setIsSaving(true);
      console.log('Saving settings to server...');

      // Save to API
      const response = await fetch('/api/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Update saved state
      setSavedSettings(settings);
      setLastSaved(new Date());

      // Also save to localStorage as backup
      localStorage.setItem('site-settings-v2', JSON.stringify(settings));

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [settings, isValid, validationErrors]);

  /**
   * Varsayılana sıfırla
   */
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    console.log('Settings reset to defaults');
  }, []);

  // Context value (memoized)
  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      saveSettings,
      resetSettings,
      validationErrors,
      isValid,
      isLoading,
      isSaving,
      lastSaved,
      hasUnsavedChanges,
    }),
    [
      settings,
      updateSettings,
      saveSettings,
      resetSettings,
      validationErrors,
      isValid,
      isLoading,
      isSaving,
      lastSaved,
      hasUnsavedChanges,
    ]
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Site settings hook
 * @returns SiteSettingsContextType
 * @throws Error if used outside SiteSettingsProvider
 */
export function useSiteSettings(): SiteSettingsContextType {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

/**
 * Tekil ayar hook'u
 * @param key Ayar anahtarı
 * @returns [value, setValue] tuple
 *
 * @example
 * const [siteName, setSiteName] = useSetting('siteName');
 */
export function useSetting<K extends keyof SiteSettings>(
  key: K
): [SiteSettings[K], (value: SiteSettings[K]) => void] {
  const { settings, updateSettings } = useSiteSettings();

  const value = settings[key];
  const setValue = useCallback(
    (newValue: SiteSettings[K]) => {
      updateSettings({ [key]: newValue } as Partial<SiteSettings>);
    },
    [key, updateSettings]
  );

  return [value, setValue];
}

/**
 * SEO ayarları hook'u
 * @returns SEO settings subset
 */
export function useSeoSettings() {
  const { settings, updateSettings } = useSiteSettings();

  const seoSettings = useMemo(
    () => ({
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      seoKeywords: settings.seoKeywords,
      ogImage: settings.ogImage,
      twitterHandle: settings.twitterHandle,
      canonicalUrl: settings.canonicalUrl,
      language: settings.language,
      region: settings.region,
    }),
    [
      settings.seoTitle,
      settings.seoDescription,
      settings.seoKeywords,
      settings.ogImage,
      settings.twitterHandle,
      settings.canonicalUrl,
      settings.language,
      settings.region,
    ]
  );

  const updateSeo = useCallback(
    (newSeo: Partial<typeof seoSettings>) => {
      updateSettings(newSeo as Partial<SiteSettings>);
    },
    [updateSettings]
  );

  return { seoSettings, updateSeo };
}

/**
 * İletişim ayarları hook'u
 * @returns Contact settings subset
 */
export function useContactSettings() {
  const { settings, updateSettings } = useSiteSettings();

  const contactSettings = useMemo(
    () => ({
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      workingHours: settings.workingHours,
      whatsapp: settings.whatsapp,
    }),
    [settings.phone, settings.email, settings.address, settings.workingHours, settings.whatsapp]
  );

  const updateContact = useCallback(
    (newContact: Partial<typeof contactSettings>) => {
      updateSettings(newContact as Partial<SiteSettings>);
    },
    [updateSettings]
  );

  return { contactSettings, updateContact };
}

/**
 * Social media ayarları hook'u
 */
export function useSocialSettings() {
  const { settings, updateSettings } = useSiteSettings();

  const socialSettings = useMemo(
    () => ({
      facebook: settings.facebook,
      instagram: settings.instagram,
      twitter: settings.twitter,
      linkedin: settings.linkedin,
      youtube: settings.youtube,
    }),
    [
      settings.facebook,
      settings.instagram,
      settings.twitter,
      settings.linkedin,
      settings.youtube,
    ]
  );

  const updateSocial = useCallback(
    (newSocial: Partial<typeof socialSettings>) => {
      updateSettings(newSocial as Partial<SiteSettings>);
    },
    [updateSettings]
  );

  return { socialSettings, updateSocial };
}

export default SiteSettingsContext;
