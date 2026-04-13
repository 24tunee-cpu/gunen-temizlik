# Admin — Haritalar modülü (Google / Yandex / Apple)

Kod `main` dalında; canlıda çalışması için **Vercel Environment Variables** ve **MongoDB şeması** gerekir.

## Vercel ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `NEXTAUTH_URL` | Evet | Canlı site kökü, örn. `https://www.gunentemizlik.com` (OAuth redirect ile aynı host) |
| `NEXTAUTH_SECRET` | Evet | Mevcut NextAuth secret |
| `DATABASE_URL` | Evet | MongoDB bağlantısı |
| `MAPS_GOOGLE_CLIENT_ID` | Haritalar Google OAuth için | Google Cloud → OAuth istemci kimliği |
| `MAPS_GOOGLE_CLIENT_SECRET` | Haritalar Google OAuth için | OAuth müşteri sırrı |
| `MAPS_OAUTH_SECRET` | Önerilir | Refresh token şifreleme; yoksa `NEXTAUTH_SECRET` kullanılır |
| `CRON_SECRET` | Cron kullanılacaksa | `/api/cron/maps-sync` için `Authorization: Bearer …` |
| `GOOGLE_CLOUD_API_KEY` | Hayır | Console API key; şu anki kod OAuth’da kullanmaz (isteğe bağlı) |

## Google Cloud Console

1. **Yetkili JavaScript kökenleri:** sadece kök, path yok — örn. `https://www.gunentemizlik.com`
2. **Yetkili yönlendirme URI’leri (tam path):**  
   `{NEXTAUTH_URL}/api/admin/maps/google/oauth/callback`  
   Örnek: `https://www.gunentemizlik.com/api/admin/maps/google/oauth/callback`
3. OAuth izin ekranı + gerekirse test kullanıcıları; kapsam: `business.manage`
4. İlgili API’lerin (Business Profile / My Business Account Management / Business Information vb.) etkin olduğundan emin ol

## Üretim veritabanı

Yeni koleksiyonlar için deploy sonrası bir kez (CI veya manuel):

```bash
npx prisma db push
```

(Hedef `DATABASE_URL` üretim cluster’ı olmalı.)

## Özellik özeti

1. **Google OAuth:** `GET /api/admin/maps/google/oauth/start` → callback → `MapOAuthConnection` (şifreli refresh token)
2. **Senkron:** `POST /api/admin/maps/google/sync` — hesaplar, konumlar, yorum önbelleği  
   Zamanlama: `vercel.json` içinde cron → `GET /api/cron/maps-sync` (Bearer `CRON_SECRET` veya Vercel cron başlığı)
3. **Yorum yanıtı:** taslak → onay → `POST /api/admin/maps/review-reply` (yalnızca `approved` taslaklar)
4. **Yandex / Apple:** şimdilik placeholder API + aynı sayfada manuel form/checklist

## Vercel yeni deploy görmüyorsa

- GitHub’da `main` son commit’i kontrol et; Vercel projesi bu repoya/branch’e bağlı mı bak
- Vercel **Deployments** → son build **Failed** ise logları aç (çoğunlukla eksik env veya Prisma)
- Gerekirse **Redeploy** (Clear cache ile) tetikle

Admin arayüzü: **`/admin/haritalar`**
