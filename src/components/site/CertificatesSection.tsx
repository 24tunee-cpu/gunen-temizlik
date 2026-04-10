/**
 * @fileoverview Certificates Section Component
 * @description Sertifikalar bölümü bileşeni.
 * Sertifika grid, hover efektleri, doğrulama linkleri ve accessibility desteği ile.
 *
 * @example
 * <CertificatesSection />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Award, Calendar, ExternalLink, Shield } from 'lucide-react';
import Image from 'next/image';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Sertifika veri tipi */
interface Certificate {
  id: string;
  title: string;
  organization: string;
  issueDate: string;
  expiryDate?: string;
  image?: string;
  verificationUrl?: string;
  description?: string;
  isActive: boolean;
}

/** CertificatesSection component props */
interface CertificatesSectionProps {
  /** Başlık metni */
  title?: string;
  /** Açıklama metni */
  description?: string;
}

// ============================================
// SKELETON COMPONENT
// ============================================

/**
 * Certificate Skeleton Card
 */
function CertificateSkeletonCard({ index }: { index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.05 }}
      className="relative bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100"
      aria-hidden="true"
    >
      <div className="h-56 bg-slate-200 animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Certificates Section Component
 * @param title Section title
 * @param description Section description
 */
export function CertificatesSection({
  title = "Sertifikalarımız",
  description = "Kalitemizi kanıtlayan uluslararası sertifikalar ve belgeler"
}: CertificatesSectionProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [isMounted, setIsMounted] = useState(false);
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

    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/certificates');
        if (!res.ok) throw new Error('Failed to fetch certificates');
        const data = await res.json();
        setCertificates(Array.isArray(data) ? data.filter((c: Certificate) => c.isActive) : []);
      } catch (error) {
        logger.error('Error fetching certificates', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [isMounted]);

  // ============================================
  // MEMOIZED FORMATTERS
  // ============================================
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
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
        aria-label="Sertifikalar yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">{title}</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <CertificateSkeletonCard key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE (no certificates at all)
  // ============================================
  if (certificates.length === 0) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Sertifikalar"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <Award className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600">Henüz sertifika bulunmuyor.</p>
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
      aria-label="Sertifikalarımız"
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
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6"
            aria-hidden="true"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.header>

        {/* Certificates Grid */}
        <div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Sertifika listesi"
        >
          {certificates.map((cert, index) => (
            <motion.article
              key={cert.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: shouldReduceMotion ? 0 : index * 0.1,
                duration: shouldReduceMotion ? 0.2 : 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              onMouseEnter={() => handleMouseEnter(cert.id)}
              onMouseLeave={handleMouseLeave}
              className="group relative"
              role="listitem"
              aria-label={`${cert.title} - ${cert.organization}`}
            >
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-500/10 group-hover:-translate-y-2">
                {/* Certificate Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {cert.image ? (
                    <motion.div
                      animate={{ scale: hoveredId === cert.id && !shouldReduceMotion ? 1.05 : 1 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={cert.image}
                        alt={cert.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center" aria-hidden="true">
                      <Award className="h-20 w-20 text-emerald-300" />
                    </div>
                  )}

                  {/* Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-900/40 to-transparent transition-opacity duration-300 ${hoveredId === cert.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    aria-hidden="true"
                  />

                  {/* Verification Link Badge */}
                  {cert.verificationUrl && (
                    <motion.a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: hoveredId === cert.id ? 1 : 0,
                        y: hoveredId === cert.id ? 0 : -10
                      }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-emerald-50 transition-colors"
                      aria-label="Sertifikayı doğrula"
                    >
                      <ExternalLink className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    </motion.a>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl" aria-hidden="true">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {cert.title}
                      </h3>
                      <p className="text-emerald-600 text-sm font-medium">
                        {cert.organization}
                      </p>
                    </div>
                  </div>

                  {cert.description && (
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {cert.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{formatDate(cert.issueDate)}</span>
                    </div>
                    {cert.expiryDate && (
                      <div className="text-slate-400">
                        - {formatDate(cert.expiryDate)}
                      </div>
                    )}
                  </div>

                  {/* Animated Border */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hoveredId === cert.id ? 1 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="h-0.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full mt-4"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CertificatesSection;
