'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Package,
  Loader2,
  Tag,
  Calculator
} from 'lucide-react';
import { toast } from '@/store/toastStore';

interface Pricing {
  id: string;
  serviceName: string;
  basePrice: number;
  pricePerSqm?: number;
  unit: string;
  minPrice?: number;
  description?: string;
  features: string[];
  isActive: boolean;
  order: number;
}

export default function PricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState<Partial<Pricing>>({
    serviceName: '',
    basePrice: 0,
    pricePerSqm: undefined,
    unit: 'm²',
    minPrice: undefined,
    description: '',
    features: [],
    isActive: true,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/pricing');
      if (!res.ok) throw new Error('Failed to fetch pricing');
      const data = await res.json();
      setPricing(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pricing', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Fiyat listesi yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.serviceName?.trim()) {
      toast.error('Validasyon Hatasi', 'Hizmet adi gereklidir.');
      return;
    }
    if (formData.serviceName.trim().length < 2) {
      toast.error('Validasyon Hatasi', 'Hizmet adi en az 2 karakter olmalidir.');
      return;
    }
    if (!formData.basePrice || formData.basePrice <= 0) {
      toast.error('Validasyon Hatasi', 'Baslangic fiyati 0\'dan buyuk olmalidir.');
      return;
    }
    if (formData.basePrice > 999999) {
      toast.error('Validasyon Hatasi', 'Fiyat cok yuksek.');
      return;
    }
    if (formData.minPrice && formData.basePrice && formData.minPrice > formData.basePrice) {
      toast.error('Validasyon Hatasi', 'Minimum fiyat baslangic fiyatindan buyuk olamaz.');
      return;
    }
    if (formData.pricePerSqm && formData.pricePerSqm < 0) {
      toast.error('Validasyon Hatasi', 'm2 basina fiyat negatif olamaz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pricing', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...formData, id: editingItem.id } : formData),
      });

      if (!res.ok) throw new Error('Failed to save pricing');

      setIsModalOpen(false);
      resetForm();
      fetchPricing();
      toast.success('Basarili', editingItem ? 'Fiyat guncellendi.' : 'Yeni fiyat eklendi.');
    } catch (error) {
      console.error('Error saving pricing', {}, error instanceof Error ? error : undefined);

      let errorMessage = 'Fiyat kaydedilirken bir hata olustu.';
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Internet baglantinizi kontrol edin.';
        } else if (error.message.includes('409') || error.message.includes('Conflict')) {
          errorMessage = 'Bu hizmet adi zaten kullanimda.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Gecersiz veri. Lutfen alanlari kontrol edin.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Yetkiniz yok. Lutfen tekrar giris yapin.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Sunucu hatasi. Lutfen daha sonra tekrar deneyin.';
        }
      }

      toast.error('Kayit Hatasi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pricing/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete pricing');
      setShowDeleteConfirm(null);
      fetchPricing();
      toast.success('Silindi', 'Fiyat basariyla silindi.');
    } catch (error) {
      console.error('Error deleting pricing', {}, error instanceof Error ? error : undefined);
      toast.error('Silme Hatasi', 'Fiyat silinirken bir hata olustu.');
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      basePrice: 0,
      pricePerSqm: undefined,
      unit: 'm²',
      minPrice: undefined,
      description: '',
      features: [],
      isActive: true,
    });
    setFeatureInput('');
  };

  const openEditModal = (item: Pricing) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const filteredPricing = pricing.filter(p =>
    p.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fiyat Listesi</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hizmet fiyatlarınızı yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          Yeni Fiyat Ekle
        </motion.button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Fiyat</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{pricing.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {pricing.filter(p => p.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Ort. Başlangıç</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {pricing.length > 0
              ? Math.round(pricing.reduce((acc, p) => acc + p.basePrice, 0) / pricing.length)
              : 0} TL
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">En Düşük</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {pricing.length > 0
              ? Math.min(...pricing.map(p => p.minPrice || p.basePrice))
              : 0} TL
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hizmet ara..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPricing.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700 ${!item.isActive ? 'opacity-60' : ''
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <Tag className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(item.id)}
                  aria-label="Fiyati sil"
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">{item.serviceName}</h3>
            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{item.description}</p>
            )}

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-emerald-600">{item.basePrice} TL</span>
              <span className="text-sm text-slate-400 dark:text-slate-500">başlangıç</span>
            </div>

            {item.pricePerSqm && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                +{item.pricePerSqm} TL / {item.unit}
              </p>
            )}

            {item.features.length > 0 && (
              <ul className="space-y-1 mb-4">
                {item.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    {feature}
                  </li>
                ))}
                {item.features.length > 3 && (
                  <li className="text-sm text-slate-400 dark:text-slate-500">+{item.features.length - 3} daha</li>
                )}
              </ul>
            )}

            <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                {item.isActive ? 'Yayında' : 'Gizli'}
              </span>
              {item.minPrice && (
                <span className="text-sm text-slate-500 dark:text-slate-400">Min: {item.minPrice} TL</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPricing.length === 0 && (
        <div className="text-center py-16">
          <Calculator className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Henüz fiyat eklenmemiş</h3>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            İlk fiyatı ekle
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingItem ? 'Fiyatı Düzenle' : 'Yeni Fiyat Ekle'}
                </h2>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)}>
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Hizmet Adı</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Örn: Ofis Temizliği"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Başlangıç Fiyatı (TL)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Minimum Fiyat (TL)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minPrice || ''}
                      onChange={(e) => setFormData({ ...formData, minPrice: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">m² Başına Fiyat (Opsiyonel)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pricePerSqm || ''}
                      onChange={(e) => setFormData({ ...formData, pricePerSqm: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Birim</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    >
                      <option value="m²">m²</option>
                      <option value="adet">adet</option>
                      <option value="saat">saat</option>
                      <option value="oda">oda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                    placeholder="Hizmet açıklaması..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Özellikler</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="Özellik ekle..."
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium dark:text-slate-300">Yayında göster</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 border dark:border-slate-600 rounded-xl font-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Kaydediliyor...</>
                    ) : (
                      <><Check className="h-5 w-5" /> {editingItem ? 'Güncelle' : 'Ekle'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Fiyatı Sil</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  aria-label="Iptal et"
                  className="flex-1 py-2 border dark:border-slate-600 rounded-xl font-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  aria-label="Fiyati sil"
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}