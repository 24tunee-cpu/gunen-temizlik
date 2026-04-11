/**
 * @fileoverview Services Content Component
 * @description Hizmetler bölümü bileşeni.
 * Kart bazlı layout, lazy loading, ve accessibility desteği ile.
 *
 * @example
 * <ServicesContent services={services} />
 */

'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useMemo, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

/** Service veri tipi */
interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  icon?: string;
}

/** ServiceCard component props */
interface ServiceCardProps {
  service: Service;
  index: number;
}

/** ServicesContent component props */
interface ServicesContentProps {
  /** Hizmet listesi */
  services: Service[];
  /** Yükleniyor durumu */
  isLoading?: boolean;
  /** Görüntülenecek maksimum hizmet sayısı */
  limit?: number;
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// SERVICE CARD COMPONENT
// ============================================

/**
 * Service Card Component
 * @param service Service data
 * @param index Card index for stagger animation
 */
function ServiceCard({ service, index }: ServiceCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const delay = useMemo(() =>
    shouldReduceMotion ? 0 : index * 0.1
    , [index, shouldReduceMotion]);

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: shouldReduceMotion ? 0.2 : 0.5 }}
    >
      <Link
        href={`/hizmetler/${service.slug}`}
        className="group block h-full focus:outline-none"
        aria-label={`${service.title}: ${service.shortDesc}`}
      >
        <div className="relative h-full">
          {/* Glow Effect Background */}
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl opacity-0 blur transition duration-500 group-hover:opacity-30 group-focus-visible:opacity-30"
            aria-hidden="true"
          />

          {/* Card Content */}
          <div className="relative h-full rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1 group-focus-visible:shadow-2xl group-focus-visible:-translate-y-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
            {/* Icon Container with 3D Effect (reduced motion safe) */}
            <motion.div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 shadow-inner"
              whileHover={shouldReduceMotion ? {} : { rotateY: 15, rotateX: -15 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ transformStyle: shouldReduceMotion ? "flat" : "preserve-3d" }}
              aria-hidden="true"
            >
              <Sparkles className="h-7 w-7" />
            </motion.div>

            <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              {service.title}
            </h3>
            <p className="text-slate-600 line-clamp-3">{service.shortDesc}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-emerald-600">
              <span className="group-hover:mr-1 transition-all">Detaylar</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

/**
 * Service Card Skeleton
 */
function ServiceCardSkeleton({ index }: { index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.1 }}
      className="relative h-full rounded-2xl bg-white/50 backdrop-blur-sm p-6 border border-white/20"
      aria-hidden="true"
    >
      <div className="mb-4 h-14 w-14 rounded-xl bg-slate-200 animate-pulse" />
      <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-1" />
      <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Services Content Component
 * @param services List of services to display
 * @param isLoading Loading state
 * @param limit Maximum number of services to show
 * @param title Section title
 * @param description Section description
 */
export function ServicesContent({
  services,
  isLoading = false,
  limit,
  title = "Profesyonel Temizlik Hizmetleri",
  description = "İş yeriniz veya yaşam alanınız için özel temizlik çözümleri"
}: ServicesContentProps) {
  const shouldReduceMotion = useReducedMotion();

  // Memoize filtered services
  const displayServices = useMemo(() => {
    if (limit) {
      return services.slice(0, limit);
    }
    return services;
  }, [services, limit]);

  // Animation variants
  const headerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: shouldReduceMotion ? 10 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.2 : 0.6 }
    }
  }), [shouldReduceMotion]);

  // Button animation
  const buttonArrowAnimation = useMemo(() => ({
    x: [0, 4, 0],
    transition: { repeat: Infinity, duration: 1.5 }
  }), []);
  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <section
        className="relative bg-slate-50 py-24 overflow-hidden"
        aria-label="Hizmetler yükleniyor"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700 mb-4">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Hizmetlerimiz
            </div>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{description}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
              <ServiceCardSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (displayServices.length === 0) {
    return (
      <section
        className="relative bg-slate-50 py-24 overflow-hidden"
        aria-label="Hizmetler"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <Sparkles className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hizmetlerimiz</h2>
            <p className="text-slate-600">Henüz hizmet bilgisi bulunmuyor.</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <section
      className="relative bg-slate-50 py-24 overflow-hidden"
      aria-label="Profesyonel temizlik hizmetleri"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50" aria-hidden="true" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2" aria-hidden="true" />
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          className="mb-16 text-center"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Hizmetlerimiz
          </motion.span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {description}
          </p>
        </motion.header>

        {/* Services Grid */}
        <div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Hizmet kartları"
        >
          {displayServices.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* View All Link */}
        {services.length > (limit || 0) && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/hizmetler"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Tüm hizmetleri görüntüle"
            >
              <span>Tüm Hizmetler</span>
              <motion.span
                animate={shouldReduceMotion ? {} : buttonArrowAnimation}
                aria-hidden="true"
              >
                <ArrowRight size={18} />
              </motion.span>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default ServicesContent;
