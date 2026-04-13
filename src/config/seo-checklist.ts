export type SeoChecklistSeed = {
  key: string;
  section: string;
  label: string;
  sortOrder: number;
};

export const SEO_CHECKLIST_SEED: SeoChecklistSeed[] = [
  {
    key: 'post24h-sitemap-bolgeler',
    section: 'Yayın Sonrası İlk 24 Saat',
    label: 'Sitemap içinde /bolgeler URLleri görünüyor.',
    sortOrder: 10,
  },
  {
    key: 'post24h-inspect-5-urls',
    section: 'Yayın Sonrası İlk 24 Saat',
    label: 'Search Console URL Inspection ile 5 örnek URL test edildi.',
    sortOrder: 20,
  },
  {
    key: 'post24h-rich-results-clean',
    section: 'Yayın Sonrası İlk 24 Saat',
    label: 'Service, FAQPage ve BreadcrumbList structured data hatasız.',
    sortOrder: 30,
  },
  {
    key: 'weekly-top10-export',
    section: 'Haftalık Operasyon Rutini',
    label: 'En çok gösterim alan 10 landing URL export edildi.',
    sortOrder: 40,
  },
  {
    key: 'weekly-low-ctr-meta-update',
    section: 'Haftalık Operasyon Rutini',
    label: 'CTR düşük URLlerde title/description varyasyonu güncellendi.',
    sortOrder: 50,
  },
  {
    key: 'weekly-internal-link-boost',
    section: 'Haftalık Operasyon Rutini',
    label: 'Pozisyonu düşük URLler için iç link güçlendirmesi yapıldı.',
    sortOrder: 60,
  },
  {
    key: 'weekly-cta-ab-review',
    section: 'Haftalık Operasyon Rutini',
    label: 'CTA variant A/B performansı kontrol edildi.',
    sortOrder: 70,
  },
  {
    key: 'monthly-cannibalization-review',
    section: 'Aylık Sağlık Kontrolü',
    label: 'Cannibalization analizi yapıldı ve çakışan intentler ayrıştırıldı.',
    sortOrder: 80,
  },
  {
    key: 'monthly-new-combination-plan',
    section: 'Aylık Sağlık Kontrolü',
    label: 'GSC query verisine göre yeni ilçe+hizmet kombinasyonları planlandı.',
    sortOrder: 90,
  },
];

