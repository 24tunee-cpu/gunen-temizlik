/**
 * @fileoverview Gallery Section Component
 * @description Galeri bölümü bileşeni.
 * Lightbox entegrasyonu, kategori filtreleme, ve masonry layout ile.
 *
 * @example
 * <GallerySection />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, Image as ImageIcon, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Gallery item veri tipi */
interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  isActive: boolean;
}

/** GallerySection component props */
interface GallerySectionProps {
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// SKELETON COMPONENT
// ============================================

/**
 * Gallery Skeleton Item
 */
function GallerySkeletonItem({ index }: { index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.05 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-200 ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-slate-300 animate-pulse" />
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Gallery Section Component
 * @param title Section title
 * @param description Section description
 */
export function GallerySection({
  title = "Galeri",
  description = "Temizlik çalışmalarımızdan örnekler ve başarı hikayelerimiz"
}: GallerySectionProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Failed to fetch gallery');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((i: GalleryItem) => i.isActive) : []);
      } catch (error) {
        logger.error('Error fetching gallery', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [isMounted]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const categories = useMemo(() =>
    ['Tümü', ...new Set(items.map((i) => i.category))],
    [items]
  );

  const filteredItems = useMemo(() =>
    selectedCategory === 'Tümü'
      ? items
      : items.filter((i) => i.category === selectedCategory),
    [items, selectedCategory]
  );

  const lightboxSlides = useMemo(() =>
    filteredItems.map((item) => ({ src: item.image, title: item.title })),
    [filteredItems]
  );

  // ============================================
  // HANDLERS
  // ============================================
  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleMouseEnter = useCallback((id: string) => {
    setHoveredId(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  if (!isMounted || loading) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Galeri yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <GallerySkeletonItem key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE (no items at all)
  // ============================================
  if (items.length === 0) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Galeri"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <ImageIcon className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600">Henüz galeri öğesi bulunmuyor.</p>
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
      aria-label="Galeri"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />
      <div className="absolute top-1/3 -left-32 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 15 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6"
            aria-hidden="true"
          >
            <ImageIcon className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.header>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
          role="tablist"
          aria-label="Galeri kategorileri"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.1 + index * 0.05 }}
              onClick={() => handleCategoryChange(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                }`}
              role="tab"
              aria-selected={selectedCategory === category}
              aria-label={`${category} kategorisi`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Gallery Grid - Masonry Style */}
        <motion.div
          layout
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="tabpanel"
          aria-label={`${selectedCategory} kategorisi görselleri`}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: shouldReduceMotion ? 0.9 : 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: shouldReduceMotion ? 0.9 : 0.8 }}
                transition={{
                  duration: shouldReduceMotion ? 0.2 : 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => openLightbox(index)}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-500 ${index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                aria-label={`${item.title} - ${item.category}`}
              >
                <motion.div
                  animate={{ scale: hoveredId === item.id && !shouldReduceMotion ? 1.1 : 1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                </motion.div>

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  aria-hidden="true"
                />

                {/* Zoom Icon */}
                <div
                  className={`absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 ${hoveredId === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                  aria-hidden="true"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div
                  className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-300 ${hoveredId === item.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                  <span className="inline-block px-3 py-1 mb-3 text-xs font-medium text-emerald-400 bg-emerald-500/20 rounded-full backdrop-blur-sm">
                    {item.category}
                  </span>
                  <h3 className="font-semibold text-lg text-white mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-300 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State (no items in selected category) */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
            role="status"
            aria-live="polite"
          >
            <ImageIcon className="mx-auto h-16 w-16 text-slate-300 mb-4" aria-hidden="true" />
            <p className="text-slate-500">Bu kategoride henüz görsel yok</p>
          </motion.div>
        )}

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={closeLightbox}
          index={currentImageIndex}
          slides={lightboxSlides}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
          }}
        />
      </div>
    </section>
  );
}

export default GallerySection;
