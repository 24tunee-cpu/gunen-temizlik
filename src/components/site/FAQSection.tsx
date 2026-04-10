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
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      aria-hidden="true"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
        <div className="flex-1 h-5 bg-slate-200 rounded animate-pulse" />
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
        className="relative py-24 overflow-hidden"
        aria-label="SSS yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
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
        className="relative py-24 overflow-hidden"
        aria-label="Sıkça sorulan sorular"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <HelpCircle className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600">Henüz SSS öğesi bulunmuyor.</p>
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
      aria-label="Sıkça sorulan sorular"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Soru ara..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category
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
                className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  onKeyDown={(e) => handleKeyDown(e, faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                  aria-expanded={expandedId === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                  id={`faq-question-${faq.id}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 font-semibold text-sm"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-900 pr-8">{faq.question}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="flex-shrink-0"
                    aria-hidden="true"
                  >
                    {expandedId === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
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
                      <div className="px-6 pb-6 pl-[4.5rem]">
                        <div className="h-px w-full bg-gradient-to-r from-emerald-200 to-transparent mb-4" aria-hidden="true" />
                        <p className="text-slate-600 leading-relaxed">
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
            <MessageCircle className="mx-auto h-16 w-16 text-slate-300 mb-4" aria-hidden="true" />
            <p className="text-slate-500">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;
