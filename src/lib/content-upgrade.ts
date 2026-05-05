/**
 * Content Upgrade System
 * Blog yazılarını 1500-2000 kelimeye çıkarma, video ve before/after ekleme
 * Mevcut sistemi bozmadan yeni özellikler ekler
 */

interface ContentUpgradeOptions {
  addVideoSection: boolean;
  addBeforeAfter: boolean;
  addFAQ: boolean;
  addHowTo: boolean;
  addStatistics: boolean;
  targetWordCount: number;
}

interface EnhancedContent {
  content: string;
  wordCount: number;
  addedSections: string[];
  upgradeScore: number;
}

// Temizlik ile ilgili istatistikler ve veriler
const CLEANING_STATISTICS = {
  evTemizligi: {
    ortalamaSüre: '2-3 saat',
    fiyatAraligi: '750-2000₺',
    memnuniyetOrani: '98%',
    müsteriSayisi: '5000+',
    yillikDeneyim: '15+ yıl'
  },
  ofisTemizligi: {
    ortalamaSüre: '3-6 saat',
    fiyatAraligi: '1500-5000₺',
    memnuniyetOrani: '97%',
    müsteriSayisi: '300+',
    yillikDeneyim: '15+ yıl'
  },
  insaatSonrasi: {
    ortalamaSüre: '1-3 gün',
    fiyatAraligi: '2000-8000₺',
    memnuniyetOrani: '99%',
    müsteriSayisi: '200+',
    yillikDeneyim: '15+ yıl'
  }
};

// Video section şablonları
const VIDEO_SECTIONS = {
  temizlik: `
    <section class="video-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-4">🎥 Temizlik Sürecimizi Video ile İzleyin</h2>
      <div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-4">▶️</div>
          <p class="text-white text-lg">Profesyonel Temizlik Sürecimiz</p>
          <p class="text-slate-300 mt-2">15 yıllık deneyimimizle nasıl çalıştığımızı görün</p>
          <button class="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors">
            Videoyu İzle
          </button>
        </div>
      </div>
      <p class="text-slate-300 mt-4">
        Bu videoda profesyonel temizlik sürecimizin her aşamasını detaylı şekilde görüyoruz. 
        Ekipman seçiminden uygulama tekniklerine kadar tüm detaylar...
      </p>
    </section>
  `,
  
  hizmet: `
    <section class="video-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-4">🎥 Hizmet Kalitemizi Video ile Keşfedin</h2>
      <div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-4">▶️</div>
          <p class="text-white text-lg">Müşteri Yorumları ve Çalışmalarımız</p>
          <p class="text-slate-300 mt-2">Gerçek sonuçlarımızı görün</p>
          <button class="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors">
            Videoyu İzle
          </button>
        </div>
      </div>
      <p class="text-slate-300 mt-4">
        Müşterilerimizin memnuniyetini ve kalitemizi bu videoda görüntüleyebilirsiniz. 
        Referanslarımız ve başarı hikayelerimiz...
      </p>
    </section>
  `
};

// Before/After section şablonları
const BEFORE_AFTER_SECTIONS = {
  temizlik: `
    <section class="before-after-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-4">📸 Before & After - Temizlik Farkı</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="before-section">
          <h3 class="text-lg font-semibold text-red-400 mb-3">🚫 Temizlik Öncesi</h3>
          <div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">🏚️</div>
              <p class="text-white">Tozlu ve bakımsız</p>
              <p class="text-slate-300 text-sm mt-1">Kirli yüzeyler, lekeler</p>
            </div>
          </div>
          <ul class="text-slate-300 mt-3 space-y-1 text-sm">
            <li>• Toz ve kir birikintisi</li>
            <li>• Lekeli yüzeyler</li>
            <li>• Bakımsiz görünüm</li>
            <li>• Hijyenik olmayan koşullar</li>
          </ul>
        </div>
        
        <div class="after-section">
          <h3 class="text-lg font-semibold text-emerald-400 mb-3">✅ Temizlik Sonrası</h3>
          <div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">✨</div>
              <p class="text-white">Parlak ve hijyenik</p>
              <p class="text-slate-300 text-sm mt-1">Steril, temiz yüzeyler</p>
            </div>
          </div>
          <ul class="text-slate-300 mt-3 space-y-1 text-sm">
            <li>• %100 hijyenik ortam</li>
            <li>• Parlak ve temiz yüzeyler</li>
            <li>• Profesyonel görünüm</li>
            <li>• Sağlıklı yaşam alanı</li>
          </ul>
        </div>
      </div>
      <p class="text-slate-300 mt-4">
        15 yıllık deneyimimizle en zorlu temizlik sorunlarını bile çözüyoruz. 
        Professional ekipmanlarımız ve uzman ekibimizle fark yaratıyoruz.
      </p>
    </section>
  `
};

// FAQ section şablonları
const FAQ_SECTIONS = {
  temizlik: `
    <section class="faq-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-6">❓ Sıkça Sorulan Sorular</h2>
      <div class="space-y-4">
        <div class="faq-item bg-slate-700/50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-emerald-400 mb-2">Temizlik hizmetiniz ne kadar sürer?</h3>
          <p class="text-slate-300">
            Standart bir 2+1 daire için 2-3 saat, daha büyük metrekarelerde 4-6 saat sürmektedir. 
            Ekipman ve personel sayısına göre süre değişebilir.
          </p>
        </div>
        
        <div class="faq-item bg-slate-700/50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-emerald-400 mb-2">Kullandığınız temizlik malzemeleri güvenli mi?</h3>
          <p class="text-slate-300">
            Evet, T.C. Sağlık Bakanlığı onaylı, insan sağlığına zararlı olmayan, 
            eco-friendly temizlik ürünleri kullanıyoruz. Çocuk ve evcil hayvan dostudur.
          </p>
        </div>
        
        <div class="faq-item bg-slate-700/50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-emerald-400 mb-2">Garanti sunuyor musunuz?</h3>
          <p class="text-slate-300">
            Evet, tüm hizmetlerimiz için %100 müşteri memnuniyeti garantisi sunuyoruz. 
            Memnun kalmazsanız ücretsiz düzeltme yapıyoruz.
          </p>
        </div>
        
        <div class="faq-item bg-slate-700/50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-emerald-400 mb-2">Fiyatlandırma nasıl yapılıyor?</h3>
          <p class="text-slate-300">
            Metrekare, temizlik türü ve özel isteklerinize göre ücretsiz keşif sonrası 
            net fiyat teklifi sunuyoruz. Hiçbir gizli ücret yoktur.
          </p>
        </div>
      </div>
    </section>
  `
};

// HowTo section şablonları
const HOWTO_SECTIONS = {
  temizlik: `
    <section class="howto-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-6">📋 Profesyonel Temizlik Adımları</h2>
      <div class="space-y-6">
        <div class="step-item flex gap-4">
          <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
            1
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Keşif ve Planlama</h3>
            <p class="text-slate-300">
              Önce mekanı inceliyoruz, temizlik ihtiyaçlarını belirliyoruz ve 
              size özel bir plan hazırlıyoruz. Bu aşama yaklaşık 15-30 dakika sürer.
            </p>
          </div>
        </div>
        
        <div class="step-item flex gap-4">
          <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
            2
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Ekipman Hazırlığı</h3>
            <p class="text-slate-300">
              Professional temizlik makinelerimizi, eco-friendly malzemelerimizi 
              ve uzman ekibimizi hazırlıyoruz. Her şey tamamen sterilize edilmiştir.
            </p>
          </div>
        </div>
        
        <div class="step-item flex gap-4">
          <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
            3
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Uygulama</h3>
            <p class="text-slate-300">
              Yukarıdan aşağıya doğru temizliğe başlıyoruz. Tavan duvarlar, 
              mobilyalar, camlar ve son olarak zeminler temizlenir.
            </p>
          </div>
        </div>
        
        <div class="step-item flex gap-4">
          <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
            4
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white mb-2">Kontrol ve Teslimat</h3>
            <p class="text-slate-300">
              Detaylı kontrol yapıyoruz, her şeyin mükemmel olduğundan emin olduktan 
              sonra size teslim ediyoruz. Memnuniyetinizi garanti ediyoruz.
            </p>
          </div>
        </div>
      </div>
    </section>
  `
};

// İstatistik section şablonları
const STATISTICS_SECTIONS = {
  temizlik: `
    <section class="statistics-section bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-6">📊 Güven İstatistiklerimiz</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="stat-card bg-slate-700/50 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-emerald-400 mb-2">98%</div>
          <p class="text-white font-semibold">Müşteri Memnuniyeti</p>
          <p class="text-slate-300 text-sm mt-1">15+ yıllık tecrübe</p>
        </div>
        
        <div class="stat-card bg-slate-700/50 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-emerald-400 mb-2">5000+</div>
          <p class="text-white font-semibold">Mutlu Müşteri</p>
          <p class="text-slate-300 text-sm mt-1">Tüm İstanbul'da</p>
        </div>
        
        <div class="stat-card bg-slate-700/50 rounded-lg p-4 text-center">
          <div class="text-3xl font-bold text-emerald-400 mb-2">24/7</div>
          <p class="text-white font-semibold">Destek</p>
          <p class="text-slate-300 text-sm mt-1">Her zaman ulaşılabilir</p>
        </div>
      </div>
      <p class="text-slate-300 mt-4">
        15 yıldır sektörde lideriz. 5000'den fazla mutlu müşteri ve %98 memnuniyet oranıyla 
        İstanbul'un en güvenilir temizlik firmasıyız.
      </p>
    </section>
  `
};

/**
 * İçerik kategorisini belirle
 */
function detectContentCategory(title: string, content: string): string {
  const combinedText = `${title} ${content}`.toLowerCase();
  
  if (combinedText.includes('temizlik') || combinedText.includes('hijyen')) {
    return 'temizlik';
  }
  if (combinedText.includes('hizmet') || combinedText.includes('servis')) {
    return 'hizmet';
  }
  return 'genel';
}

/**
 * İçeriği zenginleştir
 */
export function enhanceContent(
  title: string,
  content: string,
  category: string,
  options: Partial<ContentUpgradeOptions> = {}
): EnhancedContent {
  const defaultOptions: ContentUpgradeOptions = {
    addVideoSection: true,
    addBeforeAfter: true,
    addFAQ: true,
    addHowTo: true,
    addStatistics: true,
    targetWordCount: 1500
  };
  
  const opts = { ...defaultOptions, ...options };
  const contentCategory = detectContentCategory(title, content);
  let enhancedContent = content;
  const addedSections: string[] = [];
  let upgradeScore = 0;
  
  // Başlangıç kelime sayısı
  const initialWordCount = content.split(/\s+/).length;
  
  // Video section ekle
  if (opts.addVideoSection && !enhancedContent.includes('video-section')) {
    const videoSection = VIDEO_SECTIONS[contentCategory as keyof typeof VIDEO_SECTIONS] || VIDEO_SECTIONS.temizlik;
    enhancedContent = enhancedContent + videoSection;
    addedSections.push('Video Section');
    upgradeScore += 20;
  }
  
  // Before/After section ekle
  if (opts.addBeforeAfter && !enhancedContent.includes('before-after-section')) {
    const beforeAfterSection = BEFORE_AFTER_SECTIONS[contentCategory as keyof typeof BEFORE_AFTER_SECTIONS] || BEFORE_AFTER_SECTIONS.temizlik;
    enhancedContent = enhancedContent + beforeAfterSection;
    addedSections.push('Before & After');
    upgradeScore += 25;
  }
  
  // FAQ section ekle
  if (opts.addFAQ && !enhancedContent.includes('faq-section')) {
    const faqSection = FAQ_SECTIONS[contentCategory as keyof typeof FAQ_SECTIONS] || FAQ_SECTIONS.temizlik;
    enhancedContent = enhancedContent + faqSection;
    addedSections.push('FAQ Section');
    upgradeScore += 20;
  }
  
  // HowTo section ekle
  if (opts.addHowTo && !enhancedContent.includes('howto-section')) {
    const howtoSection = HOWTO_SECTIONS[contentCategory as keyof typeof HOWTO_SECTIONS] || HOWTO_SECTIONS.temizlik;
    enhancedContent = enhancedContent + howtoSection;
    addedSections.push('HowTo Section');
    upgradeScore += 20;
  }
  
  // Statistics section ekle
  if (opts.addStatistics && !enhancedContent.includes('statistics-section')) {
    const statsSection = STATISTICS_SECTIONS[contentCategory as keyof typeof STATISTICS_SECTIONS] || STATISTICS_SECTIONS.temizlik;
    enhancedContent = enhancedContent + statsSection;
    addedSections.push('Statistics');
    upgradeScore += 15;
  }
  
  // Kelime sayısı kontrolü ve ekleme
  const finalWordCount = enhancedContent.split(/\s+/).length;
  
  // Eğer hedef kelime sayısına ulaşmadıysa, ilgili içerik ekle
  if (finalWordCount < opts.targetWordCount) {
    const additionalContent = generateAdditionalContent(contentCategory, opts.targetWordCount - finalWordCount);
    enhancedContent = enhancedContent + additionalContent;
    addedSections.push('Extended Content');
    upgradeScore += 10;
  }
  
  return {
    content: enhancedContent,
    wordCount: enhancedContent.split(/\s+/).length,
    addedSections,
    upgradeScore
  };
}

/**
 * Ek içerik oluştur
 */
function generateAdditionalContent(category: string, targetWords: number): string {
  const stats = CLEANING_STATISTICS[category as keyof typeof CLEANING_STATISTICS] || CLEANING_STATISTICS.evTemizligi;
  
  return `
    <section class="extended-content bg-slate-800/50 rounded-xl p-6 my-8">
      <h2 class="text-2xl font-bold text-white mb-4">📝 Detaylı Bilgiler</h2>
      <div class="text-slate-300 space-y-4">
        <p>
          ${stats.yillikDeneyim} sektör tecrübemizle, İstanbul'un tüm ilçelerinde profesyonel temizlik hizmeti sunuyoruz. 
          Müşteri memnuniyet oranı ${stats.memnuniyetOrani} olan firmamız, ${stats.müsteriSayisi} mutlu müşteriye hizmet vermiştir.
        </p>
        <p>
          Hizmetlerimiz ortalama ${stats.ortalamaSüre} sürmekte olup, fiyat aralığımız ${stats.fiyatAraligi} arasında değişmektedir. 
          Tüm ekibimiz profesyonel eğitimli ve sertifikalı personellerden oluşmaktadır.
        </p>
        <p>
          Kullandığımız tüm temizlik malzemeleri T.C. Sağlık Bakanlığı onaylı olup, insan sağlığına ve çevreye zarar vermez. 
          Hijyen standartlarımız uluslararası kalite belgeleri ile tescillidir.
        </p>
        <p>
          Randevu ve keşif hizmetlerimiz tamamen ücretsizdir. Hemen bize ulaşın, size özel çözümlerimizi sunalım. 
          7/24 ulaşılabilir müşteri hizmetlerimizle her zaman yanınızdayız.
        </p>
      </div>
    </section>
  `;
}

/**
 * Content upgrade skorunu hesapla
 */
export function calculateContentUpgradeScore(content: string): number {
  let score = 0;
  
  // Kelime sayısı skoru
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 1500) score += 30;
  else if (wordCount >= 1000) score += 20;
  else if (wordCount >= 500) score += 10;
  
  // Zengin içerik elementleri
  if (content.includes('video-section')) score += 20;
  if (content.includes('before-after-section')) score += 25;
  if (content.includes('faq-section')) score += 20;
  if (content.includes('howto-section')) score += 20;
  if (content.includes('statistics-section')) score += 15;
  
  // Medya elementleri
  if (content.includes('<img')) score += 10;
  if (content.includes('<video')) score += 15;
  
  // Yapısal elementler
  if (content.includes('<h2')) score += 5;
  if (content.includes('<h3')) score += 5;
  if (content.includes('<ul')) score += 5;
  if (content.includes('<ol')) score += 5;
  
  return Math.min(100, score);
}
