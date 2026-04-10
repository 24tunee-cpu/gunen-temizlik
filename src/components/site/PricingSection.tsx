/**
 * @fileoverview Pricing Section Component
 * @description Fiyatlandırma bölümü bileşeni.
 * API'den fiyat verilerini çeker, skeleton loading, ve CTA butonları ile.
 *
 * @example
 * <PricingSection />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Check, DollarSign, ArrowRight } from 'lucide-react';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Pricing veri tipi */
interface Pricing {
  id: string;
  serviceName: string;
  basePrice: number;
  pricePerSqm?: number;
  unit: string;
  minPrice?: number;
  description?: string;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
}

/** PricingSection component props */
interface PricingSectionProps {
  /** Fiyat limiti (varsayılan: tümü) */
  limit?: number;
  /** CTA buton tıklama handler'ı */
  onCtaClick?: (pricing: Pricing) => void;
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// SKELETON COMPONENT
// ============================================

/**
 * Pricing Card Skeleton
 */
function PricingCardSkeleton({ index, isPopular = false }: { index: number; isPopular?: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.1 }}
      className={`relative ${isPopular ? 'lg:scale-105 lg:-my-4' : ''}`}
      aria-hidden="true"
    >
      <div className={`relative h-full bg-white rounded-3xl p-8 shadow-lg ${isPopular ? 'border-2 border-emerald-200' : 'border border-slate-100'}`}>
        <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-12 w-1/2 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="h-px w-full bg-slate-200 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Pricing Section Component
 * @param limit Maximum number of pricing items to display
 * @param onCtaClick Callback when CTA button is clicked
 * @param title Section title
 * @param description Section description
 */
export function PricingSection({
  limit,
  onCtaClick,
  title = "Şeffaf Fiyatlar",
  description = "Rekabetçi ve şeffaf fiyatlarla profesyonel temizlik hizmetleri"
}: PricingSectionProps) {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  // ============================================
  // MOUNT CHECK (SSR hydration fix)
  // ============================================
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // DATA FETCHING
  // ============================================
  useEffect(() => {
    if (!isMounted) return;

    const fetchPricing = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pricing');
        if (!res.ok) throw new Error('Failed to fetch pricing');
        const data = await res.json();
        let filtered = Array.isArray(data) ? data.filter((p: Pricing) => p.isActive) : [];
        if (limit) filtered = filtered.slice(0, limit);
        setPricing(filtered);
      } catch (error) {
        logger.error('Error fetching pricing', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [isMounted, limit]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const headerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: shouldReduceMotion ? 15 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.2 : 0.6 }
    }
  }), [shouldReduceMotion]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCtaClick = useCallback((item: Pricing) => {
    if (onCtaClick) {
      onCtaClick(item);
    } else {
      // Default behavior: navigate to contact page with service info
      const params = new URLSearchParams({
        service: item.serviceName,
        price: item.basePrice.toString()
      });
      window.location.href = `/iletisim?${params.toString()}`;
    }
  }, [onCtaClick]);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  if (!isMounted || loading) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Fiyatlar yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-emerald-500" />
              <DollarSign className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span className="h-px w-8 bg-emerald-500" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[1, 2, 3].map((_, index) => (
              <PricingCardSkeleton key={index} index={index} isPopular={index === 1} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (pricing.length === 0) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Fiyat bilgisi"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <DollarSign className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Fiyatlandırma</h2>
            <p className="text-slate-600">Henüz fiyat bilgisi bulunmuyor.</p>
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
      className="relative py-24 overflow-hidden"
      aria-label="Fiyatlandırma"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.header
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
            className="inline-flex items-center gap-2 mb-4"
            aria-hidden="true"
          >
            <span className="h-px w-8 bg-emerald-500" />
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.header>

        {/* Pricing Cards */}
        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Fiyat paketleri"
        >
          {pricing.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: shouldReduceMotion ? 0 : index * 0.1,
                duration: shouldReduceMotion ? 0.2 : 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`relative group ${item.isPopular ? 'lg:scale-105 lg:-my-4' : ''}`}
              role="listitem"
              aria-label={`${item.serviceName} - ${item.basePrice} TL`}
            >
              {/* Popular Badge */}
              {item.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/30">
                    En Popüler
                  </span>
                </div>
              )}

              <div className={`relative h-full bg-white rounded-3xl p-8 shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 group-focus-within:shadow-2xl group-focus-within:-translate-y-2 ${item.isPopular
                ? 'border-2 border-emerald-500 shadow-emerald-500/10'
                : 'border border-slate-100'
                }`}>
                {/* Service Name */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {item.serviceName}
                </h3>

                {item.description && (
                  <p className="text-slate-500 text-sm mb-6">{item.description}</p>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                      {item.basePrice} TL
                    </span>
                    <span className="text-slate-400">/başlangıç</span>
                  </div>

                  {item.pricePerSqm && (
                    <p className="text-sm text-slate-500 mt-2">
                      +{item.pricePerSqm} TL / {item.unit}
                    </p>
                  )}

                  {item.minPrice && (
                    <p className="text-xs text-slate-400 mt-1">
                      Minimum {item.minPrice} TL
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-emerald-100 to-transparent mb-6" aria-hidden="true" />

                {/* Features */}
                {item.features.length > 0 && (
                  <ul className="space-y-3 mb-8">
                    {item.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: shouldReduceMotion ? 0 : 0.1 + i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5" aria-hidden="true">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </span>
                        <span className="text-slate-600 text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleCtaClick(item)}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group/btn focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${item.isPopular
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  aria-label={`${item.serviceName} için teklif al`}
                >
                  Teklif Al
                  <ArrowRight className={`h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1 ${item.isPopular ? 'text-white' : 'text-slate-600'
                    }`} aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
