/**
 * @fileoverview Team Section Component
 * @description Ekip üyelerini gösteren grid layout bileşeni.
 * Hover animasyonları, accessibility, ve lazy loading ile.
 *
 * @example
 * <TeamSection />
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Mail, Phone, Globe, User, Sparkles } from 'lucide-react';
import Image from 'next/image';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Team member veri tipi */
interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  isActive: boolean;
  order?: number;
}

/** TeamSection component props */
interface TeamSectionProps {
  /** Max gösterilecek üye sayısı */
  limit?: number;
  /** Gösterilecek departman filtresi */
  department?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Team Section Component
 * @param limit Maximum number of members to display
 * @param department Filter by department
 */
export function TeamSection({ limit, department }: TeamSectionProps = {}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false); // SSR hydration fix
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
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

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/team');
        if (!res.ok) throw new Error('Failed to fetch team');
        const data = await res.json();
        setMembers(Array.isArray(data) ? data.filter((m: TeamMember) => m.isActive) : []);
      } catch (error) {
        logger.error('Error fetching team', {}, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [isMounted]);

  // ============================================
  // MEMOIZED FILTERED MEMBERS
  // ============================================
  const displayMembers = useMemo(() => {
    let filtered = members;

    if (department) {
      filtered = filtered.filter(m =>
        m.position.toLowerCase().includes(department.toLowerCase())
      );
    }

    // Sort by order if available
    filtered = filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [members, limit, department]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleMouseEnter = useCallback((id: string) => {
    setHoveredId(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  const handleFocus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedId(null);
  }, []);

  // ============================================
  // LOADING / MOUNTING STATE
  // ============================================
  if (!isMounted || loading) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Ekip üyeleri yükleniyor"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100" aria-hidden="true" />
        <div className="relative flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" aria-hidden="true" />
          <span className="sr-only">Ekip üyeleri yükleniyor...</span>
        </div>
      </section>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (displayMembers.length === 0) {
    return (
      <section
        className="relative py-24 overflow-hidden"
        aria-label="Ekip bilgisi"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          >
            <User className="h-16 w-16 text-emerald-300 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ekibimiz</h2>
            <p className="text-slate-600">Henüz ekip bilgisi bulunmuyor.</p>
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
      aria-label="Profesyonel ekibimiz"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" aria-hidden="true" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" aria-hidden="true" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="h-px w-8 bg-emerald-500" />
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <span className="h-px w-8 bg-emerald-500" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent">
            Profesyonel Ekibimiz
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Deneyimli ve uzman kadromuzla her zaman yanınızdayız
          </p>
        </motion.div>

        {/* Team Grid */}
        <div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="list"
          aria-label="Ekip üyeleri listesi"
        >
          {displayMembers.map((member, index) => (
            <motion.article
              key={member.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: shouldReduceMotion ? 0 : index * 0.1,
                duration: shouldReduceMotion ? 0 : 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              onMouseEnter={() => handleMouseEnter(member.id)}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleFocus(member.id)}
              onBlur={handleBlur}
              className="group relative"
              role="listitem"
              tabIndex={0}
              aria-label={`${member.name}, ${member.position}`}
            >
              {/* Card */}
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-500/10 group-hover:-translate-y-2 focus-within:shadow-2xl focus-within:shadow-emerald-500/10 focus-within:-translate-y-2 focus-within:ring-2 focus-within:ring-emerald-500/50">
                {/* Image Container */}
                <div className="relative h-72 overflow-hidden">
                  <motion.div
                    animate={{
                      scale: (hoveredId === member.id || focusedId === member.id) && !shouldReduceMotion ? 1.1 : 1
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
                    className="absolute inset-0"
                  >
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={`${member.name} - ${member.position}`}
                        fill
                        className="object-cover"
                        loading={index < 4 ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                        <User className="h-24 w-24 text-emerald-300" aria-hidden="true" />
                      </div>
                    )}
                  </motion.div>

                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent transition-opacity duration-500 ${hoveredId === member.id || focusedId === member.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    aria-hidden="true"
                  />

                  {/* Social Links - Appear on Hover/Focus */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: hoveredId === member.id || focusedId === member.id ? 1 : 0,
                      y: hoveredId === member.id || focusedId === member.id ? 0 : 20
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="absolute bottom-4 left-0 right-0 flex justify-center gap-3"
                  >
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-emerald-500 focus:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label={`${member.name} için e-posta gönder`}
                        title="E-posta"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-emerald-500 focus:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label={`${member.name} için telefon et`}
                        title="Telefon"
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-emerald-500 focus:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label={`${member.name} LinkedIn profili (yeni sekme)`}
                        title="LinkedIn"
                      >
                        <Globe className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-emerald-600 font-medium text-sm mb-3">
                    {member.position}
                  </p>

                  {/* Animated Border */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: (hoveredId === member.id || focusedId === member.id) && !shouldReduceMotion ? 1 : 0
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="h-0.5 w-16 mx-auto bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full mb-3"
                    aria-hidden="true"
                  />

                  {member.bio && (
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
