/**
 * Kanonik iletişim bilgileri — site ayarları yüklenene kadar ve SEO / structured data için.
 * WhatsApp: wa.me/{whatsappDigits}
 */
export const SITE_CONTACT = {
  companyName: 'Günen Temizlik',
  addressLine:
    'Gültepe Mahallesi, Talatpaşa Caddesi, Bıldırcın Sokağı No:13 kat -1, 34000 Kağıthane/İstanbul',
  addressLocality: 'Kağıthane',
  addressRegion: 'İstanbul',
  postalCode: '34000',
  addressCountry: 'TR',

  phoneDisplay: '0546 715 28 44',
  /** tel: ve schema.org Telephone */
  phoneE164: '+905467152844',
  /** wa.me yolu (ülke kodu + numara, başında + yok) */
  whatsappDigits: '905467152844',
  email: 'iletisim@gunentemizlik.com',
} as const;

/** tel: bağlantısı — yalnızca rakam ve + */
export function toTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : 'tel:';
}
