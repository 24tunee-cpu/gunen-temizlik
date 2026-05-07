'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown,
  Image as ImageIcon,
  Video,
  HelpCircle,
  ListOrdered,
  BarChart3,
  AlignLeft,
  Eye,
  EyeOff
} from 'lucide-react';

// Zengin içerik bloğu tipleri
export type RichBlockType = 
  | 'beforeAfter' 
  | 'video' 
  | 'faq' 
  | 'howTo' 
  | 'statistics' 
  | 'extendedContent';

// Zengin içerik bloğu arayüzü
export interface RichContentBlock {
  id: string;
  type: RichBlockType;
  title: string;
  content: string;
  secondaryContent?: string;
  items?: Array<{ question?: string; answer?: string; step?: string; title?: string; value?: string; label?: string }>;
  imageUrl?: string;
  videoUrl?: string;
  isActive: boolean;
  order: number;
}

// Blok tipi tanımlamaları
const BLOCK_TYPES: { 
  type: RichBlockType; 
  label: string; 
  description: string; 
  icon: any;
  defaultTitle: string;
}[] = [
  { 
    type: 'beforeAfter', 
    label: 'Before & After', 
    description: 'Öncesi/sonrası karşılaştırma',
    icon: ImageIcon,
    defaultTitle: 'Before & After - Temizlik Farkı'
  },
  { 
    type: 'video', 
    label: 'Video', 
    description: 'Video section ekle',
    icon: Video,
    defaultTitle: 'Video - Temizlik Sürecimiz'
  },
  { 
    type: 'faq', 
    label: 'FAQ', 
    description: 'Sıkça sorulan sorular',
    icon: HelpCircle,
    defaultTitle: 'Sıkça Sorulan Sorular'
  },
  { 
    type: 'howTo', 
    label: 'HowTo', 
    description: 'Adım adım rehber',
    icon: ListOrdered,
    defaultTitle: 'Nasıl Yapılır?'
  },
  { 
    type: 'statistics', 
    label: 'İstatistikler', 
    description: 'Sayısal veriler ve istatistikler',
    icon: BarChart3,
    defaultTitle: 'Güven İstatistiklerimiz'
  },
  { 
    type: 'extendedContent', 
    label: 'Ek İçerik', 
    description: 'Uzun metin bloğu ekle',
    icon: AlignLeft,
    defaultTitle: 'Detaylı Bilgiler'
  },
];

// Yeni blok ID oluştur
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Varsayılan blok oluştur
const createDefaultBlock = (type: RichBlockType): RichContentBlock => {
  const blockType = BLOCK_TYPES.find(b => b.type === type);
  
  const baseBlock: RichContentBlock = {
    id: generateId(),
    type,
    title: blockType?.defaultTitle || '',
    content: '',
    isActive: true,
    order: 0,
  };

  switch (type) {
    case 'beforeAfter':
      return {
        ...baseBlock,
        content: 'Tozlu, kirli ve bakımsız alanların öncesi hali...',
        secondaryContent: 'Parlak, hijyenik ve profesyonel temizlik sonrası hali...',
      };
    case 'video':
      return {
        ...baseBlock,
        videoUrl: '',
        content: 'Profesyonel temizlik sürecimizi bu videoda izleyebilirsiniz...',
      };
    case 'faq':
      return {
        ...baseBlock,
        items: [
          { question: 'Temizlik ne kadar sürer?', answer: 'Ortalama 2-3 saat sürer.' },
          { question: 'Kullandığınız malzemeler güvenli mi?', answer: 'Evet, T.C. Sağlık Bakanlığı onaylı ürünler kullanıyoruz.' },
        ],
      };
    case 'howTo':
      return {
        ...baseBlock,
        items: [
          { step: '1', title: 'Keşif ve Planlama', answer: 'Mekanı inceliyoruz ve plan yapıyoruz.' },
          { step: '2', title: 'Ekipman Hazırlığı', answer: 'Profesyonel ekipmanlarımızı hazırlıyoruz.' },
          { step: '3', title: 'Uygulama', answer: 'Uzman ekibimiz temizliği gerçekleştirir.' },
        ],
      };
    case 'statistics':
      return {
        ...baseBlock,
        items: [
          { value: '98%', label: 'Müşteri Memnuniyeti' },
          { value: '5000+', label: 'Mutlu Müşteri' },
          { value: '15+', label: 'Yıllık Tecrübe' },
        ],
      };
    case 'extendedContent':
      return {
        ...baseBlock,
        content: '15+ yıllık sektör tecrübemizle... (buraya uzun açıklama ekleyin)',
      };
    default:
      return baseBlock;
  }
};

interface RichContentBlocksProps {
  blocks: RichContentBlock[];
  onChange: (blocks: RichContentBlock[]) => void;
}

export function RichContentBlocks({ blocks, onChange }: RichContentBlocksProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  // Blok ekle
  const addBlock = (type: RichBlockType) => {
    const newBlock = createDefaultBlock(type);
    newBlock.order = blocks.length;
    onChange([...blocks, newBlock]);
    setExpandedBlock(newBlock.id);
  };

  // Blok sil
  const removeBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    // Order güncelle
    const reordered = filtered.map((b, index) => ({ ...b, order: index }));
    onChange(reordered);
  };

  // Blok güncelle
  const updateBlock = (id: string, updates: Partial<RichContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Yukarı taşı
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    newBlocks.forEach((b, i) => b.order = i);
    onChange(newBlocks);
  };

  // Aşağı taşı
  const moveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    newBlocks.forEach((b, i) => b.order = i);
    onChange(newBlocks);
  };

  // FAQ item ekle
  const addFaqItem = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    updateBlock(blockId, {
      items: [...(block.items || []), { question: 'Yeni soru?', answer: 'Cevap...' }]
    });
  };

  // FAQ item sil
  const removeFaqItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    updateBlock(blockId, {
      items: block.items?.filter((_, i) => i !== itemIndex)
    });
  };

  // FAQ item güncelle
  const updateFaqItem = (blockId: string, itemIndex: number, field: string, value: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const newItems = [...(block.items || [])];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    updateBlock(blockId, { items: newItems });
  };

  // HTML'e dönüştür (önizleme için)
  const generateHTML = (block: RichContentBlock): string => {
    switch (block.type) {
      case 'beforeAfter':
        return `<section class="before-after-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="before-section">
      <h3 class="text-lg font-semibold text-red-400 mb-3">🚫 Öncesi</h3>
      <p class="text-slate-300">${block.content}</p>
    </div>
    <div class="after-section">
      <h3 class="text-lg font-semibold text-emerald-400 mb-3">✅ Sonrası</h3>
      <p class="text-slate-300">${block.secondaryContent}</p>
    </div>
  </div>
</section>`;
      
      case 'video':
        return `<section class="video-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  ${block.videoUrl ? `<div class="aspect-video bg-slate-700 rounded-lg"><iframe src="${block.videoUrl}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>` : '<div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center"><p class="text-white">Video eklenecek</p></div>'}
  <p class="text-slate-300 mt-4">${block.content}</p>
</section>`;
      
      case 'faq':
        const faqItems = block.items?.map(item => `
    <div class="faq-item bg-slate-700/50 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-emerald-400 mb-2">${item.question}</h3>
      <p class="text-slate-300">${item.answer}</p>
    </div>`).join('') || '';
        return `<section class="faq-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="space-y-4">${faqItems}</div>
</section>`;
      
      case 'howTo':
        const howToItems = block.items?.map((item, index) => `
    <div class="step-item flex gap-4">
      <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">${item.step || index + 1}</div>
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">${item.title}</h3>
        <p class="text-slate-300">${item.answer}</p>
      </div>
    </div>`).join('') || '';
        return `<section class="howto-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="space-y-6">${howToItems}</div>
</section>`;
      
      case 'statistics':
        const statItems = block.items?.map(item => `
    <div class="stat-card bg-slate-700/50 rounded-lg p-4 text-center">
      <div class="text-3xl font-bold text-emerald-400 mb-2">${item.value}</div>
      <p class="text-white font-semibold">${item.label}</p>
    </div>`).join('') || '';
        return `<section class="statistics-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="grid md:grid-cols-3 gap-6">${statItems}</div>
</section>`;
      
      case 'extendedContent':
        return `<section class="extended-content bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  <div class="text-slate-300 space-y-4">${block.content}</div>
</section>`;
      
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Blok Ekleme Butonları */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/50">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-500" />
          Zengin İçerik Bloğu Ekle
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BLOCK_TYPES.map(({ type, label, description, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="flex flex-col items-start p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-600 dark:hover:border-emerald-400 dark:hover:bg-emerald-900/20 transition-all text-left"
            >
              <Icon className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="font-medium text-slate-900 dark:text-white text-sm">{label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mevcut Bloklar */}
      {blocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Eklenen Bloklar ({blocks.length})
          </h3>
          
          {blocks.map((block, index) => {
            const blockType = BLOCK_TYPES.find(b => b.type === block.type);
            const Icon = blockType?.icon || ImageIcon;
            const isExpanded = expandedBlock === block.id;
            
            return (
              <div 
                key={block.id}
                className={`rounded-xl border p-5 transition-all ${
                  block.isActive 
                    ? 'border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-800/50' 
                    : 'border-slate-200/50 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/30'
                }`}
              >
                {/* Blok Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      className="w-full text-base font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded px-2 py-1"
                      placeholder="Blok başlığı..."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">{blockType?.label}</p>
                  </div>
                  
                  {/* Blok Kontrolleri */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateBlock(block.id, { isActive: !block.isActive })}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                      title={block.isActive ? 'Gizle' : 'Göster'}
                    >
                      {block.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === blocks.length - 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      {isExpanded ? 'Kapat' : 'Düzenle'}
                    </button>
                    
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Genişletilmiş Blok İçeriği */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                    {/* Before/After */}
                    {block.type === 'beforeAfter' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Öncesi Açıklaması (Before)
                          </label>
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            rows={4}
                            placeholder="Temizlik öncesi durum..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Sonrası Açıklaması (After)
                          </label>
                          <textarea
                            value={block.secondaryContent || ''}
                            onChange={(e) => updateBlock(block.id, { secondaryContent: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            rows={4}
                            placeholder="Temizlik sonrası durum..."
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Video */}
                    {block.type === 'video' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Video URL (YouTube/Vimeo embed URL)
                          </label>
                          <input
                            type="url"
                            value={block.videoUrl || ''}
                            onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            placeholder="https://www.youtube.com/embed/VIDEO_ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Video Açıklaması
                          </label>
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            rows={3}
                            placeholder="Video hakkında açıklama..."
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* FAQ */}
                    {block.type === 'faq' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Soru-Cevap Listesi
                          </label>
                          <button
                            onClick={() => addFaqItem(block.id)}
                            className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                          >
                            <Plus className="w-4 h-4" /> Soru Ekle
                          </button>
                        </div>
                        {block.items?.map((item, itemIndex) => (
                          <div key={itemIndex} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <input
                                type="text"
                                value={item.question || ''}
                                onChange={(e) => updateFaqItem(block.id, itemIndex, 'question', e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                                placeholder="Soru..."
                              />
                              <button
                                onClick={() => removeFaqItem(block.id, itemIndex)}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={item.answer || ''}
                              onChange={(e) => updateFaqItem(block.id, itemIndex, 'answer', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                              rows={2}
                              placeholder="Cevap..."
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* HowTo */}
                    {block.type === 'howTo' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Adım Adım Rehber (3-5 adım önerilir)
                        </label>
                        {block.items?.map((item, itemIndex) => (
                          <div key={itemIndex} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                                {item.step || itemIndex + 1}
                              </span>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIndex] = { ...newItems[itemIndex], title: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                                placeholder="Adım başlığı..."
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items?.filter((_, i) => i !== itemIndex) || [];
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={item.answer || ''}
                              onChange={(e) => {
                                const newItems = [...(block.items || [])];
                                newItems[itemIndex] = { ...newItems[itemIndex], answer: e.target.value };
                                updateBlock(block.id, { items: newItems });
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                              rows={2}
                              placeholder="Adım açıklaması..."
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newItems = [...(block.items || []), { step: String((block.items?.length || 0) + 1), title: '', answer: '' }];
                            updateBlock(block.id, { items: newItems });
                          }}
                          className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        >
                          <Plus className="w-4 h-4" /> Adım Ekle
                        </button>
                      </div>
                    )}
                    
                    {/* Statistics */}
                    {block.type === 'statistics' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          İstatistik Kartları (3-6 kart önerilir)
                        </label>
                        <div className="grid md:grid-cols-3 gap-3">
                          {block.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                              <input
                                type="text"
                                value={item.value || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIndex] = { ...newItems[itemIndex], value: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="w-full text-center text-2xl font-bold text-emerald-500 bg-transparent border-b-2 border-emerald-500/30 focus:border-emerald-500 focus:outline-none py-1"
                                placeholder="98%"
                              />
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIndex] = { ...newItems[itemIndex], label: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="w-full text-center text-sm text-slate-700 dark:text-slate-300 bg-transparent border-none focus:outline-none"
                                placeholder="Müşteri Memnuniyeti"
                              />
                              <button
                                onClick={() => {
                                  const newItems = block.items?.filter((_, i) => i !== itemIndex) || [];
                                  updateBlock(block.id, { items: newItems });
                                }}
                                className="w-full p-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              >
                                Kaldır
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const newItems = [...(block.items || []), { value: '', label: '' }];
                            updateBlock(block.id, { items: newItems });
                          }}
                          className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        >
                          <Plus className="w-4 h-4" /> Kart Ekle
                        </button>
                      </div>
                    )}
                    
                    {/* Extended Content */}
                    {block.type === 'extendedContent' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Uzun Açıklama (HTML destekli)
                        </label>
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                          rows={8}
                          placeholder="Buraya uzun ve detaylı içerik ekleyin... HTML etiketleri kullanabilirsiniz."
                        />
                      </div>
                    )}
                    
                    {/* HTML Önizleme */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        HTML Çıktısı (Önizleme)
                      </label>
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                          {generateHTML(block)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Blokları HTML'e dönüştür (blog content'e eklemek için)
export function generateRichContentHTML(blocks: RichContentBlock[]): string {
  return blocks
    .filter(block => block.isActive)
    .sort((a, b) => a.order - b.order)
    .map(block => {
      // generateHTML fonksiyonunu dışarı taşıyalım
      switch (block.type) {
        case 'beforeAfter':
          return `<section class="before-after-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="before-section">
      <h3 class="text-lg font-semibold text-red-400 mb-3">🚫 Öncesi</h3>
      <p class="text-slate-300">${block.content}</p>
    </div>
    <div class="after-section">
      <h3 class="text-lg font-semibold text-emerald-400 mb-3">✅ Sonrası</h3>
      <p class="text-slate-300">${block.secondaryContent}</p>
    </div>
  </div>
</section>`;
        
        case 'video':
          return `<section class="video-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  ${block.videoUrl ? `<div class="aspect-video bg-slate-700 rounded-lg"><iframe src="${block.videoUrl}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>` : '<div class="aspect-video bg-slate-700 rounded-lg flex items-center justify-center"><p class="text-white">Video eklenecek</p></div>'}
  <p class="text-slate-300 mt-4">${block.content}</p>
</section>`;
        
        case 'faq':
          const faqItems = block.items?.map(item => `
    <div class="faq-item bg-slate-700/50 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-emerald-400 mb-2">${item.question}</h3>
      <p class="text-slate-300">${item.answer}</p>
    </div>`).join('') || '';
          return `<section class="faq-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="space-y-4">${faqItems}</div>
</section>`;
        
        case 'howTo':
          const howToItems = block.items?.map((item, index) => `
    <div class="step-item flex gap-4">
      <div class="step-number bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">${item.step || index + 1}</div>
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">${item.title}</h3>
        <p class="text-slate-300">${item.answer}</p>
      </div>
    </div>`).join('') || '';
          return `<section class="howto-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="space-y-6">${howToItems}</div>
</section>`;
        
        case 'statistics':
          const statItems = block.items?.map(item => `
    <div class="stat-card bg-slate-700/50 rounded-lg p-4 text-center">
      <div class="text-3xl font-bold text-emerald-400 mb-2">${item.value}</div>
      <p class="text-white font-semibold">${item.label}</p>
    </div>`).join('') || '';
          return `<section class="statistics-section bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-6">${block.title}</h2>
  <div class="grid md:grid-cols-3 gap-6">${statItems}</div>
</section>`;
        
        case 'extendedContent':
          return `<section class="extended-content bg-slate-800/50 rounded-xl p-6 my-8">
  <h2 class="text-2xl font-bold text-white mb-4">${block.title}</h2>
  <div class="text-slate-300 space-y-4">${block.content}</div>
</section>`;
        
        default:
          return '';
      }
    })
    .join('\n\n');
}
