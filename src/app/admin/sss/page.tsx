'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/store/toastStore';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const categories = ['Genel', 'Hizmetler', 'Fiyatlandırma', 'Rezervasyon', 'Güvenlik'];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Genel',
    isActive: true,
    order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const res = await fetch('/api/faq');
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching FAQs', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'SSS listesi yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.question.trim()) errors.question = 'Soru gereklidir';
    if (!formData.answer.trim()) errors.answer = 'Cevap gereklidir';
    if (formData.answer.length < 10) errors.answer = 'Cevap en az 10 karakter olmalıdır';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/faq', {
        method: editingFAQ ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFAQ ? { ...formData, id: editingFAQ.id } : formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'SSS kaydedilirken bir hata olustu.';

        if (res.status === 400) {
          errorMessage = errorData?.error || 'Gecersiz veri formati. Lutfen alanlari kontrol edin.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lutfen giris yapin.';
        } else if (res.status === 409) {
          errorMessage = 'Bu soru zaten mevcut.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        }

        throw new Error(errorMessage);
      }

      setIsModalOpen(false);
      setEditingFAQ(null);
      resetForm();
      fetchFAQs();
      toast.success('Basarili', editingFAQ ? 'SSS guncellendi.' : 'Yeni SSS eklendi.');
    } catch (error) {
      console.error('Error saving FAQ', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'SSS kaydedilirken bir hata olustu.';
      toast.error('Kaydetme Hatasi', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/faq/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'SSS silinirken bir hata olustu.';

        if (res.status === 404) {
          errorMessage = 'Silinecek SSS bulunamadi.';
        } else if (res.status === 401) {
          errorMessage = 'Silme yetkiniz bulunmuyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }
      setShowDeleteConfirm(null);
      fetchFAQs();
      toast.success('Silindi', 'SSS basariyla silindi.');
    } catch (error) {
      console.error('Error deleting FAQ', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'SSS silinirken bir hata olustu.';
      toast.error('Silme Hatasi', errorMsg);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch('/api/faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...faq, isActive: !faq.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update FAQ');
      fetchFAQs();
    } catch (error) {
      console.error('Error updating FAQ', {}, error instanceof Error ? error : undefined);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'Genel',
      isActive: true,
      order: faqs.length,
    });
    setFormErrors({});
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
      order: faq.order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sıkça Sorulan Sorular</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Müşterilerinizin sıkça sorduğu soruları yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingFAQ(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Soru Ekle
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Soru</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{faqs.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {faqs.filter(f => f.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Kategori</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {new Set(faqs.map(f => f.category)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Taslak</p>
          <p className="mt-2 text-3xl font-bold text-slate-600">
            {faqs.filter(f => !f.isActive).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Soru veya cevap ara..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-xl border dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map(cat => (
            <option key={cat} value={cat} className="dark:bg-slate-800">{cat}</option>
          ))}
        </select>
      </div>

      {/* FAQ List by Category */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([category, categoryFaqs]) => (
          <div key={category} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 border-b dark:border-slate-600">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">{category}</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">{categoryFaqs.length} soru</span>
            </div>
            <div className="divide-y">
              {categoryFaqs.map((faq) => (
                <div key={faq.id} className={`p-6 ${!faq.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      className="mt-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      {expandedId === faq.id ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{faq.question}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(faq)}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${faq.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                          >
                            {faq.isActive ? 'Yayında' : 'Taslak'}
                          </button>
                          <button
                            onClick={() => openEditModal(faq)}
                            aria-label="SSS duzenle"
                            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(faq.id)}
                            aria-label="SSS sil"
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedId === faq.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 text-slate-600 dark:text-slate-300"
                          >
                            {faq.answer}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Henüz soru eklenmemiş</h3>
          <button
            onClick={() => {
              setEditingFAQ(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            İlk soruyu ekle
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
              className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingFAQ ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
                </h2>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Soru</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => {
                      setFormData({ ...formData, question: e.target.value });
                      if (formErrors.question) setFormErrors({ ...formErrors, question: '' });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600 ${formErrors.question ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Soruyu yazın..."
                  />
                  {formErrors.question && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.question}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cevap</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => {
                      setFormData({ ...formData, answer: e.target.value });
                      if (formErrors.answer) setFormErrors({ ...formErrors, answer: '' });
                    }}
                    rows={5}
                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none dark:bg-slate-800 dark:border-slate-600 ${formErrors.answer ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Cevabı yazın..."
                  />
                  {formErrors.answer && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {formErrors.answer}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-emerald-500 dark:checked:border-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium dark:text-slate-300">Yayında göster</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Kaydediliyor...</>
                    ) : (
                      <><Check className="h-5 w-5" /> {editingFAQ ? 'Güncelle' : 'Ekle'}</>
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
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Soruyu Sil</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  aria-label="Iptal et"
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  aria-label="SSS sil"
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
