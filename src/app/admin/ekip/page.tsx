'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  Loader2,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  User
} from 'lucide-react';
import Image from 'next/image';
import logger from '@/lib/logger';
import { toast } from '@/store/toastStore';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    position: '',
    bio: '',
    image: '',
    phone: '',
    email: '',
    linkedin: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching team', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Ekip uyeleri yuklenirken bir hata olustu.');
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
      logger.error('Upload error', {}, error instanceof Error ? error : undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: editingMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember ? { ...formData, id: editingMember.id } : formData),
      });

      if (!res.ok) throw new Error('Failed to save team member');

      setIsModalOpen(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
      toast.success('Basarili', editingMember ? 'Ekip uyesi guncellendi.' : 'Yeni ekip uyesi eklendi.');
    } catch (error) {
      logger.error('Error saving team member', {}, error instanceof Error ? error : undefined);
      toast.error('Kaydetme Hatasi', 'Ekip uyesi kaydedilirken bir hata olustu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete team member');
      setShowDeleteConfirm(null);
      fetchMembers();
      toast.success('Silindi', 'Ekip uyesi basariyla silindi.');
    } catch (error) {
      logger.error('Error deleting team member', {}, error instanceof Error ? error : undefined);
      toast.error('Silme Hatasi', 'Ekip uyesi silinirken bir hata olustu.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      bio: '',
      image: '',
      phone: '',
      email: '',
      linkedin: '',
      isActive: true,
    });
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData(member);
    setIsModalOpen(true);
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.position?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ekibimiz</h1>
          <p className="mt-1 text-sm text-slate-500">Takım üyelerinizi yönetin</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingMember(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          Yeni Üye Ekle
        </motion.button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Üye</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{members.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {members.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yönetici</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {members.filter(m => m.position?.toLowerCase().includes('yönetici') || m.position?.toLowerCase().includes('müdür')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Temizlik Ekibi</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {members.filter(m => m.position?.toLowerCase().includes('temizlik') || m.position?.toLowerCase().includes('personel')).length}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İsim veya pozisyon ara..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMembers.map((member) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border dark:border-slate-700 ${!member.isActive ? 'opacity-60' : ''
              }`}
          >
            <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-700">
              {member.image ? (
                <Image src={member.image} alt={member.name} fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <User className="h-20 w-20 text-emerald-300" />
                </div>
              )}
              {!member.isActive && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-slate-900/70 text-white text-xs rounded-full">
                  Taslak
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg dark:text-slate-100">{member.name}</h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-3">{member.position}</p>

              {member.bio && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{member.bio}</p>
              )}

              <div className="flex items-center gap-3 mb-4">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                    <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                    <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </a>
                )}
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                    <ExternalLink className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <button
                  onClick={() => openEditModal(member)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(member.id)}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Henüz üye eklenmemiş</h3>
          <button
            onClick={() => {
              setEditingMember(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            İlk üyeyi ekle
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
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingMember ? 'Üyeyi Düzenle' : 'Yeni Üye Ekle'}
                </h2>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)}>
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Fotoğraf</label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                      {formData.image ? (
                        <Image src={formData.image} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <User className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                        id="team-upload"
                      />
                      <label
                        htmlFor="team-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 dark:text-slate-200"
                      >
                        {uploading ? (
                          <><Loader2 className="animate-spin h-4 w-4" /> Yükleniyor...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Fotoğraf Seç</>
                        )}
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="block mt-2 text-sm text-red-500 dark:text-red-400 hover:underline"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">İsim Soyisim</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Pozisyon</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="Operasyon Müdürü"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Biyografi</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                    placeholder="Kısa biyografi..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="0555 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">E-posta</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="ahmet@gunentemizlik.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-600"
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
                      <><Check className="h-5 w-5" /> {editingMember ? 'Güncelle' : 'Ekle'}</>
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
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Üyeyi Sil</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 border dark:border-slate-600 rounded-xl font-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
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
