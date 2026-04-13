/**
 * Haritalar modülü — saf veri (Prisma yok; client’ta güvenle import edilebilir).
 */

export const MAP_PLATFORMS = ['google', 'yandex', 'apple'] as const;
export type MapPlatformId = (typeof MAP_PLATFORMS)[number];

export const CONNECTION_STATUSES = ['not_connected', 'in_progress', 'connected'] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export type MapChecklistItem = {
  id: string;
  label: string;
  hint?: string;
};

export const MAP_PLATFORM_META: Record<
  MapPlatformId,
  {
    label: string;
    shortLabel: string;
    description: string;
    accent: string;
    docUrl: string;
    panelUrl: string;
  }
> = {
  google: {
    label: 'Google Haritalar & İşletme Profili',
    shortLabel: 'Google',
    description:
      'Google Business Profile (GBP) işletmenizin Arama ve Haritalar’daki vitrinidir. Profil tamamlandıkça yerel görünürlük sinyalleri güçlenir.',
    accent: 'from-blue-600/90 to-blue-500/80',
    docUrl: 'https://support.google.com/business/',
    panelUrl: 'https://business.google.com/',
  },
  yandex: {
    label: 'Yandex Haritalar',
    shortLabel: 'Yandex',
    description:
      'Yandex işletme kartı; özellikle Yandex ekosistemini kullanan kullanıcılar için görünürlük sağlar. Hesap ve doğrulama süreçleri Google’dan farklıdır.',
    accent: 'from-red-600/85 to-amber-500/75',
    docUrl: 'https://yandex.com/support/sprav/',
    panelUrl: 'https://yandex.com/sprav/',
  },
  apple: {
    label: 'Apple Haritalar',
    shortLabel: 'Apple',
    description:
      'Apple Business Connect ile işletmeniz Apple Haritalar ve cihazlarda yer alır. Kurulum ve onay Apple tarafından yönetilir.',
    accent: 'from-slate-700 to-slate-600',
    docUrl: 'https://businessconnect.apple.com/news/',
    panelUrl: 'https://businessconnect.apple.com/',
  },
};

export const MAP_CHECKLISTS: Record<MapPlatformId, MapChecklistItem[]> = {
  google: [
    { id: 'verified', label: 'İşletme doğrulandı', hint: 'Posta veya video ile doğrulama tamam.' },
    { id: 'primary_category', label: 'Birincil kategori doğru', hint: 'Ana hizmetinize en yakın tek kategori.' },
    { id: 'hours', label: 'Çalışma saatleri güncel', hint: 'Tatiller ve özel günler dahil.' },
    { id: 'description', label: 'İşletme açıklaması dolu', hint: 'Doğal dil; anahtar kelime doldurma yok.' },
    { id: 'photos', label: 'Yeterli orijinal fotoğraf', hint: 'Kapak, iç mekan, ekip, iş örnekleri.' },
    { id: 'nap', label: 'NAP site ile tutarlı', hint: 'İsim, adres, telefon sitede aynı.' },
    { id: 'reviews', label: 'Yorumlara düzenli yanıt', hint: 'Özellikle düşük puanlılar.' },
    { id: 'website', label: 'Web sitesi bağlantısı doğru', hint: 'Tercihen HTTPS ana sayfa veya yerel landing.' },
  ],
  yandex: [
    { id: 'org_created', label: 'Yandex’te organizasyon oluşturuldu' },
    { id: 'verified_ya', label: 'Doğrulama / moderasyon tamam' },
    { id: 'hours_ya', label: 'Çalışma saatleri ve adres güncel' },
    { id: 'photos_ya', label: 'Logo ve fotoğraflar yüklendi' },
    { id: 'categories_ya', label: 'Kategori ve hizmet alanları doğru' },
    { id: 'site_ya', label: 'Web sitesi ve telefon tutarlı' },
  ],
  apple: [
    { id: 'abc_account', label: 'Apple Business Connect hesabı' },
    { id: 'place_claim', label: 'Yer kartı talep / onay süreci' },
    { id: 'hours_ap', label: 'Saatler ve iletişim bilgileri' },
    { id: 'brand_ap', label: 'Logo ve görseller' },
    { id: 'nap_ap', label: 'Diğer platformlarla NAP uyumu' },
  ],
};

export function isMapPlatformId(v: string): v is MapPlatformId {
  return (MAP_PLATFORMS as readonly string[]).includes(v);
}

export function isConnectionStatus(v: string): v is ConnectionStatus {
  return (CONNECTION_STATUSES as readonly string[]).includes(v);
}

export function parseChecklistState(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof val === 'boolean') out[k] = val;
  }
  return out;
}
