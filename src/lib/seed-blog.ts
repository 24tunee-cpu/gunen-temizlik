/**
 * Kanonik blog yazıları — slug ile upsert.
 * 20: İstanbul / günlük arama (trafik + yerel bağlantı), 30: temizlik odaklı SEO içerik.
 * İçerik HTML (dangerouslySetInnerHTML ile uyumlu).
 */
import type { PrismaClient } from '@prisma/client';

const IMG_HOME = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200';
const IMG_OFFICE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200';
const IMG_SOFA = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200';
const IMG_CARPET = 'https://images.unsplash.com/photo-1558317374-a354d5f6d40b?w=1200';
const IMG_WINDOW = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200';
const IMG_TECH = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200';
const IMG_ISTANBUL = 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200';
const IMG_TRAFFIC = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200';
const IMG_PHONE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200';

export type BlogSeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string | null;
  category: string;
  tags: string[];
  metaTitle?: string;
  metaDesc?: string;
};

/** 20 — temizlik dışı, yüksek arama hacimli konular + İstanbul/yerel bağlantı (kurumsal blog trafiği mantığı) */
const TRAFFIC_POSTS: BlogSeedPost[] = [
  {
    slug: 'usb-bilgisayarda-taninmiyor-windows-cozum',
    title: 'USB Bellek Bilgisayarda Tanınmıyor: Windows 10 ve 11 İçin Çözüm Adımları',
    excerpt:
      'USB sürücü takıldığında görünmüyorsa Aygıt Yöneticisi, harf atama ve sürücü kontrollerini adım adım deneyin. Ev ve ofiste sık karşılaşılan sorun.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['usb çalışmıyor', 'windows', 'bilgisayar yardım', 'ofis ipuçları'],
    image: IMG_TECH,
    metaTitle: 'USB Tanınmıyor Windows Çözümü | Adım Adım Rehber',
    metaDesc:
      'USB bellek bilgisayarda görünmüyor mu? Windows 10/11 için pratik çözüm adımları ve ofis ortamında hızlı kontrol listesi.',
    content: `<p>USB bellek veya harici disk takıldığında <strong>Windows</strong> dosya gezgininde görünmüyorsa panik yapmayın. Önce başka bir USB girişine takın; mümkünse kablosuz uzatma hub kullanmayın.</p>
<h2>Aygıt Yöneticisi kontrolü</h2><p><strong>Aygıt Yöneticisi</strong>nde “Evrensel Seri Veri Yolu denetleyicileri” altında sarı ünlem varsa sürücüyü güncelleyin veya kaldırıp yeniden taratın.</p>
<h2>Disk Yönetimi ve sürücü harfi</h2><p>Bazen disk “Çevrimdışı” veya harf atanmamış olur. <strong>diskmgmt.msc</strong> ile birim durumunu kontrol edin; gerekirse sürücü harfi atayın.</p>
<p>İstanbul’daki ev ve küçük ofislerde bu tür sorunlar sık görülür; kritik veriler için bulut yedek almayı unutmayın.</p>`,
  },
  {
    slug: 'telefon-hizli-isiniyor-ne-yapmaliyim',
    title: 'Telefon Çok Isınıyor: Yaz Aylarında Dikkat Edilmesi Gerekenler',
    excerpt:
      'Akıllı telefon ısınması pil ömrünü ve performansı etkiler. Kılıf, ekran parlaklığı ve arka plan uygulamaları için pratik öneriler.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['telefon ısınması', 'pil ömrü', 'android', 'iphone'],
    image: IMG_PHONE,
    content: `<p>Yaz aylarında özellikle <strong>İstanbul</strong> sıcağında telefonunuzun ısınması normalin üzerindeyse önce parlaklığı düşürün ve güneşte doğrudan bırakmayın.</p>
<h2>Arka plandaki uygulamalar</h2><p>Konum, kamera ve oyunlar CPU’yu yükler. Son uygulamaları kapatın; gereksiz bildirim izinlerini kısın.</p>
<h2>Kılıf ve şarj</h2><p>Kalın silikon kılıflar ısıyı hapseder. Şarj olurken yoğun oyun oynamayın; orijinal veya sertifikalı adaptör kullanın.</p>`,
  },
  {
    slug: 'wifi-baglaniyor-internet-yok-cozum',
    title: 'Wi‑Fi Bağlanıyor Ama İnternet Yok: Modem ve DNS Kontrolleri',
    excerpt:
      'Kablosuz ağa bağlısınız ancak sayfa açılmıyorsa DNS, modem yeniden başlatma ve operatör arızası adımlarını deneyin.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['wifi sorunu', 'internet yok', 'modem', 'dns'],
    image: IMG_TECH,
    content: `<p><strong>Wi‑Fi</strong> simgesi dolu görünüyor fakat tarayıcı açılmıyorsa sorun genelde DNS, modem oturumu veya operatör kaynaklıdır.</p>
<h2>Hızlı test</h2><p>Başka bir cihazda aynı ağı deneyin. Sadece bir cihaz etkileniyorsa uçak modunu açıp kapatın veya DNS’i 8.8.8.8 / 1.1.1.1 yapın.</p>
<h2>Modem yeniden başlatma</h2><p>Modemi 30 saniye elektriksiz bırakıp açın. İstanbul’da fiber altyapıda arıza bildirimi için operatör uygulamalarını kullanabilirsiniz.</p>`,
  },
  {
    slug: 'windows-mavi-ekran-bsod-ne-anlama-gelir',
    title: 'Windows Mavi Ekran (BSOD): Yaygın Hata Kodları ve İlk Müdahale',
    excerpt:
      'Mavi ekran genelde sürücü veya donanım uyumsuzluğudur. Stop kodunu not edip güvenli mod ve güncelleme adımlarıyla ilerleyin.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['mavi ekran', 'windows hata', 'bsod', 'bilgisayar'],
    image: IMG_TECH,
    content: `<p><strong>BSOD</strong> ekranda “Stop code” yazar; bu kodu fotoğraflayın. Son yüklenen sürücü veya Windows güncellemesi sonrası başladıysa geri alın.</p>
<h2>Güvenli mod</h2><p>Açılışta birkaç kez yeniden başlatarak kurtarma ortamına girin; güvenli modda sorun çıkmıyorsa üçüncü parti yazılım veya sürücü şüphelidir.</p>
<p>Ofis bilgisayarlarında düzenli yedek ve güncel görüntü yedeği, uzun süreli kesintileri önler.</p>`,
  },
  {
    slug: 'gmail-sifre-sifirlama-ve-guvenlik',
    title: 'Gmail’e Giremiyorum: Şifre Sıfırlama ve İki Adımlı Doğrulama',
    excerpt:
      'Hesap kurtarma, yedek e-posta ve telefon doğrulaması ile Gmail erişim sorunlarını giderme özeti.',
    category: 'Dijital Güvenlik',
    tags: ['gmail', 'şifre sıfırlama', 'google hesap', 'güvenlik'],
    image: IMG_TECH,
    content: `<p>Şifrenizi unuttuysanız Google hesap kurtarma sayfasından <strong>yedek e-posta</strong> veya telefon ile doğrulama yapın.</p>
<h2>İki adımlı doğrulama</h2><p>Aktifse yedek kodlarınızı güvenli bir yerde saklayın. Ortak ofis bilgisayarında “oturumu açık tut” seçeneğini kullanmayın.</p>`,
  },
  {
    slug: 'airpods-bir-taraf-ses-vermiyor',
    title: 'AirPods ve Bluetooth Kulaklıkta Tek Tarafta Ses Yok: Temizlik ve Eşleştirme',
    excerpt:
      'Kulaklık deliklerinde biriken kir, dengesiz ses veya tek tarafla çalma sorununa yol açabilir. Yeniden eşleştirme adımları.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['airpods', 'bluetooth kulaklık', 'tek kulaklık ses'],
    image: IMG_PHONE,
    content: `<p>Önce kulaklık filtresini yumuşak fırça ile temizleyin. iPhone’da <strong>Bluetooth</strong> ayarından cihazı unutup yeniden eşleştirin.</p>
<h2>Denge ve erişilebilirlik</h2><p>iOS’ta Ses → Kulaklık uyumluluğu altında sol/sağ dengeyi kontrol edin. Sorun devam ederse servis gerekebilir.</p>`,
  },
  {
    slug: 'router-sifresi-nasil-degistirilir',
    title: 'Ev ve Ofis İçin Wi‑Fi Router Şifresi Nasıl Değiştirilir?',
    excerpt:
      '192.168.1.1 veya etiket üzerindeki adrese giriş, admin şifresi ve WPA2/WPA3 ayarlarına kısa rehber.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['router şifre', 'wifi güvenliği', 'modem ayarları'],
    image: IMG_TECH,
    content: `<p>Modem arka etiketinde <strong>varsayılan IP ve kullanıcı adı</strong> yazar. Tarayıcıdan giriş yapın; ilk kurulumda şifreyi mutlaka değiştirin.</p>
<h2>WPA3 ve misafir ağı</h2><p>Mümkünse WPA3 seçin. Ofis için misafir ağı ile ana ağı ayırın; paylaşılan klasörleri koruyun.</p>`,
  },
  {
    slug: 'whatsapp-sohbet-yedegi-android-iphone',
    title: 'WhatsApp Sohbet Yedeği: Android ve iPhone Özeti',
    excerpt:
      'Google Drive ve iCloud yedekleme sıklığı, yedek boyutu ve telefon değişiminde dikkat edilecekler.',
    category: 'Dijital Yaşam',
    tags: ['whatsapp yedek', 'android', 'iphone'],
    image: IMG_PHONE,
    content: `<p>Android’de WhatsApp genelde <strong>Google Drive</strong> ile yedeklenir; iPhone’da iCloud kullanılır. Mobil veri üzerinden büyük yedekler maliyetli olabilir.</p>
<h2>Telefon değişimi</h2><p>Aynı işletim sistemi içinde geçiş daha sorunsuzdur. Platform değişiminde “Sohbetleri taşı” seçeneklerini resmi yardım sayfasından kontrol edin.</p>`,
  },
  {
    slug: 'istanbul-kart-marmaray-bakiye-2026',
    title: 'İstanbul’da Ulaşımda İstanbul Kart ve Entegrasyon: Pratik Bilgiler',
    excerpt:
      'Bakiye yükleme noktaları, Marmaray ve metrobüs kullanımında sık yapılan hatalar ve dijital yükleme uygulamaları.',
    category: 'İstanbul ve Yaşam',
    tags: ['istanbul kart', 'marmaray', 'metro', 'ulaşım'],
    image: IMG_ISTANBUL,
    content: `<p><strong>İstanbul Kart</strong> ile metro, tramvay, metrobüs ve Marmaray’da tek kartla ödeme yapılır. Bakiyenizi istasyonlardaki cihazlardan veya mobil uygulamalardan yükleyebilirsiniz.</p>
<h2>Yoğun saatler</h2><p>Sabah 08:00–09:30 ve akşam 17:30–19:30 arası hatlar daha kalabalıktır. Ev ve iş arasında plan yaparken alternatif güzergâhları harita uygulamalarından kontrol edin.</p>
<p>Şehir içinde günlük hareket eden çalışanlar için aylık abonelik seçeneklerini karşılaştırmak maliyeti düşürebilir.</p>`,
  },
  {
    slug: 'istanbul-kis-kombi-basinci-dusuk',
    title: 'Kışın Kombi Basıncı Düşüyor: Ev Sahipleri İçin Kontrol Listesi',
    excerpt:
      'Radyatör havası, genleşme tankı ve güvenlik vanası hakkında genel bilgi; yetkili servis öncesi yapılabilecekler.',
    category: 'İstanbul ve Yaşam',
    tags: ['kombi', 'ısıtma', 'istanbul kış', 'ev bakımı'],
    image: IMG_HOME,
    content: `<p><strong>Kombi bar</strong> göstergesi yeşil aralığın altındaysa sistem suyu eksik olabilir. Kullanım kılavuzuna göre yavaşça doldurma yapılabilir; emin değilseniz servis çağırın.</p>
<h2>Radyatörler ısınmıyorsa</h2><p>Hava yapmış olabilir; vanaların açık olduğundan emin olun. İstanbul’da eski binalarda tesisat tortusu da verimi düşürür.</p>`,
  },
  {
    slug: 'istanbul-trafik-yogunlugu-alternatif-yollar',
    title: 'İstanbul’da Trafik Yoğunluğu: Avrupa Yakası Alternatif Güzergâh İpuçları',
    excerpt:
      'Köprü ve mahalle içi kesintilerde harita uygulamaları, toplu taşıma ve saat seçimi önerileri.',
    category: 'İstanbul ve Yaşam',
    tags: ['istanbul trafik', 'ulaşım', 'köprü', 'alternatif yol'],
    image: IMG_TRAFFIC,
    content: `<p>İstanbul’da sabah ve akşam zirvelerinde <strong>ana arterler</strong> sık kilitlenir. Mümkünse metro veya deniz hatlarıyla ana güzergâhı kısaltın.</p>
<h2>Harita ve bildirim</h2><p>Canlı trafik verisi sunan uygulamalarda “kaçınılacak bölgeler” uyarılarını açın. İşe gidiş saatini 30 dakika kaydırmak bazen süreyi yarı yarıya düşürür.</p>`,
  },
  {
    slug: 'istanbul-hava-kalitesi-polene-karsi',
    title: 'İstanbul Hava Kalitesi ve Polen Sezonu: Evde Alınabilecek Önlemler',
    excerpt:
      'Hava durumu ve polen takibi, pencere kullanımı ve HEPA filtre hakkında kısa bilgilendirme.',
    category: 'Sağlık ve Yaşam',
    tags: ['hava kualitesi', 'polen', 'istanbul', 'alerji'],
    image: IMG_ISTANBUL,
    content: `<p>Bahar aylarında <strong>polen</strong> counts yüksekken pencereleri özellikle öğle saatlerinde kapalı tutmak faydalıdır. Hava temizleyici kullanıyorsanız HEPA filtreyi düzenli değiştirin.</p>
<h2>Dışarıda zamanlama</h2><p>Rüzgârlı ve yağmurlu günlerde polen konsantrasyonu genelde daha düşüktür. Spor için sabah erken saatler yerine akşamüstü tercih edilebilir.</p>`,
  },
  {
    slug: 'elektrik-kesintisi-bedas-edas-bildirim',
    title: 'İstanbul’da Planlı Elektrik Kesintisi Bildirimi: Bilinen Kanallar',
    excerpt:
      'Dağıtım şirketi web ve mobil kanallarından kesinti sorgulama; buzdolabı ve elektronik için kısa hatırlatmalar.',
    category: 'İstanbul ve Yaşam',
    tags: ['elektrik kesintisi', 'istanbul', 'bedaş', 'edaş'],
    image: IMG_TECH,
    content: `<p>Planlı kesintiler genelde <strong>mahalle bazında</strong> duyurulur. Posta kodunuz veya hesap numaranız ile dağıtım şirketinizin sitesinden sorgulama yapın.</p>
<h2>Ev ve ofis</h2><p>Uzun kesintilerde derin dondurucuyu açmayın; kritik veriler için UPS veya dizüstü pil ömrünü planlayın.</p>`,
  },
  {
    slug: 'dijital-fotograf-yedekleme-bulut',
    title: 'Dijital Fotoğrafları Bulutta Yedekleme: Temel Prensipler',
    excerpt:
      'Otomatik yedek, çift kopya ve telefon depolama doluluğu için pratik öneriler.',
    category: 'Dijital Yaşam',
    tags: ['bulut yedek', 'google fotoğraflar', 'iphone', 'android'],
    image: IMG_PHONE,
    content: `<p>Tek kopya risklidir: telefon kaybolursa anılar da gidebilir. <strong>Otomatik yükleme</strong> açık olsa bile önemli albümleri ayrıca harici diske veya ikinci buluta alın.</p>
<h2>Depolama maliyeti</h2><p>Ücretsiz kotayı aşmadan önce sıkıştırma ve gereksiz ekran görüntülerini temizleyin.</p>`,
  },
  {
    slug: 'akilli-tv-netflix-donma-cozum',
    title: 'Akıllı TV’de Uygulama Donuyor: Önbellek ve Ağ Kontrolleri',
    excerpt:
      'Uygulama güncelleme, kablolu bağlantı ve fabrika ayarına dönmeden önce yapılacaklar.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['akıllı tv', 'netflix', 'donma', 'yazılım'],
    image: IMG_TECH,
    content: `<p>Önce uygulama önbelleğini temizleyin ve TV yazılımını güncelleyin. Mümkünse <strong>ethernet</strong> ile bağlanın; Wi‑Fi sinyal zayıfsa tamponlama artar.</p>
<h2>Son çare</h2><p>Uygulamayı kaldırıp yeniden yükleyin. Sorun tüm uygulamalarda varsa fabrika ayarı son seçenek olmalıdır.</p>`,
  },
  {
    slug: 'istanbul-otopark-uygulamalari',
    title: 'İstanbul’da Park Yeri Ararken: Dijital Araçlar ve Dikkat Edilecekler',
    excerpt:
      'Katlı otopark, sokak parkı ve mobil ödeme uygulamalarına genel bakış; ceza ve süre hatırlatıcıları.',
    category: 'İstanbul ve Yaşam',
    tags: ['istanbul park', 'otopark', 'mobil ödeme', 'araç'],
    image: IMG_TRAFFIC,
    content: `<p>Merkez ilçelerde <strong>sokak parkı</strong> süreli ve ücretlidir. Plaka tanıma veya SMS ile ödeme yapan sistemlerde süreyi aşmamak için hatırlatıcı kurun.</p>
<h2>Alternatif</h2><p>Metro + son kilometre yürüyüşü, yoğun bölgelerde stresi azaltabilir.</p>`,
  },
  {
    slug: 'dsl-modem-isiklari-anlami',
    title: 'Modem Işıkları Ne Anlama Gelir? DSL ve Fiber Kısa Rehber',
    excerpt:
      'DSL, internet ve Wi‑Fi ışıklarının tipik durumları ve bağlantı sorununda sırayla yapılacak kontroller.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['modem ışıkları', 'dsl', 'fiber', 'internet arıza'],
    image: IMG_TECH,
    content: `<p>Her üreticinin etiketi farklıdır; genelde <strong>DSL/Link</strong> senkronizasyonu, <strong>Internet</strong> oturumu ve <strong>Wi‑Fi</strong> kablosuz yayını gösterir.</p>
<h2>DSL sönükse</h2><p>Telefon hattı splitter bağlantılarını kontrol edin; kabloları çıkarıp takın. Sorun devam ederse hat kalitesi için operatör kaydı açtırın.</p>`,
  },
  {
    slug: 'istanbul-metrobus-yogun-saatler',
    title: 'Metrobüs Hattında Yoğunluk: Saat Seçimi ve Aktarma İpuçları',
    excerpt:
      'Sık kullanılan duraklar, alternatif hatlar ve konfor için zamanlama önerileri.',
    category: 'İstanbul ve Yaşam',
    tags: ['metrobüs', 'istanbul ulaşım', 'yoğun saat'],
    image: IMG_ISTANBUL,
    content: `<p><strong>Metrobüs</strong> hattı yoğun saatlerde kapasiteye yaklaşır. Mümkünse 10:00–15:00 arası veya 20:00 sonrası seyahat daha rahattır.</p>
<h2>Aktarma</h2><p>Metro veya Marmaray ile birleşen duraklarda önceden kart bakiyenizi kontrol edin; sıra beklemesi azalır.</p>`,
  },
  {
    slug: 'laptop-yavasladi-temizlik-ve-ssd',
    title: 'Bilgisayar Yavaşladı: Disk Doluluğu, Başlangıç Programları ve SSD',
    excerpt:
      'Windows görev yöneticisi, disk temizliği ve donanım yükseltmesine giriş seviyesi özet.',
    category: 'Teknoloji ve Günlük Yaşam',
    tags: ['bilgisayar yavaş', 'ssd', 'windows optimizasyon'],
    image: IMG_TECH,
    content: `<p>Önce <strong>Görev Yöneticisi</strong>nde CPU ve disk kullanımına bakın. Disk %90 doluluk üzerindeyse yer açın; gereksiz başlangıç programlarını kapatın.</p>
<h2>Donanım</h2><p>Eski mekanik diskli dizüstü bilgisayarlarda SSD geçişi en belirgin hız kazanımını verir. Verilerinizi yedekleyerek işlem yaptırın.</p>
<p>İstanbul’daki ofislerde çok sayıda arka planda çalışan kurumsal yazılım da yavaşlamaya neden olabilir; IT politikalarına uygun temizlik yapın.</p>`,
  },
  {
    slug: 'phishing-mail-nasil-anlasilir',
    title: 'Sahte E-posta (Phishing) Nasıl Anlaşılır? Kurumsal Kullanıcılar İçin Özet',
    excerpt:
      'Gönderen adresi, aciliyet dili ve link tıklamadan önce doğrulama alışkanlikleri.',
    category: 'Dijital Güvenlik',
    tags: ['phishing', 'sahte mail', 'siber güvenlik', 'ofis'],
    image: IMG_TECH,
    content: `<p>Banka veya kargo adına <strong>“hemen tıklayın”</strong> baskısı yapan mailler şüphelidir. Gönderen alan adını tam okuyun; Türkçe yazım hatalarına dikkat edin.</p>
<h2>Linklere tıklamadan</h2><p>Fare ile üzerine gelerek gerçek URL’yi görün. Şüphe varsa resmi siteyi doğrudan yazarak açın.</p>`,
  },
];

/** 30 — temizlik şirketi blog SEO içerikleri */
const CLEANING_POSTS: BlogSeedPost[] = [
  {
    slug: 'ev-temizliginde-5-altin-kural',
    title: 'Ev Temizliğinde 5 Altın Kural: İstanbul’da Düzenli ve Sağlıklı Ev',
    excerpt:
      'Üstten alta temizlik sırası, doğru ürün seçimi ve profesyonel destek ile ev hijyenini sürdürülebilir kılın.',
    category: 'Temizlik İpuçları',
    tags: ['ev temizliği', 'istanbul', 'hijyen', 'temizlik planı'],
    image: IMG_HOME,
    content: `<p>Ev temizliği düzenli yapıldığında hem sağlıklı bir yaşam alanı sağlar hem de yüzeylerin ömrünü uzatır. <strong>İstanbul</strong>’da yoğun tempoda yaşayan aileler için küçük ama etkili alışkanlıklar büyük fark yaratır.</p>
<h2>1. Plan ve sıra</h2><p>Önce toz alın, sonra silin ve en sonda zemin yıkayın. Her gün tek oda veya tek görev seçmek sürdürülebilirlik sağlar.</p>
<h2>2. Yüzeye uygun ürün</h2><p>Ahşap, doğal taş ve laminat için asitli ürünleri kontrol edin. Karışık kimyasal kullanımından kaçının.</p>
<h2>3. Profesyonel derin temizlik</h2><p>Yılda birkaç kez <strong>profesyonel ev temizliği</strong> ile fırın, dolap içleri ve detaylar güvence altına alınır.</p>`,
  },
  {
    slug: 'ofis-temizligi-is-verimliligini-nasil-artirir',
    title: 'Ofis Temizliği İş Verimliliğini Nasıl Artırır?',
    excerpt:
      'Hijyen, görünürlük ve çalışan memnuniyeti: kurumsal temizlik yatırımının özet faydaları.',
    category: 'Kurumsal Temizlik',
    tags: ['ofis temizliği', 'kurumsal', 'istanbul ofis', 'verimlilik'],
    image: IMG_OFFICE,
    content: `<p>Temiz bir ofis yalnızca estetik değil; <strong>iş gücü devamsızlığı</strong> ve müşteri algısı için de kritiktir. Düzenli <strong>ofis temizliği</strong> ile ortak alanlarda bakteri yükü azalır.</p>
<h2>Çalışan deneyimi</h2><p>Düzenli çöp toplama, mutfak hijyeni ve WC bakımı moral ve odaklanmayı destekler.</p>
<h2>Kurumsal imaj</h2><p>İstanbul’da toplantı alanları ve lobiler ilk izlenimi belirler; sözleşmeli temizlik ile standart sabitlenir.</p>`,
  },
  {
    slug: 'koltuk-yikama-ne-siklikla-yapilmali',
    title: 'Koltuk Yıkama Ne Sıklıkla Yapılmalı?',
    excerpt:
      'Evcil hayvan, çocuk ve alerji durumuna göre periyot önerileri ve profesyonel yıkamanın faydaları.',
    category: 'Mobilya Temizliği',
    tags: ['koltuk yıkama', 'kanepe', 'istanbul', 'alerjen'],
    image: IMG_SOFA,
    content: `<p>Normal kullanımda koltuklar yılda <strong>1–2 kez</strong> profesyonel yıkanmalıdır. Evcil hayvan veya küçük çocuk varsa 6 ayda bir önerilir.</p>
<h2>Neden profesyonel?</h2><p>Ev tipi makineler derin katmanlara inemez; leke ve kökü tam çıkarmak için <strong>ekstraksiyon</strong> ekipmanı gerekir.</p>
<p>İstanbul’da yerinde koltuk yıkama ile taşıma zorluğu ortadan kalkar.</p>`,
  },
  {
    slug: 'insaat-sonrasi-temizlik-neden-onemli',
    title: 'İnşaat Sonrası Temizlik Neden Önemli?',
    excerpt:
      'Toz, boya ve kimyasal kalıntıların sağlık ve ekipmanlar üzerindeki etkileri; profesyonel teslim.',
    category: 'İnşaat Temizliği',
    tags: ['inşaat sonrası temizlik', 'tadilat', 'istanbul', 'toz'],
    image: IMG_HOME,
    content: `<p>Tadilat veya yeni teslim sonrası <strong>ince toz</strong> HVAC ve elektronikte birikir. Solunum hassasiyeti olanlar için risk oluşturur.</p>
<h2>Profesyonel süreç</h2><p>Endüstriyel süpürge, yüzey uyumlu kimyasallar ve cam/zemin detayı ile tek seferde yaşanabilir ortam sağlanır.</p>
<p>İstanbul genelinde daire ve ofis projelerinde süre ve ekip sayısı metrekareye göre planlanır.</p>`,
  },
  {
    slug: 'hali-lekeleri-cikarma-evde-ilk-yardim',
    title: 'Halı Lekelerinde İlk Yardım: Kahve, Şarap ve Çamur İçin Temel Adımlar',
    excerpt:
      'Bekletmeden emdirme, doğru sıvı seçimi ve profesyonel halı yıkamaya ne zaman başvurulmalı.',
    category: 'Halı ve Döşeme',
    tags: ['halı lekesi', 'halı temizliği', 'istanbul', 'lekeler'],
    image: IMG_CARPET,
    content: `<p>Lekenin üzerine bastırmayın; kağıt havlu ile <strong>dışarıdan içe</strong> emdirin. Renk açıcı ağartıcıları yün halıda kullanmayın.</p>
<h2>Profesyonel destek</h2><p>Geniş leke veya eski lekelerde ev müdahalesi halıyı sabitleyebilir; <strong>halı yıkama</strong> servisi ile lif analizi daha güvenlidir.</p>`,
  },
  {
    slug: 'mutfak-yag-kirleri-nasil-cozulur',
    title: 'Mutfak Yağ ve Kir Birikintileri: Yüzeylere Göre Temizlik',
    excerpt:
      'Davlumbaz filtresi, fayans derzleri ve paslanmaz tezgâh için güvenli yöntemler.',
    category: 'Temizlik İpuçları',
    tags: ['mutfak temizliği', 'yağ sökücü', 'ev', 'hijyen'],
    image: IMG_HOME,
    content: `<p>Yağ buharla birlikte yüzeylere yapışır. Ilık su ve uygun deterjanla ön yıkama yapın; fırça ile aşırı çizilmesin diye dikkat edin.</p>
<h2>Düzenli bakım</h2><p>Filtre ve davlumbaz temizliği yangın riskini de azaltır. Yoğun kullanan <strong>İstanbul</strong> mutfaklarında haftalık hafif, aylık derin temizlik önerilir.</p>`,
  },
  {
    slug: 'banyo-kuf-ve-kirec-onleme',
    title: 'Banyoda Küf ve Kireç: Önleme ve Düzenli Bakım Önerileri',
    excerpt:
      'Havalandırma, silikon hatları ve doğal asit kullanımına dair kısa rehber.',
    category: 'Temizlik İpuçları',
    tags: ['banyo temizliği', 'küf', 'kireç', 'hijyen'],
    image: IMG_WINDOW,
    content: `<p>Duş sonrası camı süpürge ile sıyırmak ve kapıyı açık bırakmak <strong>nemi</strong> düşürür. Silikonlarda siyahlama varsa kökü değiştirmek gerekir.</p>
<h2>Kireç</h2><p>Musluk başlarında sirke bazlı bekletme işe yarayabilir; emaye ve kromda aşındırıcı kullanmayın.</p>`,
  },
  {
    slug: 'cam-temizliginde-iz-kalmamasi',
    title: 'Cam ve Aynada İz Kalmadan Temizlik: Bez Seçimi ve Teknik',
    excerpt:
      'Mikrofiber, gazete klişesi ve dış cephede güvenlik vurgusu.',
    category: 'Cam Temizliği',
    tags: ['cam temizliği', 'istanbul', 'dış cephe', 'ofis camı'],
    image: IMG_WINDOW,
    content: `<p>İç mekânda <strong>mikrofiber</strong> ve az deterjan ile S şeklinde silme izleri azaltır. Güneşte doğrudan kuruyan kimyasal iz bırakabilir.</p>
<h2>Dış cephe</h2><p>Yüksek katlarda mutlaka emniyet ekipmanı ve sigortalı ekip tercih edin. <strong>Profesyonel cam temizliği</strong> ile iş güvenliği sağlanır.</p>`,
  },
  {
    slug: 'ofis-hijyeni-mevzuat-ve-calisan-sagligi',
    title: 'Ofis Hijyeni ve Çalışan Sağlığı: Düzenli Temizlik Planı',
    excerpt:
      'Ortak alanlar, klavye ve kapı kolları gibi yüksek temas noktaları için öneriler.',
    category: 'Kurumsal Temizlik',
    tags: ['ofis hijyeni', 'işyeri', 'dezenfeksiyon', 'istanbul'],
    image: IMG_OFFICE,
    content: `<p>Toplantı odaları ve mutfaklar çapraz bulaşma için kritiktir. Gün sonu <strong>tezgâh ve lavabo</strong> silinmesi rutin olmalıdır.</p>
<h2>Periyodik derin temizlik</h2><p>Halıfleks ve koltuklar alerjen biriktirir; üç ayda bir detaylı temizlik ofis havasını iyileştirir.</p>`,
  },
  {
    slug: 'yerinde-hali-yikama-avantajlari',
    title: 'Yerinde Halı Yıkama mı, Fabrikada mı? Avantajların Karşılaştırması',
    excerpt:
      'Ağır halılarda toplama maliyeti, kuruma süresi ve sonuç kalitesi.',
    category: 'Halı ve Döşeme',
    tags: ['halı yıkama', 'istanbul', 'yerinde hizmet', 'halı'],
    image: IMG_CARPET,
    content: `<p>Yerinde hizmet, taşıma ve zaman kaybını azaltır. Fabrika tipi işlem çok kirli veya el dokuma ürünlerde tercih edilebilir.</p>
<h2>Doğru seçim</h2><p>Halı tipi, leke yoğunluğu ve kuruma koşullarına göre yöntem seçilir. <strong>Günen Temizlik</strong> ile ön değerlendirme alabilirsiniz.</p>`,
  },
  {
    slug: 'koltukta-evcil-hayvan-koku-giderme',
    title: 'Evcil Hayvanlı Evlerde Koltuk Kokusu: Temizlik ve Bakım Önerileri',
    excerpt:
      'Tüy toplama, enzim bazlı ürünler ve profesyonel yıkama sıklığı.',
    category: 'Mobilya Temizliği',
    tags: ['koltuk', 'evcil hayvan', 'koku giderme', 'istanbul'],
    image: IMG_SOFA,
    content: `<p>Düzenli süpürme ve kumaşa uygun köpük ile yüzeysel bakım kokuyu geciktirir. Derin koku için <strong>profesyonel ekstraksiyon</strong> gerekir.</p>
<h2>Önlem</h2><p>Islak müdahaleden kaçının; küf riski artar. Kurutma hava akımı ile desteklenmelidir.</p>`,
  },
  {
    slug: 'yesil-temizlik-urunleri-secimi',
    title: 'Daha Az Kimyasal: Evde “Yeşil” Temizlik Ürünü Seçerken Nelere Bakılır?',
    excerpt:
      'Etiket okuma, parfüm ve fosfat; hassas bireyler ve çocuklar için notlar.',
    category: 'Temizlik İpuçları',
    tags: ['yeşil temizlik', 'doğa dostu', 'ev', 'sağlık'],
    image: IMG_HOME,
    content: `<p>Çok amaçlı etiketli ürünler her yüzeyde güvenli olmayabilir. <strong>pH değeri</strong> ve yüzey uyarılarını okuyun.</p>
<h2>Havalandırma</h2><p>Yoğun kimyasal kullanımında pencere açık tutun. Alternatif olarak mikrofiber + sıcak su birçok günlük kir için yeterlidir.</p>`,
  },
  {
    slug: 'parke-ve-laminat-zemin-bakimi',
    title: 'Parke ve Laminat Zeminde Çizilme ve Su Hasarından Korunma',
    excerpt:
      'Nem mop, keçe ped ve mobilya altı koruyucu kullanımı.',
    category: 'Temizlik İpuçları',
    tags: ['parke bakımı', 'laminat', 'zemin temizliği', 'ev'],
    image: IMG_HOME,
    content: `<p>Aşırı ıslak mop laminatta şişmeye yol açar. Hafif nemli mop ve üreticinin önerdiği ürünleri kullanın.</p>
<h2>Giriş alanı</h2><p>Paspas ve ayakkabı çıkarma, <strong>İstanbul</strong> kışlarında çamur ve tuzun eve taşınmasını azaltır.</p>`,
  },
  {
    slug: 'derin-temizlik-ne-zaman-gerekir',
    title: 'Derin Temizlik Ne Zaman Gerekir? Tek Seferlik ve Sezonluk Plan',
    excerpt:
      'Bayram öncesi, taşınma ve alerji sezonunda profesyonel paketler.',
    category: 'Profesyonel Temizlik',
    tags: ['derin temizlik', 'istanbul', 'ev temizliği', 'taşınma'],
    image: IMG_HOME,
    content: `<p>Günlük yüzey temizliği ile derin temizlik farklıdır. Dolap içleri, fırın, buzdolabı arka yüzeyi ve süpürgelikler genelde derin pakete girer.</p>
<h2>Zamanlama</h2><p>İlkbahar ve sonbahar alerjen dönemleri yoğun talep yaratır; erken randevu planlayın.</p>`,
  },
  {
    slug: 'ofis-hali-yikama-sikligi',
    title: 'Ofis Halısı Ne Sıklıkla Yıkanmalı? Yoğun Ayak Trafiği İçin Öneri',
    excerpt:
      'Giriş halıları, koridor ve toplantı odaları için farklı periyotlar.',
    category: 'Kurumsal Temizlik',
    tags: ['ofis halısı', 'halı yıkama', 'kurumsal', 'istanbul'],
    image: IMG_OFFICE,
    content: `<p>Yüksek trafikli alanlar üç ayda bir, düşük trafik altı ayda bir yıkanabilir. Leke oluştuğunda beklemek lif içine işlemesine neden olur.</p>
<h2>Çalışma saatleri</h2><p>İş çıkışı veya hafta sonu planlaması iş aksamasını önler.</p>`,
  },
  {
    slug: 'tasinma-oncesi-sonrasi-temizlik',
    title: 'Taşınma Öncesi ve Sonrası Temizlik: Depozito ve Yeni Ev',
    excerpt:
      'Eski kiracı çıkışı ve yeni daire tesliminde kontrol listesi.',
    category: 'Profesyonel Temizlik',
    tags: ['taşınma temizliği', 'istanbul', 'ev', 'depozito'],
    image: IMG_HOME,
    content: `<p>Çıkış temizliği depozito iadesi için önemlidir. Yeni dairede önce toz alıp sonra detay, özellikle dolap içleri ve banyo küf kontrolü yapın.</p>
<h2>Zaman tasarrufu</h2><p>Profesyonel ekip ile tek günde teslim mümkün olabilir.</p>`,
  },
  {
    slug: 'dis-cephe-kirliligi-ve-yagmur-izi',
    title: 'Bina Dış Cephesinde Kir ve Yağmur İzi: Cam ve Kaplama Bakımı',
    excerpt:
      'Periyodik yıkama, güvenlik ve estetik faydalar.',
    category: 'Cam Temizliği',
    tags: ['dış cephe', 'cam temizliği', 'istanbul', 'bina bakımı'],
    image: IMG_WINDOW,
    content: `<p>Hava kirliliği ve yağmur suyu izleri camda matlaşma yapar. Düzenli <strong>dış cephe cam temizliği</strong> ışık geçirgenliğini artırır.</p>
<h2>Güvenlik</h2><p>Yüksekte çalışma yönetmeliğine uygun ekipman şarttır.</p>`,
  },
  {
    slug: 'klima-ici-temizlik-neden-onemli',
    title: 'Klima İç Ünite ve Filtre Temizliği: Koku ve Verim İçin',
    excerpt:
      'Filtre yıkama sıklığı ve profesyonel bakım önerisi.',
    category: 'Temizlik İpuçları',
    tags: ['klima temizliği', 'filtre', 'hava kalitesi', 'istanbul'],
    image: IMG_HOME,
    content: `<p>Kirli filtre enerji tüketimini artırır ve koku yapar. Kullanım kılavuzuna göre iki haftada bir filtre kontrolü yapın.</p>
<h2>Derin bakım</h2><p>Serpantin ve drain hattı için yılda bir servis veya temizlik paketi düşünün.</p>`,
  },
  {
    slug: 'dezenfeksiyon-ve-temizlik-farki',
    title: 'Temizlik ile Dezenfeksiyon Arasındaki Fark Nedir?',
    excerpt:
      'Yüzeydeki kir gidermek ile mikroorganizma azaltmak farklı işlemlerdir.',
    category: 'Hijyen',
    tags: ['dezenfeksiyon', 'hijyen', 'ofis', 'ev'],
    image: IMG_OFFICE,
    content: `<p>Önce temizlik, sonra gerekirse <strong>uygun dezenfektan</strong> uygulanır. Kir üzerinde dezenfektan etkisi düşer.</p>
<h2>Ofisler</h2><p>Kapı kolları, asansör düğmeleri gibi dokunma noktaları sık aralıklıla silinmelidir.</p>`,
  },
  {
    slug: 'istanbul-ofis-temizlik-sozlesmesi-dikkat',
    title: 'İstanbul’da Ofis Temizlik Sözleşmesinde Nelere Dikkat Etmeli?',
    excerpt:
      'Kapsam, sıklık, sorumluluk ve iptal maddelerine kısa kontrol listesi.',
    category: 'Kurumsal Temizlik',
    tags: ['ofis temizliği', 'sözleşme', 'istanbul', 'kurumsal'],
    image: IMG_OFFICE,
    content: `<p>Hangi alanların dahil olduğu (mutfak, WC, cam) net yazılmalıdır. <strong>Haftalık / günlük</strong> iş kalemleri ayrılmalıdır.</p>
<h2>Malzeme</h2><p>Temizlik ürünlerinin kim tarafından sağlanacağı ve hijyen standartları belirtilmelidir.</p>`,
  },
  {
    slug: 'ic-mekan-hava-kalitesi-toz-azaltma',
    title: 'Evde Toz Azaltma: Süpürge Seçimi ve Tekstil Yıkama',
    excerpt:
      'HEPA filtre, perde ve yatak örtüsü yıkama sıklığı.',
    category: 'Sağlık ve Hijyen',
    tags: ['toz', 'hava kalitesi', 'halı', 'ev'],
    image: IMG_CARPET,
    content: `<p>Tozun büyük kısmı tekstillerde tutunur. Perdeleri sezonluk yıkamak ve halıları düzenli süpürmek semptomları hafifletir.</p>
<h2>Profesyonel halı</h2><p>Derinlemesine yıkama toz akarı yükünü düşürür.</p>`,
  },
  {
    slug: 'mutfak-dolabi-ici-organizasyon-temizlik',
    title: 'Mutfak Dolabı İçi: Son Kullanma Tarihi ve Hijyen Düzeni',
    excerpt:
      'Gıda döküntüsü, küf ve böcek riskini azaltmak için düzenli boşaltma.',
    category: 'Temizlik İpuçları',
    tags: ['mutfak', 'dolap düzeni', 'hijyen', 'ev'],
    image: IMG_HOME,
    content: `<p>Açılmış paketleri hava geçirmez kaplara alın. Sıvı döküntülerini anında silin; <strong>küf</strong> kokusu genelde gizli köşelerden başlar.</p>
<h2>Yılda iki kez</h2><p>Tüm rafları boşaltıp silmek gıda güvenliği için faydalıdır.</p>`,
  },
  {
    slug: 'kirecli-musluk-basligi-temizligi',
    title: 'Kireçlenmiş Musluk Başlığı Nasıl Temizlenir? (Emaye ve Krom İçin)',
    excerpt:
      'Sirke bekletme, diş fırçası ile detay ve aşındırıcı kullanmama uyarısı.',
    category: 'Temizlik İpuçları',
    tags: ['kireç', 'banyo', 'musluk', 'ev bakımı'],
    image: IMG_WINDOW,
    content: `<p>Sirke ile bez sarıp bekletmek hafif kireçte işe yarar. Sonrasında bol su ile durulayın.</p>
<h2>Dikkat</h2><p>Granit veya özel kaplamalarda üretici uyarısına uyun; asit zarar verebilir.</p>`,
  },
  {
    slug: 'ofis-mutfak-bulasik-hijyeni',
    title: 'Ofis Mutfağında Bulaşık ve Sünger Hijyeni',
    excerpt:
      'Ortak sünger riski, bulaşık makinesi kullanımı ve günlük silme.',
    category: 'Kurumsal Temizlik',
    tags: ['ofis mutfağı', 'hijyen', 'bulaşık', 'kurumsal'],
    image: IMG_OFFICE,
    content: `<p>Ortak sünger bakteri taşır; kişisel veya tek kullanımlı alternatif düşünün. Makine deterjanı ve tuz seviyesini kontrol edin.</p>
<h2>Gün sonu</h2><p>Tezgâh ve lavabo mutlaka silinmeli; çöp çuvalı taşmadan değiştirilmelidir.</p>`,
  },
  {
    slug: 'ic-mekan-koku-kaynaklari',
    title: 'Evde Kalıcı Koku: Olası Kaynaklar ve Temizlik Odaklı Çözüm',
    excerpt:
      'Lavabo sifonu, çöp kutusu, tekstil ve nem.',
    category: 'Temizlik İpuçları',
    tags: ['koku giderme', 'ev', 'lavabo', 'hijyen'],
    image: IMG_HOME,
    content: `<p>Koku kaynağını bulmadan ağır parfüm kullanmak geçici maskeler. Sifon ve gider contalarını kontrol edin.</p>
<h2>Tekstil</h2><p>Halı ve koltuk kökü gizleyebilir; profesyonel yıkama kalıcı çözüm olabilir.</p>`,
  },
  {
    slug: 'profesyonel-temizlik-fiyatini-etkileyenler',
    title: 'Profesyonel Temizlik Fiyatını Ne Belirler? Metrekare ve Zorluk',
    excerpt:
      'İstanbul’da keşif, hizmet türü ve süre faktörleri hakkında şeffaf özet.',
    category: 'Profesyonel Temizlik',
    tags: ['temizlik fiyatı', 'istanbul', 'keşif', 'metrekare'],
    image: IMG_HOME,
    content: `<p>Metrekâr, kirlilik düzeyi, cam yüksekliği ve aciliyet fiyatı etkiler. <strong>Ücretsiz keşif</strong> ile net teklif almak en doğrusudur.</p>
<h2>Hizmet paketi</h2><p>Ev, ofis ve inşaat sonrası farklı ekipman ve süre gerektirir.</p>`,
  },
  {
    slug: 'camasir-makinesi-kokusu-temizligi',
    title: 'Çamaşır Makinesi İçi Koku ve Küf: Düzenli Bakım',
    excerpt:
      'Kapak açık bırakma, deterjan çekmecesi ve filtreyi temizleme.',
    category: 'Temizlik İpuçları',
    tags: ['çamaşır makinesi', 'küf', 'ev bakımı', 'koku'],
    image: IMG_HOME,
    content: `<p>Yıkama sonrası kapak ve lastiği kurutmak küfü geciktirir. Aylık boşta yüksek sıcaklıkta çalıştırma ve üretici önerilen temizleyici kullanın.</p>`,
  },
  {
    slug: 'firin-ici-yagli-kir-temizligi',
    title: 'Fırın İçi Yanmış Yağ ve Kir: Güvenli Bekletme ve Silme',
    excerpt:
      'Kendi kendine temizleme döngüsü, soğuk fırında bekletme ve aşındırıcı kullanmama uyarıları.',
    category: 'Temizlik İpuçları',
    tags: ['fırın temizliği', 'mutfak', 'yağ sökücü', 'ev'],
    image: IMG_HOME,
    content: `<p>Fırın sıcakken soğuk su sıkmak camı çatlatabilir. Önce soğutun; üreticinin önerdiği <strong>kendi kendine temizleme</strong> programını kullanın.</p>
<h2>Doğal yöntem</h2><p>Buharlı bekletme için uygun kap içinde su ile düşük ısıda bekletme bazen yumuşatır. Metal spatulayı zorlamayın.</p>
<p>Derin ve endüstriyel kir birikimi için profesyonel mutfak / ev temizliği paketleri zaman kazandırır.</p>`,
  },
  {
    slug: 'ofis-cop-ayrimi-ve-geri-donusum',
    title: 'Ofiste Çöp Ayrımı ve Geri Dönüşüm: Temizlik Firmasıyla Uyum',
    excerpt:
      'Kağıt, ambalaj ve organik ayrımı için basit uygulamalar.',
    category: 'Kurumsal Temizlik',
    tags: ['geri dönüşüm', 'ofis', 'çevre', 'kurumsal'],
    image: IMG_OFFICE,
    content: `<p>Etiketli kutular ve ekip eğitimi sürdürülebilirliği artırır. Temizlik personeli ile toplama saatlerini netleştirin.</p>`,
  },
  {
    slug: 'istanbul-ev-temizlik-randevu-ipuclari',
    title: 'İstanbul’da Ev Temizlik Randevusu Alırken Verimli Hazırlık',
    excerpt:
      'Kişisel eşyaları toparlama, evcil hayvan ve çocuk güvenliği notları.',
    category: 'Profesyonel Temizlik',
    tags: ['ev temizliği', 'randevu', 'istanbul', 'hazırlık'],
    image: IMG_HOME,
    content: `<p>Değerli eşyaları kilitli dolaba alın; kabloları düzenleyin. Ekip girişinde park ve asansör bilgisini önceden paylaşın.</p>
<h2>Süre</h2><p>Metrekâra göre süre uzayabilir; gün içi planınızı esnek tutun.</p>`,
  },
];

export const BLOG_SEED_POSTS: BlogSeedPost[] = [...TRAFFIC_POSTS, ...CLEANING_POSTS];

export async function upsertCanonicalBlogPosts(prisma: PrismaClient): Promise<number> {
  for (const post of BLOG_SEED_POSTS) {
    const { slug, metaTitle, metaDesc, ...rest } = post;
    await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: rest.title,
        content: rest.content,
        excerpt: rest.excerpt,
        image: rest.image ?? null,
        category: rest.category,
        tags: rest.tags,
        author: 'Günen Temizlik',
        published: true,
        views: 0,
        metaTitle: metaTitle ?? null,
        metaDesc: metaDesc ?? null,
      },
      update: {
        title: rest.title,
        content: rest.content,
        excerpt: rest.excerpt,
        image: rest.image ?? null,
        category: rest.category,
        tags: rest.tags,
        published: true,
        metaTitle: metaTitle ?? null,
        metaDesc: metaDesc ?? null,
      },
    });
  }
  return BLOG_SEED_POSTS.length;
}
