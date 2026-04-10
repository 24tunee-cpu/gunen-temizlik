# Günen Temizlik - Profesyonel Temizlik Hizmetleri Web Sitesi

Next.js 14, Prisma, MongoDB ve Tailwind CSS ile geli?tirilmi? kurumsal web sitesi.

## Kurulum Rehberi

### 1. Gereksinimler

- Node.js 18+ 
- MongoDB Atlas hesab? (ücretsiz: https://www.mongodb.com/cloud/atlas)
- Git

### 2. Projeyi ndirin

```bash
git clone <repo-url>
cd gunen-temizlik
npm install
```

### 3. Çevresel De?i?kenleri Ayarlay?n

Proje kök dizininde `.env` dosyas? olu?turun:

```env
# MongoDB Ba?lant?s?
DATABASE_URL="mongodb+srv://<kullanici>:<sifre>@cluster0.xxxxx.mongodb.net/gunen-temizlik?retryWrites=true&w=majority"

# NextAuth.js Ayarlar?
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rastgele-gizli-anahtar-32-karakter"

# Admin Giri? Bilgileri (ilk kurulum için)
ADMIN_EMAIL="admin@gunentemizlik.com"
ADMIN_PASSWORD="guclu-sifre-123"
```

**MongoDB Atlas Ba?lant?s? Nas?l Al?n?r:**
1. https://cloud.mongodb.com adresine gidin
2. Ücretsiz hesap olu?turun
3. "Build a Cluster" > M0 FREE seçin
4. Cluster olu?turulduktan sonra "Connect" > "Connect your application"
5. Ba?lant? stringini kopyalay?p DATABASE_URL'e yap??t?r?n

**NEXTAUTH_SECRET Nas?l Olu?turulur:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. Veritaban?n? Haz?rlay?n

```bash
# Prisma client olu?turun
npx prisma generate

# Veritaban? ?emas?n? uygulay?n
npx prisma db push

# (Opsiyonel) Örnek veriler ekleyin
npx prisma db seed
```

### 5. Geli?tirme Sunucusunu Ba?lat?n

```bash
npm run dev
```

Taray?c?da http://localhost:3000 adresini aç?n.

### 6. Admin Paneline Giri?

- http://localhost:3000/login adresine gidin
- `.env` dosyas?nda belirledi?iniz ADMIN_EMAIL ve ADMIN_PASSWORD ile giri? yap?n

---

## Production Deployment (Hosting)

### Seçenek 1: Vercel (Önerilen)

```bash
npm i -g vercel
vercel
```

### Seçenek 2: Di?er Hostingler (Hostinger, vb.)

1. **Build al?n:**
```bash
npm run build
```

2. **Dosyalar? yükleyin:**
- `.next/` klasörü
- `public/` klasörü
- `package.json`
- `.env` (sunucuda ayarlay?n)

3. **Sunucuda çal??t?r?n:**
```bash
npm install --production
npm start
```

### Seçenek 3: Docker

```bash
docker build -t gunen-temizlik .
docker run -p 3000:3000 --env-file .env gunen-temizlik
```

---

## Proje Yap?s?

```
src/
?? app/
?   ?? api/           # API rotalar?
?   ?? admin/         # Admin paneli sayfalar?
?   ?? (auth)/        # Kimlik do?rulama sayfalar?
?   ?? page.tsx       # Ana sayfa
?? components/       # React bile?enleri
?? lib/              # Yard?mc? kütüphaneler
prisma/
?? schema.prisma     # Veritaban? ?emas?
?? seed.ts           # Örnek veriler
```

---

## Özellikler

- ? Responsive tasar?m (Tailwind CSS)
- ? Admin paneli (hizmetler, blog, referanslar, galeri, SSS)
- ? SEO optimizasyonu
- ? ?leti?im formu
- ? E-bülten aboneli?i
- ? WhatsApp entegrasyonu
- ? Görüntü galerisi
- ? Fiyat listesi
- ? Ekip sayfas?

---

## Teknolojiler

- **Frontend:** Next.js 14, React, Tailwind CSS, Lucide Icons
- **Backend:** Next.js API Routes, Prisma ORM
- **Veritaban?:** MongoDB Atlas
- **Kimlik Do?rulama:** NextAuth.js
- **Deployment:** Vercel / Node.js

---

## Lisans

MIT
