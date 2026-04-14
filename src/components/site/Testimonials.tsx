/**
 * @fileoverview Testimonials Component
 * @description Müşteri yorumları carousel bileşeni.
 * Auto-play, keyboard navigation, ve accessibility desteği ile.
 *
 * @example
 * <Testimonials />
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote, Loader2, Pause, Play } from 'lucide-react';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Testimonial veri tipi */
interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  content: string;
  avatar?: string;
  service?: string;
  isActive: boolean;
}

/** Testimonials component props */
interface TestimonialsProps {
  /** Auto-play interval (ms) - varsayılan: 5000 */
  autoPlayInterval?: number;
  /** Başlangıçta auto-play aktif mi - varsayılan: true */
  autoPlay?: boolean;
  /**
   * Sunucudan gelen veri (ör. /referanslar). Verilirse istemci fetch yapılmaz; SEO ve LCP için.
   */
  initialTestimonials?: Testimonial[];
}

// ============================================
// COMPONENT
// ============================================

/**
 * Testimonials Carousel Component
 * @param autoPlayInterval Auto-play interval in milliseconds
 * @param autoPlay Whether auto-play is enabled initially
 */
export function Testimonials({
  autoPlayInterval = 5000,
  autoPlay = true,
  initialTestimonials,
}: TestimonialsProps) {
  const serverHydrated = initialTestimonials !== undefined;
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() =>
    serverHydrated ? initialTestimonials! : []
  );
  const [loading, setLoading] = useState(!serverHydrated);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (serverHydrated) return;
    if (!isMounted) return;

    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/testimonials');
        if (!res.ok) throw new Error('Failed to fetch testimonials');
        const data = await res.json();
        setTestimonials(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error('Error fetching testimonials', {}, error instanceof Error ? error : undefined);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [isMounted, serverHydrated]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  const next = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // ============================================
  // AUTO-PLAY LOGIC
  // ============================================

  useEffect(() => {
    if (!isAutoPlaying || isPaused || testimonials.length <= 1) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isPaused, testimonials.length, autoPlayInterval]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [next, prev, toggleAutoPlay]);

  // ============================================
  // VISIBILITY API (pause when tab hidden)
  // ============================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  // Sunucu verisi yoksa: mount + fetch beklenir
  if (!serverHydrated && (!isMounted || loading)) {
    return (
      <section
        className="relative bg-slate-900 py-24 overflow-hidden"
        aria-label="Müşteri yorumları yükleniyor"
      >
        <div className="flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" aria-hidden="true" />
          <span className="sr-only">Müşteri yorumları yükleniyor...</span>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (testimonials.length === 0) {
    return (
      <section
        className="relative bg-slate-900 py-24 overflow-hidden"
        aria-label="Henüz yorum yok"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-950" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <Quote className="h-16 w-16 text-emerald-400/50 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white mb-2">Müşteri Yorumları</h2>
            <p className="text-slate-400">Henüz yorum bulunmuyor.</p>
          </motion.div>
        </div>
      </section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  // Animation variants (respect reduced motion)
  const slideVariants = {
    enter: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.9, x: 100 },
    center: { opacity: 1, scale: 1, x: 0 },
    exit: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.9, x: -100 },
  };

  return (
    <section
      ref={containerRef}
      className="relative bg-slate-900 py-24 overflow-hidden"
      tabIndex={0}
      aria-label="Müşteri yorumları carousel"
      role="region"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-950" />
      <div
        className="absolute top-1/2 left-1/2 h-[min(80vw,800px)] w-[min(80vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400 border border-emerald-500/20"
          >
            <Quote size={14} />
            Müşteri Yorumları
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            Bizim İçin Ne Dediler?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto"
          >
            İstanbul’da ev temizliği, ofis temizliği, inşaat sonrası, halı ve koltuk yıkama gibi
            profesyonel temizlik hizmetlerimizi deneyimleyen müşterilerimizin gerçek yorumları.
          </motion.p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Live region for screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {currentTestimonial && (
              <>
                {currentIndex + 1} / {testimonials.length}: {currentTestimonial.name} - {currentTestimonial.content.substring(0, 100)}...
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.5, ease: 'easeInOut' }}
              className="relative"
              aria-roledescription="slide"
              aria-label={`${currentIndex + 1} / ${testimonials.length}`}
            >
              {/* Main Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 sm:p-12 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                {/* Quote Icon */}
                <div className="absolute -top-6 left-8 sm:left-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                    <Quote className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-6 mt-4">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl text-slate-200 leading-relaxed mb-8"
                >
                  &ldquo;{currentTestimonial.content}&rdquo;
                </motion.p>

                {/* Author */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-2xl border border-emerald-500/30">
                      {currentTestimonial.avatar || '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">
                        {currentTestimonial.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {currentTestimonial.location}
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400 border border-emerald-500/20">
                    {currentTestimonial.service}
                  </span>
                </motion.div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-3xl blur-2xl -z-10" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
              onClick={prev}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-emerald-500 border border-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Önceki yorum"
              title="Önceki (Sol ok)"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </motion.button>

            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="Yorum slaytları"
            >
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.2 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`${index + 1}. yoruma git`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${index === currentIndex
                      ? 'h-2.5 w-6 bg-emerald-500'
                      : 'h-2.5 w-2.5 bg-slate-600 hover:bg-slate-500'
                      }`}
                    aria-hidden
                  />
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
              onClick={next}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white transition-all hover:bg-emerald-500 border border-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Sonraki yorum"
              title="Sonraki (Sağ ok)"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </motion.button>
          </div>

          {/* Auto-play indicator */}
          <div className="flex justify-center mt-4">
            <button
              onClick={toggleAutoPlay}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${isAutoPlaying
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                : 'text-slate-500 bg-slate-800 border border-slate-700'
                }`}
              aria-label={isAutoPlaying ? 'Otomatik oynatmayı durdur' : 'Otomatik oynatmayı başlat'}
              title="Boşluk tuşu ile toggle"
            >
              {isAutoPlaying ? (
                <>
                  <Pause size={14} aria-hidden="true" />
                  <span>Otomatik</span>
                </>
              ) : (
                <>
                  <Play size={14} aria-hidden="true" />
                  <span>Manuel</span>
                </>
              )}
            </button>
          </div>

          {/* Keyboard hints (visible on focus) */}
          <div className="sr-only focus:not-sr-only focus:absolute focus:bottom-0 focus:left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1 rounded-full">
            ← → ok tuşları ile gezin, Boşluk ile oynat/duraklat
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
