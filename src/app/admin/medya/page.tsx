'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import {
  Upload,
  Image,
  File,
  X,
  Copy,
  Trash2,
  Search,
  Grid,
  List,
  Check,
  Loader2,
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: string;
  uploadedAt: string;
  dimensions?: string;
}


export default function MediaLibraryPage() {
  useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/media');
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = 'Medya dosyalari yuklenirken bir hata olustu.';
        if (res.status === 401) {
          errorMessage = 'Yetkiniz bulunmuyor.';
        } else if (res.status >= 500) {
          errorMessage = 'Sunucu hatasi. Lutfen daha sonra tekrar deneyin.';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Yukleme hatasi';
      setError(errorMsg);
      console.error('Error fetching media', {}, err instanceof Error ? err : undefined);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          let errorMessage = `Dosya yuklenirken hata: ${file.name}`;
          if (res.status === 413) {
            errorMessage = `Dosya cok buyuk: ${file.name}`;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
          throw new Error(errorMessage);
        }

        return await res.json();
      });

      const uploadedItems = await Promise.all(uploadPromises);
      setMedia(prev => [...uploadedItems, ...prev]);
      toast.success('Yukleme Basarili', `${files.length} dosya basariyla yuklendi.`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Dosya yuklenirken hata olustu.';
      console.error('Error uploading files', {}, err instanceof Error ? err : undefined);
      toast.error('Yukleme Hatasi', errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;

    try {
      const deletePromises = selectedItems.map(async (id) => {
        const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          let errorMessage = 'Silme hatasi';
          if (res.status === 404) {
            errorMessage = 'Dosya bulunamadi';
          } else if (res.status === 401) {
            errorMessage = 'Silme yetkiniz yok';
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
          throw new Error(errorMessage);
        }
      });

      await Promise.all(deletePromises);
      setMedia(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      toast.success('Silindi', `${selectedItems.length} dosya basariyla silindi.`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Dosyalar silinirken hata olustu.';
      console.error('Error deleting media', {}, err instanceof Error ? err : undefined);
      toast.error('Silme Hatasi', errorMsg);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Kopyalandi', 'URL panoya kopyalandi.');
    } catch (err) {
      console.error('Error copying to clipboard', {}, err instanceof Error ? err : undefined);
      toast.error('Kopyalama Hatasi', 'URL kopyalanirken hata olustu.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={() => fetchMedia()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medya Kütüphanesi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {media.length} dosya • {selectedItems.length} seçili
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Upload size={20} />
            {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Dosya ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={deleteSelected}
              aria-label="Secili dosyalari sil"
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Sil ({selectedItems.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid gorunumu"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List gorunumu"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredMedia.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${selectedItems.includes(item.id)
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                onClick={() => toggleSelection(item.id)}
              >
                {/* Preview */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {item.type === 'image' ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                      <Image size={48} className="text-slate-400 dark:text-slate-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <File size={48} className="text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyUrl(item.url);
                    }}
                    className="p-2 bg-white rounded-lg hover:bg-slate-100"
                    title="URL Kopyala"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(item.id);
                    }}
                    className={`p-2 rounded-lg ${selectedItems.includes(item.id) ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-slate-100'}`}
                  >
                    <Check size={18} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 bg-white dark:bg-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span>{item.size}</span>
                    <span>{item.dimensions || '-'}</span>
                  </div>
                </div>

                {/* Selection Badge */}
                {selectedItems.includes(item.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredMedia.length && filteredMedia.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredMedia.map(i => i.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Dosya</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Tür</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Boyut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Tarih</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-700 dark:text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedItems.includes(item.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          {item.type === 'image' ? <Image size={20} className="text-slate-400 dark:text-slate-500" /> : <File size={20} className="text-slate-400 dark:text-slate-500" />}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 capitalize">{item.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{item.size}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{item.uploadedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyUrl(item.url)}
                        aria-label="URL kopyala"
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="URL Kopyala"
                      >
                        <Copy size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {
        filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <Image size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Dosya bulunamadı</p>
          </div>
        )
      }
    </div >
  );
}
