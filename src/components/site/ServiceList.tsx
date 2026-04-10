/**
 * @fileoverview Service List Component
 * @description Basit hizmet listesi bileşeni.
 * Grid layout, animasyon, ve accessibility desteği ile.
 *
 * @example
 * <ServiceList services={services} />
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

// ============================================
// TYPES
// ============================================

/** Service veri tipi */
interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  image?: string;
  icon?: string;
}

/** ServiceList component props */
interface ServiceListProps {
  /** Hizmet listesi */
  services: Service[];
  /** Grid sütun sayısı (responsive için) */
  columns?: 2 | 3 | 4;
}

/** ServiceCard component props */
interface ServiceCardProps {
  service: Service;
  index: number;
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

  // Animation delay based on reduced motion preference
  const delay = useMemo(() =>
    shouldReduceMotion ? 0 : index * 0.1
    , [index, shouldReduceMotion]);

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: shouldReduceMotion ? 0.2 : 0.5 }}
      whileHover={shouldReduceMotion ? {} : { y: -8 }}
      className="group relative"
    >
      <Link
        href={`/hizmetler/${service.slug}`}
        className="block h-full focus:outline-none"
        aria-label={`${service.title}: ${service.shortDesc}`}
      >
        <div className="relative h-full overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-shadow group-hover:shadow-2xl group-focus-visible:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
          <div
            className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 blur transition-opacity group-hover:opacity-30 group-focus-visible:opacity-30"
            aria-hidden="true"
          />
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
            aria-hidden="true"
          >
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900">{service.title}</h3>
          <p className="mb-4 text-slate-600">{service.shortDesc}</p>
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <span>Detaylar</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Service List Component
 * @param services List of services to display
 * @param columns Number of grid columns (default: responsive)
 */
export function ServiceList({ services, columns }: ServiceListProps) {
  // Grid columns class based on prop
  const gridClass = useMemo(() => {
    if (columns === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (columns === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }, [columns]);

  return (
    <div
      className={`grid gap-6 ${gridClass}`}
      role="list"
      aria-label="Hizmet kartları"
    >
      {services.map((service, index) => (
        <ServiceCard key={service.id} service={service} index={index} />
      ))}
    </div>
  );
}

export default ServiceList;
