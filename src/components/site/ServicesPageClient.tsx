'use client';

import { useState, useEffect, useCallback } from 'react';
import SiteLayout from '@/app/site/layout';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import logger from '@/lib/logger';

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  priceRange?: string;
}

interface PageState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.1,
        duration: shouldReduceMotion ? 0.2 : 0.5,
      }}
    >
      <Link
        href={`/hizmetler/${service.slug}`}
        className="group block rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 sm:p-8"
        aria-label={`${service.title} hizmeti hakkında detaylı bilgi`}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{service.title}</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{service.shortDesc}</p>
        {service.priceRange && (
          <p className="mt-3 font-medium text-emerald-600 dark:text-emerald-400">{service.priceRange}</p>
        )}
        <div className="mt-6 flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
          <span>Detayları Gör</span>
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </Link>
    </motion.article>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Hizmetler yükleniyor">
      <Loader2 className="h-12 w-12 animate-spin text-emerald-500" aria-hidden="true" />
      <span className="sr-only">Hizmetler yükleniyor...</span>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
      <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Bir Hata Oluştu</h2>
      <p className="mb-4 text-slate-600 dark:text-slate-400">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Tekrar Dene
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
      <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Henüz Hizmet Bulunmuyor</h2>
      <p className="text-slate-600 dark:text-slate-400">Yakında yeni hizmetlerimizi ekleyeceğiz.</p>
    </div>
  );
}

export default function ServicesPageClient() {
  const [state, setState] = useState<PageState>({
    services: [],
    loading: true,
    error: null,
  });

  const fetchServices = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Hizmetler yüklenirken bir hata oluştu');
      const data = (await res.json()) as unknown;
      setState({
        services: Array.isArray(data) ? (data as Service[]) : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Error fetching services', {}, error instanceof Error ? error : undefined);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const { services, loading, error } = state;

  return (
    <SiteLayout>
      <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        <section className="bg-slate-900 pb-12 pt-24 sm:pb-14 sm:pt-28 md:pb-16 md:pt-32" aria-label="Sayfa başlığı">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Hizmetlerimiz</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Profesyonel temizlik çözümleri ile yaşam alanlarınızı pırıl pırıl yapıyoruz. Size özel hizmetlerimizi keşfedin.
            </p>
          </div>
        </section>

        <section className="flex-1 border-t border-slate-800 bg-slate-50 py-16 dark:bg-slate-900" aria-label="Hizmetler listesi">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onRetry={() => void fetchServices()} />
            ) : services.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Mevcut hizmetler">
                {services.map((service, index) => (
                  <div key={service.id} role="listitem">
                    <ServiceCard service={service} index={index} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Size özel bir çözüm mü arıyorsunuz?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-slate-300">İhtiyaçlarınıza özel temizlik paketleri oluşturabiliriz.</p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Bizimle İletişime Geçin
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
