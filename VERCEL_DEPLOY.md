# Vercel Deploy Rehberi - Günen Temizlik

## 🚀 Hızlı Başlangıç

### Adım 1: GitHub'a Yükle
```bash
# Terminalde çalıştır:
git init
git add .
git commit -m "Initial commit"
git branch -M main

# GitHub reposu oluştur (örn: gunen-temizlik)
git remote add origin https://github.com/KULLANICI_ADI/gunen-temizlik.git
git push -u origin main
```

### Adım 2: Vercel'e Bağla
1. https://vercel.com adresine git
2. GitHub ile login ol
3. "Add New Project" → GitHub reposunu seç
4. Framework Preset: **Next.js** (otomatik seçilecek)
5. "Deploy" butonuna tıkla

### Adım 3: Environment Variables Ekle
Vercel Dashboard → Project Settings → Environment Variables:

```
NEXTAUTH_URL=https://gunentemizlik.com
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=mongodb+srv://kronigaz_db_user:PYa2o2LUy2kWpX2C@cluster0.bhabjmw.mongodb.net/gunentemizlik?retryWrites=true&w=majority&appName=Cluster0
```

### Adım 4: Domain Bağla
Vercel Dashboard → Domains → Add Domain:
- `gunentemizlik.com` ekle
- Vercel DNS nameserver'larını verecek

## 🌐 Hostinger DNS Ayarları

Hostinger Panel → DNS Zone Editor:

**CNAME Kayıtları:**
```
Host: www
Points to: cname.vercel-dns.com
TTL: 300
```

**A Kayıtları (Root domain için):**
```
Host: @
Points to: 76.76.21.21 (Vercel IP)
TTL: 300
```

## ✅ WordPress Temizliği

Hostinger File Manager → public_html:
1. Tüm dosyaları seç (Ctrl+A)
2. Sil (veya yedekle başka klasöre)
3. Vercel yönlendirmesi aktif olduğunda site otomatik çalışacak

## 🔒 SSL Sertifikası
Vercel otomatik SSL verir (Let's Encrypt), ek işlem gerekmez.

## 📱 Admin Paneli Erişimi
Canlıya geçtikten sonra:
- https://gunentemizlik.com/admin
- Login: admin@gunentemizlik.com / admin123

---

## ⚠️ Önemli Notlar

1. **MongoDB Atlas IP Whitelist:**
   - Vercel için `0.0.0.0/0` (tüm IP'ler) ekle
   
2. **NextAuth Secret:**
   - Üretim için güçlü bir secret oluştur:
   ```bash
   openssl rand -base64 32
   ```

3. **Image Optimization:**
   - Vercel'de otomatik çalışır, ek ayar gerekmez

## 🆘 Destek
Sorun çıkarsa Vercel Dashboard → Activity log kontrol et.
