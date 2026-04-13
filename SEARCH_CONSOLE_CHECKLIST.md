# Search Console İzleme Checklist (Programmatic SEO)

Bu checklist, `/bolgeler/*` ve `/bolgeler/*/*` programatik landing altyapısının sağlıklı index alması ve dönüşüm üretmesi için hazırlanmıştır.

## 1) Yayın Sonrası İlk 24 Saat

- [ ] `https://www.gunentemizlik.com/sitemap.xml` içinde `bolgeler` URL'leri görünüyor.
- [ ] Search Console -> URL Inspection ile örnek 5 URL test edildi.
- [ ] "Page is indexed" durumu en azından keşfedildi/işlendi olarak dönüyor.
- [ ] Rich Results Test ile `Service`, `FAQPage`, `BreadcrumbList` hatasız.
- [ ] Manual Action / Security Issues sekmeleri temiz.

## 2) İlk Hafta Takibi

- [ ] Coverage raporunda `/bolgeler/` URL'lerinde "Crawled - currently not indexed" artışı izleniyor.
- [ ] Gerekiyorsa düşük performanslı URL'lerde içerik yoğunluğu artırılıyor.
- [ ] Search results -> Pages filtresinde `/bolgeler/` path segmenti için impressions artıyor.
- [ ] Queries filtresinde ilçe + hizmet kombinasyonları görünmeye başlıyor.
- [ ] Structured data raporunda yeni hata oluşmadı.

## 3) Haftalık Operasyon Rutini

- [ ] En çok gösterim alan 10 landing URL export edildi.
- [ ] CTR düşük olan URL'lerde title/description varyasyonu güncellendi.
- [ ] Ortalama pozisyonu düşük URL'lerde iç link güçlendirme yapıldı.
- [ ] İlgili blog yazılarından landing URL'lere yeni bağlantılar eklendi.
- [ ] Dönüşüm event'lerinde (CTA variant A/B) performans kıyaslandı.

## 4) A/B CTA İzleme (ProgrammaticCtaExperiment)

- [ ] `programmatic_cta_impression` event'i analytics tarafında görünüyor.
- [ ] WhatsApp / form tıklamaları varyant bazında ayrıştırılıyor.
- [ ] 2 haftalık veri birikince kazanamayan varyant kaldırılıp yeni test açılıyor.
- [ ] Kazanan varyant segment bazlı (ilçe/hizmet) uygulanıyor.

## 5) Aylık Sağlık Kontrolü

- [ ] Sitemap yeniden üretiminde tüm landing URL'ler listede.
- [ ] Indexlenmeyen URL oranı %20 üzerine çıkarsa içerik unique oranı artırılıyor.
- [ ] Aynı intent'e giden sayfalar için cannibalization analizi yapılıyor.
- [ ] GSC Query -> Landing eşleşmelerine göre yeni ilçe/hizmet kombinasyonları planlanıyor.

## 6) Hızlı Aksiyon Kuralları

- **0 impression / 30 gün:** içerik genişlet + iç link + yeniden gönder.
- **Impression var, CTR < %1:** title ve meta açıklama optimize et.
- **CTR iyi, position kötü:** ek referans içerik ve backlink çalışması başlat.
- **Position iyi, lead düşük:** CTA kopyası ve form sürtünmesi optimize et.

