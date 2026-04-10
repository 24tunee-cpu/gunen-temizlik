'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Trash2,
  Search,
  Download,
  Users,
  CheckCircle,
  X,
  Loader2,
  Send,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  ArrowUpDown,
  FileSpreadsheet,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/store/toastStore';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
}

type SortField = 'email' | 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'inactive';

const ITEMS_PER_PAGE = 10;

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', content: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/newsletter');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscribers', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Aboneler yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/newsletter/${id}`, { method: 'DELETE' });
      setShowDeleteConfirm(null);
      fetchSubscribers();
      toast.success('Silindi', 'Abone basariyla silindi.');
    } catch (error) {
      console.error('Error deleting subscriber', {}, error instanceof Error ? error : undefined);
      toast.error('Silme Hatasi', 'Abone silinirken bir hata olustu.');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedItems.map(id => fetch(`/api/newsletter/${id}`, { method: 'DELETE' }))
      );
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      fetchSubscribers();
    } catch (error) {
      console.error('Error bulk deleting subscribers', {}, error instanceof Error ? error : undefined);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    setIsExporting(true);
    try {
      const dataToExport = selectedItems.length > 0
        ? subscribers.filter(s => selectedItems.includes(s.id))
        : filteredSubscribers;

      if (format === 'csv') {
        const csv = [
          ['Email', 'İsim', 'Kayıt Tarihi', 'Durum'].join(','),
          ...dataToExport.map(s => [
            s.email,
            s.name || '-',
            new Date(s.createdAt).toLocaleDateString('tr-TR'),
            s.isActive ? 'Aktif' : 'Pasif'
          ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aboneler-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else if (format === 'json') {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aboneler-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
      }
    } catch (error) {
      console.error('Export error', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      // Email sending API would be called here
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowEmailModal(false);
      setEmailData({ subject: '', content: '' });
      alert('E-posta gönderildi!');
    } catch (error) {
      console.error('Error sending email', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsSending(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedItems(
      selectedItems.length === paginatedSubscribers.length
        ? []
        : paginatedSubscribers.map(s => s.id)
    );
  };

  const sortedSubscribers = [...subscribers].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredSubscribers = sortedSubscribers.filter(s => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ? true :
        filterStatus === 'active' ? s.isActive : !s.isActive;

    const matchesDate =
      (!dateRange.from || new Date(s.createdAt) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(s.createdAt) <= new Date(dateRange.to));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalSubscribers = subscribers.length;
  const activeSubscribers = subscribers.filter(s => s.isActive).length;
  const newThisMonth = subscribers.filter(s => {
    const date = new Date(s.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const newThisWeek = subscribers.filter(s => {
    const date = new Date(s.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }).length;

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-Bülten Aboneleri</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {totalSubscribers} toplam abone · {activeSubscribers} aktif
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedItems.length > 0 && (
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
              {selectedItems.length} seçili
            </span>
          )}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 border dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors">
              <Download className="h-4 w-4" />
              Dışa Aktar
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 first:rounded-t-xl transition-colors">
                CSV olarak indir
              </button>
              <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 last:rounded-b-xl transition-colors">
                JSON olarak indir
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-colors ${showFilters ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300'
              }`}
          >
            <Filter className="h-4 w-4" />
            Filtreler
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/30 transition-colors"
          >
            <Send className="h-4 w-4" />
            E-Posta Gönder
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Abone</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{totalSubscribers}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Aktif Abone</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{activeSubscribers}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Bu Hafta Yeni</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{newThisWeek}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Bu Ay Yeni</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{newThisMonth}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border"
          >
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-slate-300">Durum</label>
                <div className="flex gap-2">
                  {(['all', 'active', 'inactive'] as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-700 border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 dark:text-slate-300'
                        }`}
                    >
                      {status === 'all' ? 'Tümü' : status === 'active' ? 'Aktif' : 'Pasif'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block dark:text-slate-300">Kayıt Tarihi</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-slate-400 dark:text-slate-500">-</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Email veya isim ara..."
            className="w-full rounded-xl border dark:border-slate-600 pl-12 pr-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-slate-600 dark:text-slate-300 ${sortField === 'email' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <ArrowUpDown className="h-4 w-4" />
            Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('createdAt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-slate-600 dark:text-slate-300 ${sortField === 'createdAt' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <Calendar className="h-4 w-4" />
            Tarih {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {selectedItems.length} abone seçildi
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setSelectedItems([])}
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Temizle
          </button>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Seçili Sil
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 w-12">
                  <button onClick={toggleAll} className="p-1 hover:bg-slate-200 rounded">
                    {selectedItems.length === paginatedSubscribers.length && paginatedSubscribers.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Email</th>
                <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">İsim</th>
                <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Kayıt Tarihi</th>
                <th className="px-4 py-4 text-left text-sm font-semibold dark:text-slate-300">Durum</th>
                <th className="px-4 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {paginatedSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelection(subscriber.id)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {selectedItems.includes(subscriber.id) ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium dark:text-slate-100">{subscriber.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{subscriber.name || '-'}</td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(subscriber.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${subscriber.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                      {subscriber.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setShowDeleteConfirm(subscriber.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscribers.length)} / {filteredSubscribers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 dark:text-slate-400" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                    ? 'bg-emerald-500 text-white'
                    : 'border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4 dark:text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSubscribers.length === 0 && (
        <div className="text-center py-16">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">Abone bulunamadı</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchQuery ? 'Arama kriterlerinize uygun abone yok.' : 'Henüz abone kaydı yok.'}
          </p>
        </div>
      )}

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !isSending && setShowEmailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">E-Posta Gönder</h2>
                <button onClick={() => !isSending && setShowEmailModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Alıcılar</label>
                  <p className="text-sm text-slate-500">
                    {selectedItems.length > 0
                      ? `${selectedItems.length} seçili aboneye gönderilecek`
                      : `Tüm ${activeSubscribers} aktif aboneye gönderilecek`
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Konu</label>
                  <input
                    type="text"
                    required
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                    placeholder="E-posta konusu..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">İçerik</label>
                  <textarea
                    required
                    rows={6}
                    value={emailData.content}
                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2 resize-none"
                    placeholder="E-posta içeriği..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    disabled={isSending}
                    className="flex-1 py-3 border rounded-xl font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Gönderiliyor...</>
                    ) : (
                      <><Send className="h-5 w-5" /> Gönder</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
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
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Aboneyi Sil</h3>
                  <p className="text-sm text-slate-500">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 border rounded-xl font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirm */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
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
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Toplu Silme</h3>
                  <p className="text-sm text-slate-500">{selectedItems.length} abone silinecek</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 py-2 border rounded-xl font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl font-medium"
                >
                  Toplu Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
