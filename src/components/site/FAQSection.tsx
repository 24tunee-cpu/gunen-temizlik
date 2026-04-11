/**
 * @fileoverview FAQ Section Component
 * @description Sıkça sorulan sorular (SSS) bölümü.
 * Arama, kategori filtreleme, accordion, ve accessibility desteği ile.
 *
 * @example
 * <FAQSection />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, ChevronDown, ChevronUp, HelpCircle, Search, MessageCircle } from 'lucide-react';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** FAQ veri tipi */
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
}

/** FAQSection component props */
interface FAQSectionProps {
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// SKELETON COMPONENT
// ============================================

/**
 * FAQ Skeleton Item
 */
function FAQSkeletonItem({ index }: { index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.05 }}
      className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-slate-600" />
        <div className="h-5 flex-1 animate-pulse rounded bg-slate-600" />
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * FAQ Section Component
 * @param title Section title
 * @param description Section description
 */
export function FAQSection({
  title = "Sıkça Sorulan Sorular",
  description = "Aklınıza takılan soruların cevaplarını burada bulabilirsiniz"
}: FAQSectionProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

    const fetchFAQs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/faq');
        if (!res.ok) throw new Error('Failed to fetch FAQs');
        const data = await res.json();
        setFaqs(Array.isArray(data) ? data.filter((f: FAQ) => f.isActive) : []);
      } catch (error) {
        logger.error('Error fetching FAQs', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [isMounted]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const categories = useMemo(() =>
    ['Tümü', ...new Set(faqs.map((f) => f.category))],
    [faqs]
  );

  const filteredFAQs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'Tümü' || faq.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setExpandedId(null); // Reset expanded when category changes
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleFAQ = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFAQ(id);
    }
  }, [toggleFAQ]);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  if (!isMounted || loading) {
    return (
      <section
        className="relative flex-1 bg-slate-900 py-16 sm:py-20 md:py-24"
        aria-label="SSS yükleniyor"
      >
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">{description}</p>
          </div>

          {/* Skeleton FAQ Items */}
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <FAQSkeletonItem key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE (no FAQs at all)
  // ============================================
  if (faqs.length === 0) {
    return (
      <section
        className="relative flex-1 bg-slate-900 py-16 sm:py-20 md:py-24"
        aria-label="Sıkça sorulan sorular"
      >
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <HelpCircle className="mx-auto mb-4 h-16 w-16 text-emerald-400" aria-hidden="true" />
            <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
            <p className="text-slate-400">Henüz SSS öğesi bulunmuyor.</p>
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
      className="relative flex-1 bg-slate-900 py-16 sm:py-20 md:py-24"
      aria-label="Sıkça sorulan sorular"
    >
      <div className="relative mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
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
            <HelpCircle className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {description}
          </p>
        </motion.header>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
          className="relative mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Soru ara..."
              className="w-full rounded-2xl border border-slate-600 bg-slate-800 py-4 pl-12 pr-4 text-white shadow-sm placeholder:text-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              aria-label="Soru ara"
              aria-describedby="faq-search-desc"
            />
          </div>
          <span id="faq-search-desc" className="sr-only">
            Sorular arasında arama yapın
          </span>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
          role="tablist"
          aria-label="SSS kategorileri"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.1 + index * 0.05 }}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${selectedCategory === category
                ? 'scale-105 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-emerald-400'
                }`}
              role="tab"
              aria-selected={selectedCategory === category}
              aria-label={`${category} kategorisi`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <div
          className="space-y-4"
          role="tabpanel"
          aria-label={`${selectedCategory} kategorisi soruları`}
        >
          <AnimatePresence mode="wait">
            {filteredFAQs.map((faq, index) => (
              <motion.article
                key={faq.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? -10 : -20 }}
                transition={{ delay: shouldReduceMotion ? 0 : index * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  onKeyDown={(e) => handleKeyDown(e, faq.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-inset sm:items-center sm:p-6"
                  aria-expanded={expandedId === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                  id={`faq-question-${faq.id}`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400 sm:mt-0"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words font-semibold text-white">{faq.question}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="mt-1 shrink-0 sm:mt-0"
                    aria-hidden="true"
                  >
                    {expandedId === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    )}
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-question-${faq.id}`}
                    >
                      <div className="px-4 pb-4 pl-14 sm:px-6 sm:pb-6 sm:pl-[4.5rem]">
                        <div className="mb-4 h-px w-full bg-gradient-to-r from-emerald-500/40 to-transparent" aria-hidden="true" />
                        <p className="break-words leading-relaxed text-slate-300">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State (search/category filter) */}
        {filteredFAQs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
            role="status"
            aria-live="polite"
          >
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-slate-500" aria-hidden="true" />
            <p className="text-slate-400">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;
