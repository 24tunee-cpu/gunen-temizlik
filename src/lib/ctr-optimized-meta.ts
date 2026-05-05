/**
 * CTR Optimizasyonu için Meta Başlık ve Açıklama Fonksiyonları
 * Clickbait + Profesyonel + Lokal SEO optimizasyonları
 * Mevcut sistemi bozmadan, sadece yeni özellikler ekler
 */

const TITLE_MAX = 58;
const DESC_MAX = 155;
const TITLE_SUFFIX = ' | Günen Temizlik';

// CTR artışı için emoji ve dikkat çekici elementler
const CTR_ELEMENTS = {
  pricing: ['💰', '💵', '₺', '💸', '🏷️'],
  quality: ['✅', '🏆', '⭐', '👑', '🔥'],
  urgency: ['🚀', '⚡', '📞', '📱', '🏃'],
  trust: ['🛡️', '🔒', '✨', '💎', '🎯'],
  location: ['📍', '🏢', '🏠', '🏘️', '🌆']
};

// İstanbul ilçeleri için lokal SEO
const ISTANBUL_KEYWORDS = [
  'İstanbul', 'Avrupa Yakası', 'Anadolu Yakası', 'Kadıköy', 'Beşiktaş', 'Şişli',
  'Ataşehir', 'Üsküdar', 'Bakırköy', 'Maltepe', 'Pendik', 'Kartal'
];

/**
 * İçerik türüne göre CTR elementi seç
 */
function selectCTRElement(content: string, category: string): string {
  const lowerContent = content.toLowerCase();
  const lowerCategory = category.toLowerCase();

  // Fiyat içeriyorsa
  if (lowerContent.includes('fiyat') || lowerContent.includes('₺') || lowerContent.includes('tl')) {
    return CTR_ELEMENTS.pricing[Math.floor(Math.random() * CTR_ELEMENTS.pricing.length)];
  }

  // Kalite ve garanti içeriyorsa
  if (lowerContent.includes('garanti') || lowerContent.includes('kalite') || lowerContent.includes('profesyonel')) {
    return CTR_ELEMENTS.quality[Math.floor(Math.random() * CTR_ELEMENTS.quality.length)];
  }

  // Aciliyet içeriyorsa
  if (lowerContent.includes('acil') || lowerContent.includes('hemen') || lowerContent.includes('bugün')) {
    return CTR_ELEMENTS.urgency[Math.floor(Math.random() * CTR_ELEMENTS.urgency.length)];
  }

  // Lokasyon içeriyorsa
  if (ISTANBUL_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
    return CTR_ELEMENTS.location[Math.floor(Math.random() * CTR_ELEMENTS.location.length)];
  }

  // Varsayılan kalite elementi
  return CTR_ELEMENTS.quality[Math.floor(Math.random() * CTR_ELEMENTS.quality.length)];
}

/**
 * Telefon numarası ekle (varsa)
 */
function extractPhone(content: string): string | null {
  const phoneRegex = /0?(\d{3})\s*(\d{3})\s*(\d{2})\s*(\d{2})/g;
  const match = content.match(phoneRegex);
  return match ? match[0].replace(/\s/g, '') : null;
}

/**
 * Fiyat bilgisi çıkar
 */
function extractPrice(content: string): string | null {
  const priceRegex = /(\d+)\s*(?:₺|TL|tl)/gi;
  const match = content.match(priceRegex);
  return match ? match[0] : null;
}

/**
 * CTR optimize edilmiş başlık oluştur
 */
export function createCTROptimizedTitle(
  title: string,
  category: string,
  content: string,
  originalTitle?: string | null
): string {
  // Eğer zaten CTR optimize edilmiş bir title varsa koru
  if (originalTitle && (originalTitle.includes('💰') || originalTitle.includes('✅') || originalTitle.includes('🚀'))) {
    return originalTitle.length <= TITLE_MAX ? originalTitle : originalTitle.slice(0, TITLE_MAX - 1) + '…';
  }

  const phone = extractPhone(content);
  const price = extractPrice(content);
  const element = selectCTRElement(content, category);

  let optimizedTitle = title;

  // Element'i başa ekle
  optimizedTitle = `${element} ${optimizedTitle}`;

  // Telefon varsa ekle
  if (phone && optimizedTitle.length + phone.length + 3 <= TITLE_MAX) {
    optimizedTitle += ` | ${phone}`;
  }

  // Fiyat varsa ekle
  if (price && optimizedTitle.length + price.length + 3 <= TITLE_MAX) {
    optimizedTitle += ` | ${price}`;
  }

  // Lokasyon ekle
  const location = ISTANBUL_KEYWORDS.find(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  if (location && optimizedTitle.length + location.length + 3 <= TITLE_MAX) {
    optimizedTitle += ` | ${location}`;
  }

  // Suffix'i ekle
  if (optimizedTitle.length + TITLE_SUFFIX.length <= TITLE_MAX) {
    optimizedTitle += TITLE_SUFFIX;
  } else {
    // Suffix sığmıyorsa başlığı kısalt
    const maxLength = TITLE_MAX - TITLE_SUFFIX.length - 1;
    if (optimizedTitle.length > maxLength) {
      optimizedTitle = optimizedTitle.slice(0, Math.max(10, maxLength)).trimEnd() + '…';
    }
    optimizedTitle += TITLE_SUFFIX;
  }

  return optimizedTitle;
}

/**
 * CTR optimize edilmiş açıklama oluştur
 */
export function createCTROptimizedDescription(
  excerpt: string,
  title: string,
  category: string,
  originalDesc?: string | null
): string {
  // Eğer zaten CTR optimize edilmiş bir açıklama varsa koru
  if (originalDesc && (originalDesc.includes('✅') || originalDesc.includes('🏆') || originalDesc.includes('📞'))) {
    return originalDesc.length <= DESC_MAX ? originalDesc : originalDesc.slice(0, DESC_MAX - 1) + '…';
  }

  let optimizedDesc = excerpt;

  // Başta güven elementi ekle
  optimizedDesc = `✅ ${optimizedDesc}`;

  // Hız ve garanti vurgusu ekle
  if (!optimizedDesc.includes('garanti') && !optimizedDesc.includes('hız')) {
    optimizedDesc = `${optimizedDesc} • Garantili Hizmet`;
  }

  // İletişim çağrısı ekle
  if (!optimizedDesc.includes('ara') && !optimizedDesc.includes('iletişim')) {
    optimizedDesc = `${optimizedDesc} • Hemen Ara!`;
  }

  // Uzunluk kontrolü
  if (optimizedDesc.length > DESC_MAX) {
    optimizedDesc = optimizedDesc.slice(0, DESC_MAX - 1) + '…';
  }

  return optimizedDesc;
}

/**
 * Blog yazısı için CTR optimize edilmiş meta oluştur
 */
export function generateCTROptimizedBlogMeta(
  title: string,
  excerpt: string,
  category: string,
  content: string,
  existingMetaTitle?: string | null,
  existingMetaDesc?: string | null
) {
  const optimizedTitle = createCTROptimizedTitle(title, category, content, existingMetaTitle);
  const optimizedDesc = createCTROptimizedDescription(excerpt, title, category, existingMetaDesc);

  return {
    title: optimizedTitle,
    description: optimizedDesc
  };
}
