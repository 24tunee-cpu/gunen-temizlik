'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  User,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Grid,
  List,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  image?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const defaultForm = () => ({
  name: '',
  role: '',
  bio: '',
  image: '',
  phone: '',
  email: '',
  linkedin: '',
  isActive: true,
  order: 0,
});

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/team', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Ekip üyeleri yüklenirken bir hata oluştu.';
        if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lütfen giriş yapın.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setMembers([]);
        return;
      }
      setMembers(
        data.map((m: TeamMember) => ({
          ...m,
          role: m.role ?? '',
        }))
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ekip üyeleri yüklenirken hata oluştu.';
      console.error('Error fetching team', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error(msg), { context: 'admin-team' });
      setLoadError(msg);
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const stats = useMemo(() => {
    const active = members.filter((m) => m.isActive).length;
    const passive = members.length - active;
    const n = new Date();
    const thisMonth = members.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    return { active, passive, thisMonth };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.bio?.toLowerCase().includes(q) ?? false) ||
        (m.email?.toLowerCase().includes(q) ?? false) ||
        (m.phone?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'inactive' && !m.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: members.length,
      active: stats.active,
      inactive: stats.passive,
    }),
    [members.length, stats.active, stats.passive]
  );

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (res.ok) {
        const { url } = await res.json();
        setFormData((prev) => ({ ...prev, image: url }));
        toast.success('Yükleme başarılı', 'Fotoğraf yüklendi.');
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error('Yükleme hatası', errorData?.error || 'Dosya yüklenemedi.');
      }
    } catch (error) {
      console.error('Upload error', {}, error instanceof Error ? error : undefined);
      trackError(error instanceof Error ? error : new Error('team-upload'), { context: 'admin-team-upload' });
      toast.error('Yükleme hatası', 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Doğrulama', 'İsim zorunludur.');
      return;
    }
    if (!formData.role?.trim()) {
      toast.error('Doğrulama', 'Pozisyon zorunludur.');
      return;
    }

    const orderNum = Number(formData.order);
    const order = Number.isFinite(orderNum) ? orderNum : 0;

    const payload = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      bio: formData.bio?.trim() || null,
      image: formData.image?.trim() || null,
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      linkedin: formData.linkedin?.trim() || null,
      isActive: formData.isActive,
      order,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: editingMember ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember ? { ...payload, id: editingMember.id } : payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Kayıt sırasında bir hata oluştu.';
        if (res.status === 400) {
          errorMessage = errorData?.error || 'Geçersiz veri. Alanları kontrol edin.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor. Lütfen giriş yapın.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }

      setIsModalOpen(false);
      setEditingMember(null);
      setFormData(defaultForm());
      void fetchMembers();
      toast.success('Başarılı', editingMember ? 'Ekip üyesi güncellendi.' : 'Yeni ekip üyesi eklendi.');
    } catch (error) {
      console.error('Error saving team member', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.';
      toast.error('Kaydetme hatası', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Silme işlemi başarısız.';
        if (res.status === 404) {
          errorMessage = 'Üye bulunamadı.';
        } else if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }
      setShowDeleteConfirm(null);
      void fetchMembers();
      toast.success('Silindi', 'Ekip üyesi kaldırıldı.');
    } catch (error) {
      console.error('Error deleting team member', {}, error instanceof Error ? error : undefined);
      const errorMsg = error instanceof Error ? error.message : 'Silme işlemi başarısız.';
      toast.error('Silme hatası', errorMsg);
    }
  };

  const toggleActive = async (member: TeamMember) => {
    setTogglingId(member.id);
    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, isActive: !member.isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `İşlem başarısız (${res.status})`);
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: !m.isActive } : m))
      );
      toast.success(
        member.isActive ? 'Taslak yapıldı' : 'Yayında',
        member.isActive ? 'Üye sitede gösterilmeyecek.' : 'Üye sitede listeleniyor.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Durum güncellenemedi';
      toast.error('Güncelleme', msg);
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio ?? '',
      image: member.image ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      linkedin: member.linkedin ?? '',
      isActive: member.isActive,
      order: member.order ?? 0,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData(defaultForm());
    setIsModalOpen(true);
  };

  const statusPill = (key: StatusFilter, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setStatusFilter(key)}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        statusFilter === key
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-80">({statusCounts[key]})</span>
    </button>
  );

  if (loading && members.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError && members.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Ekip yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchMembers()}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          <Loader2 className="h-4 w-4" />
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ekibimiz</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sitedeki ekip sayfasında görünen üyeleri yönetin; taslaklar yalnızca yöneticilere listelenir.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchMembers()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <Link
            href="/ekibimiz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Site: Ekibimiz
          </Link>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm dark:bg-slate-700'
                  : 'hover:bg-white dark:hover:bg-slate-700'
              }`}
              aria-label="Izgara"
            >
              <Grid className="h-4 w-4 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm dark:bg-slate-700'
                  : 'hover:bg-white dark:hover:bg-slate-700'
              }`}
              aria-label="Liste"
            >
              <List className="h-4 w-4 dark:text-slate-300" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Yeni üye
          </motion.button>
        </div>
      </div>

      {loadError && members.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">Son yenilemede hata: {loadError}</span>
          <button
            type="button"
            onClick={() => void fetchMembers()}
            className="font-medium text-amber-800 underline hover:no-underline dark:text-amber-200"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toplam üye</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{members.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Yayında</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Taslak</p>
          <p className="mt-2 text-3xl font-bold text-slate-600 dark:text-slate-300">{stats.passive}</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Bu ay eklenen</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusPill('all', 'Tümü')}
        {statusPill('active', 'Yayında')}
        {statusPill('inactive', 'Taslak')}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="İsim, pozisyon, biyografi, e-posta veya telefon ara..."
          className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
                !member.isActive ? 'opacity-75' : ''
              }`}
            >
              <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800">
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-20 w-20 text-emerald-300 dark:text-emerald-600/50" />
                  </div>
                )}
                {!member.isActive && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/75 px-2 py-1 text-xs text-white">
                    Taslak
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void toggleActive(member)}
                  disabled={togglingId === member.id}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur hover:bg-white disabled:opacity-50 dark:bg-slate-800/90 dark:text-slate-200"
                  title={member.isActive ? 'Taslak yap' : 'Yayınla'}
                >
                  {togglingId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : member.isActive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold dark:text-slate-100">{member.name}</h3>
                <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">{member.role}</p>
                {member.bio && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{member.bio}</p>
                )}
                <div className="mb-4 flex items-center gap-3">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="rounded-lg bg-slate-100 p-2 transition-colors hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/30"
                    >
                      <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="rounded-lg bg-slate-100 p-2 transition-colors hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/30"
                    >
                      <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-slate-100 p-2 transition-colors hover:bg-emerald-100 dark:bg-slate-700 dark:hover:bg-emerald-900/30"
                    >
                      <ExternalLink className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t pt-4 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(member.id)}
                    className="p-2 text-slate-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Üye</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Pozisyon</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Sıra</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">İletişim</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Durum</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold dark:text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <User className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium dark:text-slate-100">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{member.role}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-600 dark:text-slate-400">{member.order}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {member.phone && (
                          <a href={`tel:${member.phone}`} className="p-1.5 text-slate-500 hover:text-emerald-600">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {member.email && (
                          <a href={`mailto:${member.email}`} className="p-1.5 text-slate-500 hover:text-emerald-600">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          member.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {member.isActive ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleActive(member)}
                          disabled={togglingId === member.id}
                          className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
                          aria-label={member.isActive ? 'Taslak yap' : 'Yayınla'}
                        >
                          {togglingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : member.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(member.id)}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Sil"
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

      {filteredMembers.length === 0 && (
        <div className="py-16 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">
            {members.length === 0 ? 'Henüz üye eklenmemiş' : 'Sonuç bulunamadı'}
          </h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {members.length === 0
              ? 'İlk üyeyi ekleyerek ekibimiz sayfasını doldurun.'
              : 'Arama veya filtreleri değiştirmeyi deneyin.'}
          </p>
          {members.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              İlk üyeyi ekle
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {editingMember ? 'Üyeyi düzenle' : 'Yeni üye ekle'}
                </h2>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="disabled:opacity-50"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">Fotoğraf URL</label>
                  <input
                    type="text"
                    inputMode="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... veya /uploads/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium dark:text-slate-300">Dosya yükle</span>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      {formData.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formData.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <User className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && void handleImageUpload(e.target.files[0])}
                        className="hidden"
                        id="team-upload"
                      />
                      <label
                        htmlFor="team-upload"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Fotoğraf seç
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">İsim soyisim</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Pozisyon</label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Operasyon müdürü"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Sıra</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                      }
                      min={0}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Küçük sayı önce listelenir.</p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">Biyografi</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="Kısa biyografi..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="0555 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">E-posta</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="ahmet@ornek.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">LinkedIn</label>
                  <input
                    type="text"
                    inputMode="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:border-emerald-500 dark:checked:bg-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium dark:text-slate-300">
                    Sitede yayında göster
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" /> {editingMember ? 'Güncelle' : 'Ekle'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            >
              <h3 className="mb-2 text-lg font-semibold dark:text-slate-100">Üyeyi sil</h3>
              <p className="mb-6 text-slate-500 dark:text-slate-400">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-slate-300 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => showDeleteConfirm && void handleDelete(showDeleteConfirm)}
                  className="flex-1 rounded-xl bg-red-500 py-2 font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
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
