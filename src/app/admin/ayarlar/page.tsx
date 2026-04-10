'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Phone,
  Mail,
  MapPin,
  Palette,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  Globe,
  Eye,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import logger from '@/lib/logger';
import { toast } from '@/store/toastStore';

interface SiteSettings {
  id?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  phone: string;
  email: string;
  address?: string;
  workingHours?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
  metaTitle?: string;
  metaDesc?: string;
  metaKeywords?: string;
  googleAnalyticsId?: string;
  customCss?: string;
  customJs?: string;
}

const defaultSettings: SiteSettings = {
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  phone: '0555 123 45 67',
  email: 'info@gunentemizlik.com',
  address: 'İstanbul, Türkiye',
  workingHours: 'Pzt-Cum: 08:00 - 18:00',
  metaTitle: 'Günen Temizlik - Profesyonel Temizlik Hizmetleri',
  metaDesc: 'Ev, ofis ve endüstriyel temizlik hizmetleri. Profesyonel ekip, kaliteli hizmet.',
  metaKeywords: 'temizlik, ofis temizliği, ev temizliği, istanbul temizlik',
};

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'social' | 'seo' | 'advanced'>('general');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'favicon' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (savedSuccess) {
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  }, [savedSuccess]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/site-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      logger.error('Error fetching settings', {}, error instanceof Error ? error : undefined);
      toast.error('Yukleme Hatasi', 'Ayarlar yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};
    if (!settings.phone) newErrors.phone = 'Telefon numarası gereklidir';
    if (!settings.email) newErrors.email = 'E-posta adresi gereklidir';
    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        toast.success('Kaydedildi', 'Ayarlar basariyla kaydedildi.');
      }
    } catch (error) {
      logger.error('Error saving settings', {}, error instanceof Error ? error : undefined);
      toast.error('Kaydetme Hatasi', 'Ayarlar kaydedilirken bir hata olustu.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'favicon', file: File) => {
    setUploadingImage(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setSettings(prev => ({ ...prev, [type]: url }));
      }
    } catch (error) {
      logger.error('Upload error', {}, error instanceof Error ? error : undefined);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleReset = () => {
    if (confirm('Tüm ayarları varsayılana sıfırlamak istediğinize emin misiniz?')) {
      setSettings(defaultSettings);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Genel', icon: Settings },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'social', label: 'Sosyal Medya', icon: Globe },
    { id: 'seo', label: 'SEO', icon: Eye },
    { id: 'advanced', label: 'Gelişmiş', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Ayarları</h1>
          <p className="mt-1 text-sm text-slate-500">Web sitenizin genel ayarlarını buradan yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl font-medium hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Önizlemeyi Gizle' : 'Önizleme'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Sıfırla
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Kaydediliyor...</>
            ) : savedSuccess ? (
              <><Check className="h-4 w-4" /> Kaydedildi!</>
            ) : (
              <><Save className="h-4 w-4" /> Kaydet</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-emerald-600" />
            <span className="text-emerald-800 font-medium">Ayarlar başarıyla kaydedildi!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'hover:bg-slate-100 text-slate-600'
                  }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 dark:text-slate-100">Logo & Favicon</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Site Logosu</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors">
                      {settings.logo ? (
                        <div className="relative w-full h-32 mb-4">
                          <Image src={settings.logo} alt="Logo" fill className="object-contain" />
                          <button
                            onClick={() => setSettings({ ...settings, logo: undefined })}
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
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('logo', e.target.files[0])}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors dark:text-slate-200"
                      >
                        {uploadingImage === 'logo' ? (
                          <><Loader2 className="animate-spin h-4 w-4" /> Yükleniyor...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Logo Yükle</>
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Favicon</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors">
                      {settings.favicon ? (
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <Image src={settings.favicon} alt="Favicon" fill className="object-contain" />
                          <button
                            onClick={() => setSettings({ ...settings, favicon: undefined })}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                          <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload('favicon', e.target.files[0])}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <label
                        htmlFor="favicon-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors dark:text-slate-200"
                      >
                        {uploadingImage === 'favicon' ? (
                          <><Loader2 className="animate-spin h-4 w-4" /> Yükleniyor...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Favicon Yükle</>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold dark:text-slate-100">İletişim Bilgileri</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => {
                          setSettings({ ...settings, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors ${errors.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50'
                          : 'border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                          }`}
                        placeholder="0555 123 45 67"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => {
                          setSettings({ ...settings, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors ${errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50'
                          : 'border-slate-200 dark:border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                          }`}
                        placeholder="info@gunentemizlik.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Adres</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <textarea
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-colors"
                        placeholder="Tam adres bilgisi..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Çalışma Saatleri</label>
                    <input
                      type="text"
                      value={settings.workingHours}
                      onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      placeholder="Pzt-Cum: 08:00 - 18:00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold dark:text-slate-100">Tema Renkleri</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { key: 'primaryColor', label: 'Ana Renk', desc: 'Butonlar, linkler' },
                  { key: 'secondaryColor', label: 'İkincil Renk', desc: 'Vurgular, hover' },
                  { key: 'accentColor', label: 'Vurgu Rengi', desc: 'Özel elementler' },
                ].map((color) => (
                  <div key={color.key}>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">{color.label}</label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={settings[color.key as keyof SiteSettings] as string}
                          onChange={(e) => setSettings({ ...settings, [color.key]: e.target.value })}
                          className="h-12 w-12 rounded-xl cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={settings[color.key as keyof SiteSettings] as string}
                          onChange={(e) => setSettings({ ...settings, [color.key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono uppercase transition-colors"
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{color.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h4 className="text-sm font-medium mb-4 dark:text-slate-200">Canlı Önizleme</h4>
                <div className="flex flex-wrap gap-4">
                  <button
                    className="px-6 py-2.5 rounded-xl font-medium text-white transition-colors"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    Ana Buton
                  </button>
                  <button
                    className="px-6 py-2.5 rounded-xl font-medium text-white transition-colors"
                    style={{ backgroundColor: settings.secondaryColor }}
                  >
                    İkincil Buton
                  </button>
                  <span
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ backgroundColor: settings.accentColor + '20', color: settings.accentColor }}
                  >
                    Vurgu Etiketi
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold dark:text-slate-100">Sosyal Medya Bağlantıları</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { key: 'facebook', label: 'Facebook', icon: () => <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, placeholder: 'https://facebook.com/...', color: 'bg-blue-600' },
                  { key: 'instagram', label: 'Instagram', icon: () => <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.072-4.354-.2-6.78-2.618-6.979-6.98-.058-1.282-.073-1.69-.073-4.949 0-3.259.014-3.667.072-4.946.072-4.354.2-6.78 2.618-6.979 6.98-.059 1.281-.073 1.689-.073 4.948zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>, placeholder: 'https://instagram.com/...', color: 'bg-pink-600' },
                  { key: 'twitter', label: 'Twitter', icon: () => <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>, placeholder: 'https://twitter.com/...', color: 'bg-sky-500' },
                  { key: 'whatsapp', label: 'WhatsApp', icon: () => <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 5.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.955L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>, placeholder: '905551234567', color: 'bg-green-500' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <div key={social.key}>
                      <label className="block text-sm font-medium mb-2 dark:text-slate-300">{social.label}</label>
                      <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 ${social.color} rounded-lg flex items-center justify-center`}>
                          <social.icon />
                        </div>
                        <input
                          type="text"
                          value={(settings[social.key as keyof SiteSettings] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [social.key]: e.target.value })}
                          className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                          placeholder={social.placeholder}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold dark:text-slate-100">SEO Ayarları</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Meta Başlık</label>
                    <input
                      type="text"
                      value={settings.metaTitle}
                      onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      placeholder="Sayfa başlığı..."
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Önerilen: 50-60 karakter ({settings.metaTitle?.length || 0} karakter)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Meta Açıklama</label>
                    <textarea
                      value={settings.metaDesc}
                      onChange={(e) => setSettings({ ...settings, metaDesc: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-colors"
                      placeholder="Sayfa açıklaması..."
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Önerilen: 150-160 karakter ({settings.metaDesc?.length || 0} karakter)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Meta Keywords</label>
                    <input
                      type="text"
                      value={settings.metaKeywords}
                      onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      placeholder="anahtar, kelimeler, virgülle, ayrılmış"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Google Analytics ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settings.googleAnalyticsId}
                        onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm transition-colors"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <h4 className="text-sm font-medium mb-4 dark:text-slate-200">Google Arama Sonuçları Önizlemesi</h4>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 max-w-2xl">
                  <div className="text-sm text-slate-800 dark:text-slate-100 truncate" style={{ color: '#1a0dab' }}>
                    {settings.metaTitle || 'Site Başlığı'}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                    www.gunentemizlik.com › ana-sayfa
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {settings.metaDesc || 'Site açıklaması burada görünecek...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    <RefreshCw className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold dark:text-slate-100">Gelişmiş Ayarlar</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Özel CSS</label>
                    <textarea
                      value={settings.customCss}
                      onChange={(e) => setSettings({ ...settings, customCss: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm resize-none transition-colors"
                      placeholder="/* Özel CSS kodlarınız */"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Özel JavaScript</label>
                    <textarea
                      value={settings.customJs}
                      onChange={(e) => setSettings({ ...settings, customJs: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm resize-none transition-colors"
                      placeholder="// Özel JavaScript kodlarınız"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">Bilgi</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400/90 mt-1 leading-relaxed">
                      Özel CSS ve JavaScript kodları sitenizin tüm sayfalarına uygulanır.
                      Bu özelliği dikkatli kullanın - hatalı kodlar sitenin çalışmasını etkileyebilir.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500/80 mt-2">
                      Değişiklik yapmadan önce yedek almanız önerilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
