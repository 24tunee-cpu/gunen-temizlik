# Programmatic SEO Automation

Bu proje, ilçe+hizmet landing sayfaları için metadata optimizasyonunu Search Console query export verisine göre otomatik güncelleyebilir.

## 1) GSC Export Hazırlığı

- Search Console'dan query export alın.
- CSV en az şu kolonları içermeli:
  - `query`
  - `page`
- İsteğe bağlı ama önerilen:
  - `clicks`
  - `impressions`
  - `ctr`
  - `position`

Örnek şablon: `data/gsc-query-export.example.csv`

## 2) Çalıştırma

```bash
npm run seo:gsc:generate-meta -- data/gsc-query-export.csv
```

İsteğe bağlı custom output:

```bash
npm run seo:gsc:generate-meta -- data/gsc-query-export.csv src/config/programmatic-meta-overrides.json
```

## 3) Üretilen Dosyalar

- `src/config/programmatic-meta-overrides.json`
  - Runtime'da `generateMetadata` tarafından okunur.
- `data/gsc-meta-suggestions-report.json`
  - Tüm öneri detay raporu.

## 4) Akış

1. GSC export'u al
2. Script'i çalıştır
3. Değişen overrides dosyasını gözden geçir
4. Commit + deploy
5. `SEARCH_CONSOLE_CHECKLIST.md` ile haftalık takip

## 5) Admin Panelden Operasyon (Önerilen)

- `Admin -> SEO otomasyon` sayfasından CSV dosyasını direkt yükleyin.
- Test için paneldeki `Örnek CSV Doldur` butonunu kullanabilirsiniz.
- "Önizleme üret" ile önerileri kontrol edin, "Önerileri uygula" ile DB override'a yazın.
- "Otomatik SEO önerileri" bölümündeki yüksek öncelikli aksiyonları sırayla işleyin.
- "Search Console Checklist Durumu" bölümünden haftalık/aylık adımları tamamlandıkça işaretleyin.
- "Manuel Override Editörü" ile kritik landing sayfalarında özel title/meta yayınlayın.
- "Örnek Override Referansları" bloğunu ekip içinde standardizasyon referansı olarak kullanın.
