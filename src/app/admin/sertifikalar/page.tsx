'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  Upload,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { toast } from '@/store/toastStore';

interface Certificate {
  id: string;
  title: string;
  description?: string;
  image: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  credentialUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState<Partial<Certificate>>({
    title: '',
    description: '',
    image: '',
    issuer: '',
    date: '',
    expiryDate: '',
    credentialUrl: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/certificates');
      if (!res.ok) throw new Error('Failed to fetch certificates');
      const data = await res.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching certificates', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Sertifikalar yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, image: url }));
      }
    } catch (error) {
      console.error('Upload error', {}, error instanceof Error ? error : undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/certificates', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...formData, id: editingItem.id } : formData),
      });

      if (!res.ok) throw new Error('Failed to save certificate');

      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchCertificates();
      toast.success('Basarili', editingItem ? 'Sertifika guncellendi.' : 'Yeni sertifika eklendi.');
    } catch (error) {
      console.error('Error saving certificate', {}, error instanceof Error ? error : undefined);
      toast.error('Kaydetme Hatasi', 'Sertifika kaydedilirken bir hata olustu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete certificate');
      setShowDeleteConfirm(null);
      fetchCertificates();
      toast.success('Silindi', 'Sertifika basariyla silindi.');
    } catch (error) {
      console.error('Error deleting certificate', {}, error instanceof Error ? error : undefined);
      toast.error('Silme Hatasi', 'Sertifika silinirken bir hata olustu.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialUrl: '',
      isActive: true,
    });
  };

  const openEditModal = (item: Certificate) => {
    setEditingItem(item);
    setFormData({
      ...item,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const filteredCertificates = certificates.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.issuer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sertifikalar</h1>
          <p className="mt-1 text-sm text-slate-500">Sertifikalarınızı ve belgelerinizi yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Sertifika
        </motion.button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Sertifika</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{certificates.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {certificates.filter(c => c.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Geçerli</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {certificates.filter(c => !c.expiryDate || new Date(c.expiryDate) > new Date()).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Süresi Dolan</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {certificates.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sertifika veya kurum ara..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCertificates.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border ${!cert.isActive ? 'opacity-60' : ''
              }`}
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-yellow-50 to-yellow-100">
              {cert.image ? (
                <Image src={cert.image} alt={cert.title} fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Award className="h-16 w-16 text-yellow-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <button
                  onClick={() => openEditModal(cert)}
                  aria-label="Sertifikayi duzenle"
                  className="p-3 bg-white rounded-full text-slate-700 hover:bg-emerald-50 transition-colors"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(cert.id)}
                  aria-label="Sertifikayi sil"
                  className="p-3 bg-white rounded-full text-slate-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              {!cert.isActive && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-slate-900/70 text-white text-xs rounded-full">
                  Taslak
                </span>
              )}
              {cert.expiryDate && new Date(cert.expiryDate) < new Date() && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  Süresi Doldu
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-semibold line-clamp-1 mb-1 dark:text-slate-100">{cert.title}</h3>
              {cert.issuer && (
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                  <Building2 className="h-3 w-3" />
                  {cert.issuer}
                </p>
              )}
              {cert.date && (
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(cert.date).toLocaleDateString('tr-TR')}
                  {cert.expiryDate && ` - ${new Date(cert.expiryDate).toLocaleDateString('tr-TR')}`}
                </p>
              )}
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Doğrula
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCertificates.length === 0 && (
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Henüz sertifika eklenmemiş</h3>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            İlk sertifikayı ekle
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
              className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingItem ? 'Sertifikayı Düzenle' : 'Yeni Sertifika Ekle'}
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
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Sertifika Görseli</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
                    {formData.image ? (
                      <div className="relative w-full h-40 mb-4">
                        <Image src={formData.image} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center mb-4">
                        <Award className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                      id="cert-upload"
                    />
                    <label
                      htmlFor="cert-upload"
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
                  <label className="block text-sm font-medium mb-2">Sertifika Adı</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                    placeholder="ISO 9001:2015"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kurum / Veren</label>
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                    placeholder="TSE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none dark:bg-slate-800 dark:border-slate-600"
                    placeholder="Sertifika açıklaması..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Alınma Tarihi</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bitiş Tarihi (Opsiyonel)</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Doğrulama URL</label>
                  <input
                    type="url"
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-600"
                    placeholder="https://..."
                  />
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
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Sertifikayı Sil</h3>
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
                  aria-label="Sertifikayi sil"
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
