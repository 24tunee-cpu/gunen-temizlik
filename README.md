# Günen Temizlik - Profesyonel Temizlik Hizmetleri Web Sitesi

Next.js 14, Prisma, MongoDB ve Tailwind CSS ile geliştirilmiş kurumsal web sitesi.

## Kurulum Rehberi

### 1. Gereksinimler

- Node.js 18+ 
- MongoDB Atlas hesabı (ücretsiz: https://www.mongodb.com/cloud/atlas)
- Git

### 2. Projeyi İndirin

```bash
git clone <repo-url>
cd gunen-temizlik
npm install
3. Çevresel Değişkenleri Ayarlayın
Proje kök dizininde .env dosyası oluşturun:

Kod snippet'i
# MongoDB Bağlantısı
DATABASE_URL="mongodb+srv://<kullanici>:<sifre>@cluster0.xxxxx.mongodb.net/gunen-temizlik?retryWrites=true&w=majority"

# NextAuth.js Ayarları
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="rastgele-gizli-anahtar-32-karakter"

# Admin Giriş Bilgileri (ilk kurulum için)
ADMIN_EMAIL="admin@gunentemizlik.com"
ADMIN_PASSWORD="guclu-sifre-123"
MongoDB Atlas Bağlantısı Nasıl Alınır:

https://cloud.mongodb.com adresine gidin

Ücretsiz hesap oluşturun

"Build a Cluster" > M0 FREE seçin

Cluster oluşturulduktan sonra "Connect" > "Connect your application"

Bağlantı stringini kopyalayıp DATABASE_URL'e yapıştırın

NEXTAUTH_SECRET Nasıl Oluşturulur:

Bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
4. Veritabanını Hazırlayın
Bash
# Prisma client oluşturun
npx prisma generate

# Veritabanı şemasını uygulayın
npx prisma db push

# (Opsiyonel) Örnek veriler ekleyin
npx prisma db seed
5. Geliştirme Sunucusunu Başlatın
Bash
npm run dev
Tarayıcıda http://localhost:3000 adresini açın.

6. Admin Paneline Giriş
http://localhost:3000/login adresine gidin

.env dosyasında belirlediğiniz ADMIN_EMAIL ve ADMIN_PASSWORD ile giriş yapın

Production Deployment (Hosting)
Seçenek 1: Vercel (Önerilen)
Bash
npm i -g vercel
vercel
Seçenek 2: Diğer Hostingler (Hostinger, vb.)
Build alın:

Bash
npm run build
Dosyaları yükleyin:

.next/ klasörü

public/ klasörü

package.json

.env (sunucuda ayarlayın)

Sunucuda çalıştırın:

Bash
npm install --production
npm start
Seçenek 3: Docker
Bash
docker build -t gunen-temizlik .
docker run -p 3000:3000 --env-file .env gunen-temizlik
Proje Yapısı
Plaintext
src/
├── app/
│   ├── api/            # API rotaları
│   ├── admin/          # Admin paneli sayfaları
│   ├── (auth)/         # Kimlik doğrulama sayfaları
│   └── page.tsx        # Ana sayfa
├── components/         # React bileşenleri
└── lib/                # Yardımcı kütüphaneler
prisma/
├── schema.prisma       # Veritabanı şeması
└── seed.ts             # Örnek veriler
Özellikler
✅ Responsive tasarım (Tailwind CSS)

✅ Admin paneli (hizmetler, blog, referanslar, galeri, SSS)

✅ SEO optimizasyonu

✅ İletişim formu

✅ E-bülten aboneliği

✅ WhatsApp entegrasyonu

✅ Görüntü galerisi

✅ Fiyat listesi

✅ Ekip sayfası

Teknolojiler
Frontend: Next.js 14, React, Tailwind CSS, Lucide Icons

Backend: Next.js API Routes, Prisma ORM

Veritabanı: MongoDB Atlas

Kimlik Doğrulama: NextAuth.js

Deployment: Vercel / Node.js

Lisans
MIT
