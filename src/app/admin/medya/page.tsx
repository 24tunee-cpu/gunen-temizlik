'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import {
  Upload,
  Image as ImageIcon,
  File,
  X,
  Copy,
  Trash2,
  Search,
  Grid,
  List,
  Check,
  Loader2,
  ExternalLink,
  Link2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

type MediaUsage = {
  kind: string;
  label: string;
  href?: string;
};

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: string;
  sizeBytes?: number;
  uploadedAt: string;
  dimensions?: string;
  usages: MediaUsage[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/media', { credentials: 'include' });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
        let errorMessage = 'Medya dosyaları yüklenirken bir hata oluştu.';
        if (res.status === 401) errorMessage = 'Oturum gerekli veya yetkiniz yok. Tekrar giriş yapın.';
        else if (res.status >= 500) errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        else if (errorData?.error) errorMessage = errorData.error;
        throw new Error(errorMessage);
      }
      const data = (await res.json()) as MediaItem[];
      setMedia(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Yükleme hatası';
      setError(errorMsg);
      console.error('Error fetching media', err);
    } finally {
      setLoading(false);
    }
  };

  const usageKinds = useMemo(() => {
    const s = new Set<string>();
    for (const item of media) {
      for (const u of item.usages) {
        if (u.kind) s.add(u.kind);
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [media]);

  const filteredMedia = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return media.filter((item) => {
      if (kindFilter && !item.usages.some((u) => u.kind === kindFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.usages.some((u) => `${u.kind} ${u.label}`.toLowerCase().includes(q))
      );
    });
  }, [media, searchQuery, kindFilter]);

  const usageSummary = (item: MediaItem) => {
    const real = item.usages.filter((u) => !u.label.includes('Kayıtlı referans yok'));
    if (real.length === 0) return 'Referans yok';
    if (real.length <= 2) return real.map((u) => `${u.kind}: ${u.label}`).join(' · ');
    return `${real.length} kayıtta kullanılıyor`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!res.ok) {
          const errorData = (await res.json().catch(() => null)) as { error?: string } | null;
          let errorMessage = `Dosya yüklenirken hata: ${file.name}`;
          if (res.status === 413) errorMessage = `Dosya çok büyük: ${file.name}`;
          else if (errorData?.error) errorMessage = errorData.error;
          throw new Error(errorMessage);
        }
      }
      toast.success('Yükleme tamam', `${files.length} dosya yüklendi. Kullanım bilgisi güncellendi.`);
      await fetchMedia();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Dosya yüklenirken hata oluştu.';
      console.error('Error uploading files', err);
      toast.error('Yükleme hatası', errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const deleteOne = async (id: string, force: boolean) => {
    const q = force ? '?force=true' : '';
    const res = await fetch(`/api/media/${encodeURIComponent(id)}${q}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.status === 409) {
      const body = (await res.json().catch(() => null)) as { usages?: MediaUsage[]; error?: string } | null;
      return { ok: false as const, blocked: true as const, id, message: body?.error };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        ok: false as const,
        blocked: false as const,
        id,
        message: body?.error || `Silinemedi (${res.status})`,
      };
    }
    return { ok: true as const, id };
  };

  const deleteSelected = async () => {
    if (selectedItems.length === 0) return;
    try {
      const blockedIds: string[] = [];
      let firstBlockMessage = '';
      let removed = 0;
      for (const id of selectedItems) {
        const r = await deleteOne(id, false);
        if (r.ok) {
          removed++;
          continue;
        }
        if (r.blocked) {
          blockedIds.push(id);
          if (!firstBlockMessage) firstBlockMessage = r.message || '';
        } else {
          throw new Error(r.message || id);
        }
      }

      if (blockedIds.length > 0) {
        const ok = window.confirm(
          `${firstBlockMessage || 'Bazı dosyalar veritabanında kullanılıyor.'}\n\n` +
            `Kilitli (${blockedIds.length}): ${blockedIds.join(', ')}\n\n` +
            (removed > 0 ? `${removed} dosya zaten silindi.\n\n` : '') +
            `Zorla silmek sunucudan kaldırır; sitede kırık görsel bırakabilir. Devam edilsin mi?`
        );
        if (ok) {
          for (const id of blockedIds) {
            const r2 = await deleteOne(id, true);
            if (!r2.ok) {
              throw new Error('message' in r2 ? String(r2.message) : id);
            }
            removed++;
          }
          toast.success('Silindi', `${removed} dosya kaldırıldı (zorla silinenler dahil). Kayıtları kontrol edin.`);
        } else if (removed > 0) {
          toast.success('Kısmen silindi', `${removed} dosya kaldırıldı; kilitli olanlar duruyor.`);
        }
      } else {
        toast.success('Silindi', `${removed} dosya kaldırıldı.`);
      }

      setSelectedItems([]);
      await fetchMedia();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Dosyalar silinirken hata oluştu.';
      console.error('Error deleting media', err);
      toast.error('Silme hatası', errorMsg);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      const absolute =
        typeof window !== 'undefined' && url.startsWith('/')
          ? `${window.location.origin}${url}`
          : url;
      await navigator.clipboard.writeText(absolute);
      toast.success('Kopyalandı', 'Tam URL panoya alındı.');
    } catch (err) {
      console.error('Error copying to clipboard', err);
      toast.error('Kopyalama hatası', 'URL kopyalanamadı.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white dark:bg-slate-900">
        <p className="max-w-md text-center text-red-500 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void fetchMedia()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medya kütüphanesi</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tüm yüklemeler <code className="text-xs">/public/uploads</code> altında. Veritabanında nerede geçtiği
            otomatik taranır (site ayarları, blog, hizmet, galeri, sertifika, ekip, referans).
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {media.length} dosya · {selectedItems.length} seçili
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,.ico,image/x-icon"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Upload size={20} />
            {uploading ? 'Yükleniyor…' : 'Dosya yükle'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Dosya adı, kullanım yeri veya galeri etiketi ara…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={() => void deleteSelected()}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={18} />
              Sil ({selectedItems.length})
            </button>
          )}
          <div className="flex items-center gap-2 border-slate-200 pl-0 sm:border-l sm:pl-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Izgara"
              className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Grid size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Liste"
              className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {usageKinds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Kaynak
          </span>
          <button
            type="button"
            onClick={() => setKindFilter('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !kindFilter
                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Tümü
          </button>
          {usageKinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter((prev) => (prev === k ? '' : k))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                kindFilter === k
                  ? 'bg-violet-600 text-white dark:bg-violet-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      ) : null}

      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredMedia.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                selectedItems.includes(item.id)
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                {item.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600">
                    <File size={48} className="text-blue-400 dark:text-slate-400" />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyUrl(item.url);
                  }}
                  className="rounded-lg bg-white p-2 hover:bg-slate-100"
                  title="URL kopyala"
                >
                  <Copy size={18} />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg bg-white p-2 hover:bg-slate-100"
                  title="Yeni sekmede aç"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <div className="bg-white p-3 dark:bg-slate-800">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{usageSummary(item)}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{item.size}</span>
                  <span>{new Date(item.uploadedAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId((id) => (id === item.id ? null : item.id));
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Kullanım detayı
                  {expandedId === item.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {expandedId === item.id && (
                  <ul
                    className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2 text-left text-xs dark:bg-slate-900/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.usages.map((u, i) => (
                      <li key={i} className="text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{u.kind}:</span> {u.label}
                        {u.href && (
                          <Link
                            href={u.href}
                            className="ml-1 inline-flex items-center gap-0.5 text-emerald-600 hover:underline"
                          >
                            Aç <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedItems.includes(item.id) && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredMedia.length && filteredMedia.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) setSelectedItems(filteredMedia.map((i) => i.id));
                      else setSelectedItems([]);
                    }}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
                <th className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Önizleme</th>
                <th className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Dosya</th>
                <th className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Kullanım</th>
                <th className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Boyut</th>
                <th className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Tarih</th>
                <th className="px-3 py-3 text-right font-medium text-slate-700 dark:text-slate-300">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedia.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 dark:border-slate-700 ${
                    selectedItems.includes(item.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                      {item.type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <File size={20} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-2 align-top">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs capitalize text-slate-500">{item.type}</p>
                  </td>
                  <td className="max-w-xs px-3 py-2 align-top text-xs text-slate-600 dark:text-slate-400">
                    <ul className="space-y-1">
                      {item.usages.slice(0, 4).map((u, i) => (
                        <li key={i}>
                          <span className="font-medium">{u.kind}:</span> {u.label}
                          {u.href && (
                            <Link href={u.href} className="ml-1 text-emerald-600 hover:underline">
                              →
                            </Link>
                          )}
                        </li>
                      ))}
                      {item.usages.length > 4 && (
                        <li className="text-slate-400">+{item.usages.length - 4} satır…</li>
                      )}
                    </ul>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-top text-slate-600 dark:text-slate-400">
                    {item.size}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-top text-slate-600 dark:text-slate-400">
                    {new Date(item.uploadedAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <button
                      type="button"
                      onClick={() => void copyUrl(item.url)}
                      className="p-2 text-slate-400 hover:text-emerald-600"
                      title="URL kopyala"
                    >
                      <Copy size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredMedia.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-600">
          <ImageIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            {media.length === 0
              ? 'Henüz yükleme yok. Yukarıdan dosya ekleyin.'
              : 'Aramanızla eşleşen dosya yok.'}
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Silme kuralları</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
            Veritabanında kullanılan dosyalar önce uyarı verilir; onaylarsanız zorla silinebilir. Zorla silinen
            görseller sayfada kırık link olarak kalır — önce ilgili admin ekranından kaldırmanız en güvenlisi.
          </p>
        </div>
      </div>
    </div>
  );
}
