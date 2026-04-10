# Production Environment Variables

## Vercel Environment Variables (Dashboard'da eklenecek)

```bash
# NextAuth.js
NEXTAUTH_URL=https://gunentemizlik.com
NEXTAUTH_SECRET=95839c0b0ed8b47b26faa39ce929bef84a45b6d9c4fb9a8d923c534a4a8bcf79

# Database (MongoDB Atlas - Production)
DATABASE_URL=mongodb+srv://kronigaz_db_user:PYa2o2LUy2kWpX2C@cluster0.bhabjmw.mongodb.net/gunentemizlik?retryWrites=true&w=majority&appName=Cluster0

# Email (Opsiyonel - Contact form için)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

## Hostinger DNS Ayarları (Domain Yönlendirme)

### CNAME Kaydı:
```
Host: www
Points to: cname.vercel-dns.com
TTL: 300
```

### A Kaydı (Root Domain):
```
Host: @
Points to: 76.76.21.21
TTL: 300
```

## WordPress Temizlik Adımları:

1. Hostinger File Manager'a git
2. public_html klasörüne gir
3. Tüm WordPress dosyalarını sil (veya wp-backup klasörüne taşı)
4. public_html boş kalsın (Vercel yönlendirmesi için)

## Admin Giriş Bilgileri:
- URL: https://gunentemizlik.com/admin
- Email: admin@gunentemizlik.com
- Password: admin123

## Önemli Kontroller:
- [ ] MongoDB Atlas IP Whitelist: 0.0.0.0/0 ekle
- [ ] NextAuth Secret güçlü ve unique olsun
- [ ] Domain DNS yönlendirmesi aktif
- [ ] SSL sertifikası otomatik (Vercel Let's Encrypt)
