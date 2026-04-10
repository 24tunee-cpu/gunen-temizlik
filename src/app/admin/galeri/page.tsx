'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  Grid,
  List,
  ExternalLink,
  Upload,
  Folder
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/store/toastStore';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const categories = ['Tümü', 'Temizlik Öncesi/Sonrası', 'Ofis', 'Ev', 'Endüstriyel', 'Diğer'];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    description: '',
    image: '',
    category: 'Temizlik Öncesi/Sonrası',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Failed to fetch gallery');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gallery', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Galeri yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, image: url }));
        toast.success('Yukleme Basarili', 'Gorsel basariyla yuklendi.');
      } else {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.error || 'Gorsel yuklenirken bir hata olustu.';
        toast.error('Yukleme Hatasi', errorMessage);
      }
    } catch (error) {
      console.error('Upload error', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Gorsel yuklenirken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.image) {
      toast.error('Validasyon Hatasi', 'Lutfen bir gorsel secin.');
      return;
    }
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Validasyon Hatasi', 'Baslik alani zorunludur.');
      return;
    }
    if (!formData.category) {
      toast.error('Validasyon Hatasi', 'Kategori secimi zorunludur.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gallery', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...formData, id: editingItem.id } : formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Gorsel kaydedilirken bir hata olustu.';

        if (res.status === 400) {
          errorMessage = errorData?.error || 'Gecersiz veri formati. Lutfen alanlari kontrol edin.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lutfen giris yapin.';
        } else if (res.status === 409) {
          errorMessage = 'Bu baslikta bir gorsel zaten mevcut.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi olustu. Lutfen daha sonra tekrar deneyin.';
        }

        throw new Error(errorMessage);
      }

      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      toast.success('Basarili', editingItem ? 'Gorsel guncellendi.' : 'Yeni gorsel eklendi.');
    } catch (error) {
      console.error('Error saving gallery item', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Gorsel kaydedilirken bir hata olustu.';
      toast.error('Kaydetme Hatasi', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Gorsel silinirken bir hata olustu.';

        if (res.status === 404) {
          errorMessage = 'Silinecek gorsel bulunamadi.';
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
      fetchItems();
      toast.success('Silindi', 'Gorsel basariyla silindi.');
    } catch (error) {
      console.error('Error deleting gallery item', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Gorsel silinirken bir hata olustu.';
      toast.error('Silme Hatasi', errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      category: 'Temizlik Öncesi/Sonrası',
      isActive: true,
    });
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Galeri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Çalışma görsellerinizi yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-700'}`}
            >
              <Grid className="h-4 w-4 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'hover:bg-white dark:hover:bg-slate-700'}`}
            >
              <List className="h-4 w-4 dark:text-slate-300" />
            </button>
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
            Yeni Görsel
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Görsel</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{items.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {items.filter(i => i.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Kategori</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {new Set(items.map(i => i.category)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Bu Ay Eklenen</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {items.filter(i => new Date(i.createdAt).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Görsel ara..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-xl border dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          {categories.map(cat => <option key={cat} value={cat} className="dark:bg-slate-800">{cat}</option>)}
        </select>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700 ${!item.isActive ? 'opacity-60' : ''
                }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    aria-label="Gorseli duzenle"
                    className="p-3 bg-white rounded-full text-slate-700 hover:bg-emerald-50 transition-colors"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    aria-label="Gorseli sil"
                    className="p-3 bg-white rounded-full text-slate-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {!item.isActive && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-slate-900/70 text-white text-xs rounded-full">
                    Taslak
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium truncate dark:text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Görsel</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Başlık</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Kategori</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Durum</th>
                  <th className="px-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium dark:text-slate-100">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                        {item.isActive ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          aria-label="Gorseli duzenle"
                          className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(item.id)}
                          aria-label="Gorseli sil"
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Henüz görsel eklenmemiş</h3>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            İlk görseli ekle
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
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingItem ? 'Görseli Düzenle' : 'Yeni Görsel Ekle'}
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
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Görsel</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                    {formData.image ? (
                      <div className="relative w-full h-48 mb-4">
                        <Image src={formData.image} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center mb-4">
                        <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                      id="gallery-upload"
                    />
                    <label
                      htmlFor="gallery-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {uploading ? (
                        <><Loader2 className="animate-spin h-4 w-4" /> Yükleniyor...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Görsel Seç</>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Başlık</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="Görsel başlığı..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                    placeholder="Kısa açıklama..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    {categories.filter(c => c !== 'Tümü').map(cat => (
                      <option key={cat} value={cat} className="dark:bg-slate-700">{cat}</option>
                    ))}
                  </select>
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
                    disabled={isSubmitting || !formData.image}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
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
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Görseli Sil</h3>
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
                  aria-label="Gorseli sil"
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
