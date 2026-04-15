'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Palette,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Globe,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Search,
  Code2,
  Shield,
  Download,
  Building2,
} from 'lucide-react';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import { formatDate } from '@/lib/utils';

type TabId = 'general' | 'appearance' | 'social' | 'seo' | 'advanced';

interface FormState {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  twitterHandle: string;
  canonicalUrl: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  maintenanceMode: boolean;
  customCss: string;
  customJs: string;
}

const emptyForm = (): FormState => ({
  siteName: '',
  siteDescription: '',
  siteUrl: 'https://gunentemizlik.com',
  logo: '',
  favicon: '/favicon.ico',
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  phone: '',
  email: '',
  address: '',
  workingHours: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: '',
  youtube: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImage: '',
  twitterHandle: '',
  canonicalUrl: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  robotsTxt: '',
  sitemapEnabled: true,
  maintenanceMode: false,
  customCss: '',
  customJs: '',
});

function apiRowToForm(row: Record<string, unknown>): FormState {
  const s = (k: string) => (typeof row[k] === 'string' ? (row[k] as string) : row[k] ? String(row[k]) : '');
  const b = (k: string, d: boolean) => (typeof row[k] === 'boolean' ? row[k] : d) as boolean;
  return {
    siteName: s('siteName') || 'Günen Temizlik',
    siteDescription: s('siteDescription'),
    siteUrl: s('siteUrl') || 'https://gunentemizlik.com',
    logo: s('logo'),
    favicon: s('favicon') || '/favicon.ico',
    primaryColor: s('primaryColor') || '#10b981',
    secondaryColor: s('secondaryColor') || '#059669',
    accentColor: s('accentColor') || '#34d399',
    phone: s('phone'),
    email: s('email'),
    address: s('address'),
    workingHours: s('workingHours'),
    whatsapp: s('whatsapp'),
    facebook: s('facebook'),
    instagram: s('instagram'),
    twitter: s('twitter'),
    linkedin: s('linkedin'),
    youtube: s('youtube'),
    seoTitle: s('seoTitle'),
    seoDescription: s('seoDescription'),
    seoKeywords: s('seoKeywords'),
    ogImage: s('ogImage'),
    twitterHandle: s('twitterHandle'),
    canonicalUrl: s('canonicalUrl'),
    googleAnalyticsId: s('googleAnalyticsId'),
    googleTagManagerId: s('googleTagManagerId'),
    facebookPixelId: s('facebookPixelId'),
    robotsTxt: s('robotsTxt'),
    sitemapEnabled: b('sitemapEnabled', true),
    maintenanceMode: b('maintenanceMode', false),
    customCss: s('customCss'),
    customJs: s('customJs'),
  };
}

function formToPayload(f: FormState): Record<string, unknown> {
  return {
    siteName: f.siteName.trim(),
    siteDescription: f.siteDescription.trim() || null,
    siteUrl: f.siteUrl.trim(),
    logo: f.logo.trim() || null,
    favicon: f.favicon.trim() || null,
    primaryColor: f.primaryColor.trim(),
    secondaryColor: f.secondaryColor.trim(),
    accentColor: f.accentColor.trim(),
    phone: f.phone.trim(),
    email: f.email.trim(),
    address: f.address.trim() || null,
    workingHours: f.workingHours.trim() || null,
    whatsapp: f.whatsapp.trim() || null,
    facebook: f.facebook.trim() || null,
    instagram: f.instagram.trim() || null,
    twitter: f.twitter.trim() || null,
    linkedin: f.linkedin.trim() || null,
    youtube: f.youtube.trim() || null,
    seoTitle: f.seoTitle.trim() || null,
    seoDescription: f.seoDescription.trim() || null,
    seoKeywords: f.seoKeywords.trim() || null,
    ogImage: f.ogImage.trim() || null,
    twitterHandle: f.twitterHandle.trim() || null,
    canonicalUrl: f.canonicalUrl.trim() || null,
    googleAnalyticsId: f.googleAnalyticsId.trim() || null,
    googleTagManagerId: f.googleTagManagerId.trim() || null,
    facebookPixelId: f.facebookPixelId.trim() || null,
    robotsTxt: f.robotsTxt.trim() || null,
    sitemapEnabled: f.sitemapEnabled,
    maintenanceMode: f.maintenanceMode,
    customCss: f.customCss.trim() || null,
    customJs: f.customJs.trim() || null,
  };
}

export default function SiteSettingsPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [baseline, setBaseline] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'favicon' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const applyRow = useCallback((data: Record<string, unknown>) => {
    const next = apiRowToForm(data);
    setForm(next);
    setBaseline(JSON.stringify(next));
    if (typeof data.updatedAt === 'string') setUpdatedAt(data.updatedAt);
    else setUpdatedAt(null);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch('/api/site-settings', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        let msg = 'Ayarlar yüklenemedi.';
        if (res.status === 401) msg = 'Oturum gerekli. Yeniden giriş yapın.';
        else if (err?.error) msg = err.error;
        throw new Error(msg);
      }
      const data = await res.json();
      applyRow(data as Record<string, unknown>);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ayarlar yüklenemedi.';
      setLoadError(msg);
      trackError(e instanceof Error ? e : new Error(msg), { context: 'admin-site-settings' });
      toast.error('Yükleme hatası', msg);
    } finally {
      setLoading(false);
    }
  }, [applyRow]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.siteName.trim()) e.siteName = 'Site adı zorunludur';
    if (!form.email.trim()) e.email = 'E-posta zorunludur';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Geçerli e-posta girin';
    if (!form.phone.trim()) e.phone = 'Telefon zorunludur';
    else {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 10) e.phone = 'En az 10 rakam içermelidir';
    }
    if (!form.siteUrl.trim().startsWith('http')) e.siteUrl = 'https:// ile başlamalıdır';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Doğrulama', 'Lütfen zorunlu alanları kontrol edin.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Kayıt başarısız (${res.status})`);
      }
      applyRow(data as Record<string, unknown>);
      toast.success('Kaydedildi', 'Site ayarları güncellendi.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayıt başarısız';
      trackError(err instanceof Error ? err : new Error(msg), { context: 'admin-site-settings-save' });
      toast.error('Kayıt hatası', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'favicon', file: File) => {
    setUploadingImage(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Yükleme başarısız');
      }
      const { url } = await res.json();
      setForm((p) =>
        type === 'logo'
          ? { ...p, logo: url, favicon: url }
          : { ...p, favicon: url }
      );
      toast.success(
        'Yükleme tamam',
        type === 'logo' ? 'Logo ve sekme ikonu (favicon) aynı adrese ayarlandı.' : 'Favicon güncellendi.'
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Dosya yüklenemedi';
      toast.error('Yükleme', msg);
    } finally {
      setUploadingImage(null);
    }
  };

  const copyContactBlock = () => {
    const block = `${form.siteName}\nTel: ${form.phone}\nE-posta: ${form.email}\n${form.address ? `Adres: ${form.address}\n` : ''}${form.workingHours ? `Çalışma: ${form.workingHours}` : ''}`;
    void navigator.clipboard.writeText(block.trim());
    toast.success('Kopyalandı', 'İletişim özeti panoya alındı.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(formToPayload(form), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `site-ayarlari-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Dışa aktarıldı', 'JSON dosyası indirildi.');
  };

  const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
    { id: 'general', label: 'Genel', icon: Building2 },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'social', label: 'Sosyal', icon: Globe },
    { id: 'seo', label: 'SEO ve ölçüm', icon: Search },
    { id: 'advanced', label: 'Gelişmiş', icon: Code2 },
  ];

  if (loading && !baseline) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (loadError && !baseline) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-800">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-center text-slate-600 dark:text-slate-400">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchSettings()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  const field =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((p) => ({ ...p, [k]: v }));
      if (errors[k as string]) setErrors((er) => ({ ...er, [k]: '' }));
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site ayarları</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Marka, iletişim, SEO ve teknik ayarlar veritabanında saklanır; kayıttan sonra canlı site{' '}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-700">/api/settings</code> üzerinden okur.
          </p>
          {updatedAt && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Son kayıt: {formatDate(updatedAt, 'datetime')}
            </p>
          )}
          {isDirty && (
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">Kaydedilmemiş değişiklikler var.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchSettings()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={copyContactBlock}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Copy className="h-4 w-4" />
            İletişim özeti
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ana site
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 font-medium text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </motion.button>
        </div>
      </div>

      {loadError && baseline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Yenileme hatası: {loadError}</span>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:w-60 lg:flex-col lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {activeTab === 'general' && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Marka ve adres</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Site adı *</label>
                    <input
                      value={form.siteName}
                      onChange={field('siteName')}
                      className={`w-full rounded-xl border px-4 py-2.5 dark:bg-slate-700 dark:text-white ${
                        errors.siteName ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.siteName && <p className="mt-1 text-xs text-red-500">{errors.siteName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Kısa açıklama</label>
                    <textarea
                      value={form.siteDescription}
                      onChange={field('siteDescription')}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Site URL *</label>
                    <input
                      value={form.siteUrl}
                      onChange={field('siteUrl')}
                      className={`w-full rounded-xl border px-4 py-2.5 font-mono text-sm dark:bg-slate-700 dark:text-white ${
                        errors.siteUrl ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.siteUrl && <p className="mt-1 text-xs text-red-500">{errors.siteUrl}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Logo ve favicon</h2>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Logo yüklediğinizde favicon otomatik aynı dosyaya ayarlanır (sekme ikonu). İsterseniz sağdan ayrı
                  favicon da yükleyebilirsiniz. PNG veya ICO önerilir; kayıttan sonra site kökündeki metadata ile
                  tarayıcı sekmesinde görünür.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Logo URL</label>
                    <input
                      value={form.logo}
                      onChange={field('logo')}
                      placeholder="/uploads/logo.png"
                      className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-600">
                      {form.logo ? (
                        <div className="relative mx-auto mb-3 flex h-28 items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.logo} alt="" className="max-h-28 max-w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white"
                            aria-label="Logoyu kaldır"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,.ico,image/x-icon,image/ico,image/vnd.microsoft.icon,application/vnd.microsoft.icon"
                        className="hidden"
                        id="logo-up"
                        onChange={(e) => e.target.files?.[0] && void handleImageUpload('logo', e.target.files[0])}
                      />
                      <label
                        htmlFor="logo-up"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-700"
                      >
                        {uploadingImage === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Yükle
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">Favicon URL</label>
                    <input
                      value={form.favicon}
                      onChange={field('favicon')}
                      className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-600">
                      {form.favicon ? (
                        <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.favicon} alt="" className="max-h-16 max-w-16 object-contain" />
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, favicon: '' }))}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                            aria-label="Favicon kaldır"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,.ico,image/x-icon,image/ico,image/vnd.microsoft.icon,application/vnd.microsoft.icon"
                        className="hidden"
                        id="fav-up"
                        onChange={(e) => e.target.files?.[0] && void handleImageUpload('favicon', e.target.files[0])}
                      />
                      <label
                        htmlFor="fav-up"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-700"
                      >
                        {uploadingImage === 'favicon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Yükle
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  İletişim
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Telefon *</label>
                    <input
                      value={form.phone}
                      onChange={field('phone')}
                      className={`w-full rounded-xl border px-4 py-2.5 dark:bg-slate-700 dark:text-white ${
                        errors.phone ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">E-posta *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={field('email')}
                      className={`w-full rounded-xl border px-4 py-2.5 dark:bg-slate-700 dark:text-white ${
                        errors.email ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Adres</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        value={form.address}
                        onChange={field('address')}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Çalışma saatleri</label>
                    <input
                      value={form.workingHours}
                      onChange={field('workingHours')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">WhatsApp</label>
                    <input
                      value={form.whatsapp}
                      onChange={field('whatsapp')}
                      placeholder="+90 546 715 28 44 veya https://wa.me/905467152844"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'appearance' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Tema renkleri</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {(
                  [
                    { k: 'primaryColor' as const, label: 'Ana renk', hint: 'Butonlar, vurgular' },
                    { k: 'secondaryColor' as const, label: 'İkincil', hint: 'Hover, ikonlar' },
                    { k: 'accentColor' as const, label: 'Vurgu', hint: 'Rozet, link tonları' },
                  ] as const
                ).map(({ k, label, hint }) => (
                  <div key={k}>
                    <label className="mb-2 block text-sm font-medium dark:text-slate-300">{label}</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      />
                      <input
                        value={form[k]}
                        onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm uppercase dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{hint}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-slate-50 p-6 dark:bg-slate-900/50">
                <p className="mb-4 text-sm font-medium dark:text-slate-300">Önizleme</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    Birincil
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                    style={{ backgroundColor: form.secondaryColor }}
                  >
                    İkincil
                  </button>
                  <span
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: `${form.accentColor}33`, color: form.accentColor }}
                  >
                    Vurgu
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Renklerin tam etkisi için bileşenlerde CSS değişkeni kullanımı gerekir; şu an önizleme göstergesidir.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'social' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Sosyal medya</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ['facebook', 'Facebook'],
                    ['instagram', 'Instagram'],
                    ['twitter', 'X (Twitter)'],
                    ['linkedin', 'LinkedIn'],
                    ['youtube', 'YouTube'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">{label}</label>
                    <input
                      value={form[key]}
                      onChange={field(key)}
                      placeholder="https://"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">SEO</h2>
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Meta başlık</label>
                    <input
                      value={form.seoTitle}
                      onChange={field('seoTitle')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-slate-400">{form.seoTitle.length}/60 önerilen</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Meta açıklama</label>
                    <textarea
                      value={form.seoDescription}
                      onChange={field('seoDescription')}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-slate-400">{form.seoDescription.length}/160 önerilen</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Anahtar kelimeler</label>
                    <input
                      value={form.seoKeywords}
                      onChange={field('seoKeywords')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">OG görsel URL</label>
                    <input
                      value={form.ogImage}
                      onChange={field('ogImage')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Twitter / X kullanıcı adı</label>
                    <input
                      value={form.twitterHandle}
                      onChange={field('twitterHandle')}
                      placeholder="@marka"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Canonical URL</label>
                    <input
                      value={form.canonicalUrl}
                      onChange={field('canonicalUrl')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Ölçüm (yalnızca yönetici panelinden kayıt)</h2>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Bu kimlikler veritabanında saklanır; ziyaretçi API&apos;si bunları döndürmez. Entegrasyon için{' '}
                  <code className="text-xs">layout</code> veya etiket bileşeninde kullanılmalıdır.
                </p>
                <div className="grid gap-5 sm:grid-cols-1">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Google Analytics (G-...)</label>
                    <input
                      value={form.googleAnalyticsId}
                      onChange={field('googleAnalyticsId')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Google Tag Manager (GTM-...)</label>
                    <input
                      value={form.googleTagManagerId}
                      onChange={field('googleTagManagerId')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Meta Pixel ID</label>
                    <input
                      value={form.facebookPixelId}
                      onChange={field('facebookPixelId')}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Arama sonucu önizlemesi</h3>
                <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900">
                  <div className="truncate text-blue-800 dark:text-blue-400">{form.seoTitle || form.siteName}</div>
                  <div className="text-xs text-green-700 dark:text-green-500">
                    {(form.canonicalUrl || form.siteUrl || '').replace(/^https?:\/\//, '')}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                    {form.seoDescription || form.siteDescription || 'Açıklama…'}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Shield className="h-5 w-5 text-slate-600" />
                  Site davranışı
                </h2>
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.sitemapEnabled}
                      onChange={(e) => setForm((p) => ({ ...p, sitemapEnabled: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-sm dark:text-slate-300">Sitemap etkin (robots ile uyumlu tutun)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <input
                      type="checkbox"
                      checked={form.maintenanceMode}
                      onChange={(e) => setForm((p) => ({ ...p, maintenanceMode: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-300 dark:border-amber-800"
                    />
                    <div>
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Bakım modu</span>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                        Açıkken ziyaretçi API&apos;si kısıtlı yanıt döner. Yönetici paneli etkilenmez.
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">robots.txt içeriği</h2>
                <textarea
                  value={form.robotsTxt}
                  onChange={field('robotsTxt')}
                  rows={10}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="User-agent: * ..."
                />
                <p className="mt-2 text-xs text-slate-500">
                  Üretimde gerçek robots için bu içeriği route veya statik dosyaya bağlamanız gerekebilir.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Code2 className="h-5 w-5" />
                  Özel CSS / JS
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">CSS</label>
                    <textarea
                      value={form.customCss}
                      onChange={field('customCss')}
                      rows={8}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">JavaScript</label>
                    <textarea
                      value={form.customJs}
                      onChange={field('customJs')}
                      rows={8}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Özel kodların sayfaya enjekte edilmesi ayrı bir layout bileşeni gerektirir; burada güvenli şekilde saklanır.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
