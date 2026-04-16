export type PrioritySeoLink = {
  href: string;
  label: string;
};

/**
 * Hızlı index ve iç link gücü için ticari niyeti yüksek blog URL'leri.
 * Slug'lar veritabanına eklenen 80 blog setiyle uyumludur.
 */
export const PRIORITY_BLOG_LINKS: PrioritySeoLink[] = [
  {
    href: '/blog/istanbul-temizlik-sirketleri-rehberi-dogru-firma-secimi-icin-12-kriter',
    label: 'Istanbul Temizlik Sirketleri Rehberi',
  },
  {
    href: '/blog/istanbul-ev-temizligi-fiyatlarini-etkileyen-10-faktor-ve-dogru-butceleme',
    label: 'Istanbul Ev Temizligi Fiyat Rehberi',
  },
  {
    href: '/blog/istanbul-ofis-temizligi-verimliligi-artiran-kurumsal-temizlik-plani',
    label: 'Istanbul Ofis Temizligi Plani',
  },
  {
    href: '/blog/istanbul-insaat-sonrasi-temizlik-teslim-oncesi-profesyonel-kontrol-rehberi',
    label: 'Insaat Sonrasi Temizlik Kontrol Rehberi',
  },
  {
    href: '/blog/guvenilir-temizlik-sirketi-istanbul-icin-referans-ve-sozlesme-kontrolu',
    label: 'Guvenilir Temizlik Sirketi Secimi',
  },
  {
    href: '/blog/temizlik-sirketi-fiyatlari-istanbul-paket-sure-ve-kapsam-karsilastirmasi',
    label: 'Temizlik Sirketi Fiyatlari Istanbul',
  },
  {
    href: '/blog/bos-ev-temizligi-istanbul-kiralama-ve-satis-oncesi-hazirlik-listesi',
    label: 'Bos Ev Temizligi Istanbul',
  },
  {
    href: '/blog/tasinma-sonrasi-temizlik-istanbul-eve-yerlesmeden-once-yapilacaklar',
    label: 'Tasinma Sonrasi Temizlik Istanbul',
  },
  {
    href: '/blog/dis-cephe-cam-temizligi-istanbul-guvenlik-ve-ekipman-standartlari',
    label: 'Dis Cephe Cam Temizligi Istanbul',
  },
  {
    href: '/blog/koltuk-yikama-istanbul-kumas-turune-gore-dogru-yikama-yontemi',
    label: 'Koltuk Yikama Istanbul',
  },
];

/**
 * Sitenin ticari dönüşüm odaklı ana URL kümeleri.
 */
export const PRIORITY_CONVERSION_LINKS: PrioritySeoLink[] = [
  { href: '/randevu', label: 'Randevu Olustur' },
  { href: '/hizmetler', label: 'Tum Hizmetler' },
  { href: '/hizmetler/ofis-temizligi', label: 'Ofis Temizligi' },
  { href: '/hizmetler/insaat-sonrasi-temizlik', label: 'Insaat Sonrasi Temizlik' },
  { href: '/hizmetler/koltuk-yikama', label: 'Koltuk Yikama' },
  { href: '/bolgeler', label: 'Istanbul Hizmet Bolgeleri' },
  { href: '/iletisim', label: 'Iletisim ve Ucretsiz Kesif' },
];
