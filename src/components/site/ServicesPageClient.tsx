'use client';

import SiteLayout from '@/app/site/layout';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { DISTRICT_LANDINGS } from '@/config/programmatic-seo';
import { PRIORITY_BLOG_LINKS } from '@/lib/priority-seo-links';

interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  features?: string[];
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
        <div className="mt-6 flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
          <span>Detayları Gör</span>
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </Link>
    </motion.article>
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

interface Props {
  services: Service[];
}

export default function ServicesPageClient({ services }: Props) {
  return (
    <SiteLayout>
      <div className="flex min-h-full flex-1 flex-col bg-slate-900">
        <section className="bg-slate-900 pb-12 pt-24 sm:pb-14 sm:pt-28 md:pb-16 md:pt-32" aria-label="Sayfa başlığı">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Hizmetlerimiz</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Profesyonel temizlik çözümleri ile yaşam alanlarınızı pırıl pırıl yapıyoruz. Size özel hizmetlerimizi keşfedin.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {DISTRICT_LANDINGS.slice(0, 4).map((district) => (
                <Link
                  key={district.slug}
                  href={`/bolgeler/${district.slug}`}
                  className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300"
                >
                  {district.name} hizmet sayfaları
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="flex-1 border-t border-slate-800 bg-slate-50 py-16 dark:bg-slate-900" aria-label="Hizmetler listesi">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 rounded-xl border border-slate-300 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Populer temizlik aramalari</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { href: '/hizmetler/ofis-temizligi', label: 'Ofis Temizligi Istanbul' },
                  { href: '/hizmetler/insaat-sonrasi-temizlik', label: 'Insaat Sonrasi Temizlik Istanbul' },
                  { href: '/hizmetler/ev-temizligi', label: 'Ev Temizligi Istanbul' },
                  { href: '/hizmetler/koltuk-yikama', label: 'Koltuk Yikama Istanbul' },
                  { href: '/randevu', label: 'Temizlik Randevu ve Kesif' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 transition-colors hover:border-emerald-500/60 hover:text-emerald-700 dark:border-slate-600 dark:text-slate-200 dark:hover:text-emerald-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {services.length === 0 ? (
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

            <div className="mt-10 rounded-xl border border-slate-300 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                Hizmete gore rehber yazilari
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PRIORITY_BLOG_LINKS.slice(0, 6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-700 underline decoration-slate-400/70 underline-offset-4 transition-colors hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
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
