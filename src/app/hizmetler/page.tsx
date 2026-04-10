/**
 * @fileoverview Services Page
 * @description Hizmetler listesi sayfası.
 * API'den dinamik hizmet verisi çeken, SEO optimizasyonlu sayfa.
 *
 * @architecture
 * - Client Component (Client-Side Rendering)
 * - API data fetching from /api/services
 * - JSON-LD structured data (Service schema)
 * - Admin'den yönetilen dinamik içerik
 *
 * @admin-sync
 * Hizmetler admin paneldeki /admin/hizmetler sayfasından yönetilir.
 * API üzerinden otomatik çekilir.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import SiteLayout from '../site/layout';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Hizmet veri tipi */
interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  priceRange?: string;
  icon?: string;
}

/** Sayfa state tipi */
interface PageState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Service Card Component
 * Individual service display with animation.
 */
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.1,
        duration: shouldReduceMotion ? 0.2 : 0.5
      }}
    >
      <Link
        href={`/hizmetler/${service.slug}`}
        className="group block rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label={`${service.title} hizmeti hakkında detaylı bilgi`}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{service.title}</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{service.shortDesc}</p>
        {service.priceRange && (
          <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-medium">
            {service.priceRange}
          </p>
        )}
        <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
          <span>Detayları Gör</span>
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </Link>
    </motion.article>
  );
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div
      className="flex items-center justify-center py-16"
      role="status"
      aria-label="Hizmetler yükleniyor"
    >
      <Loader2 className="h-12 w-12 animate-spin text-emerald-500" aria-hidden="true" />
      <span className="sr-only">Hizmetler yükleniyor...</span>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Bir Hata Oluştu
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Tekrar Dene
      </button>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="text-center py-16">
      <Sparkles className="mx-auto h-12 w-12 text-slate-400 mb-4" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Henüz Hizmet Bulunmuyor
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        Yakında yeni hizmetlerimizi ekleyeceğiz.
      </p>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

/**
 * Services Page Component
 * Hizmetler listesi sayfası.
 * 
 * @admin-sync Hizmetler /admin/hizmetler'den API ile çekilir
 */
export default function ServicesPage() {
  // State management with proper types
  const [state, setState] = useState<PageState>({
    services: [],
    loading: true,
    error: null,
  });

  // Memoized fetch function
  const fetchServices = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Hizmetler yüklenirken bir hata oluştu');
      const data = await res.json();
      setState({
        services: Array.isArray(data) ? data : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Error fetching services', {}, error instanceof Error ? error : undefined);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu',
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const { services, loading, error } = state;

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section
        className="bg-slate-900 pt-32 pb-16"
        aria-label="Sayfa başlığı"
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Hizmetlerimiz
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Profesyonel temizlik çözümleri ile yaşam alanlarınızı pırıl pırıl yapıyoruz.
            Size özel hizmetlerimizi keşfedin.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section
        className="py-16 bg-slate-50 dark:bg-slate-900"
        aria-label="Hizmetler listesi"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchServices} />
          ) : services.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Mevcut hizmetler"
            >
              {services.map((service, index) => (
                <div key={service.id} role="listitem">
                  <ServiceCard service={service} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Size özel bir çözüm mü arıyorsunuz?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            İhtiyaçlarınıza özel temizlik paketleri oluşturabiliriz.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Bizimle İletişime Geçin
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
