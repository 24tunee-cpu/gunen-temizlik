/**
 * @fileoverview Team Page
 * @description Ekibimiz sayfası - profesyonel ekip üyeleri.
 * API'den dinamik veri çeken, animasyonlu client component.
 *
 * @architecture
 * - Client Component (Client-Side Rendering)
 * - API data fetching from /api/team
 * - Framer Motion animations with reduced motion support
 * - Admin'den yönetilen dinamik ekip
 *
 * @admin-sync
 * Ekip üyeleri admin paneldeki /admin/ekip sayfasından yönetilir.
 * API üzerinden otomatik çekilir.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import SiteLayout from '../site/layout';
import { Users, Phone, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import logger from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Ekip üyesi veri tipi */
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  isActive: boolean;
}

/** Sayfa state tipi */
interface PageState {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Team Card Component
 * Individual team member display with animation.
 * 
 * @param member Team member data
 * @param index Index for stagger animation
 */
function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 20 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.1,
        duration: shouldReduceMotion ? 0.2 : 0.5
      }}
      className="group rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl"
    >
      {/* Avatar */}
      <div className="mb-6 flex justify-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          {member.image ? (
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-5xl font-bold text-emerald-400 dark:text-emerald-500">
                {member.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{member.name}</h3>
        <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">{member.role}</p>
        {member.bio && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{member.bio}</p>
        )}
      </div>

      {/* Contact Links */}
      <div className="mt-6 flex justify-center gap-3">
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title={`${member.name} - Telefon`}
            aria-label={`${member.name} ile telefonda görüş`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title={`${member.name} - E-posta`}
            aria-label={`${member.name} için e-posta gönder`}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title={`${member.name} - LinkedIn`}
            aria-label={`${member.name} - LinkedIn profili`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        )}
      </div>
    </motion.article>
  );
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div
      className="flex items-center justify-center py-16"
      role="status"
      aria-label="Ekip yükleniyor"
    >
      <Loader2 className="h-12 w-12 animate-spin text-emerald-500" aria-hidden="true" />
      <span className="sr-only">Ekip üyeleri yükleniyor...</span>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        Bir Hata Oluştu
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        Tekrar Dene
      </button>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="text-center py-16">
      <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" aria-hidden="true" />
      <p className="text-slate-500 dark:text-slate-400 text-lg">
        Ekibimiz bilgisi yakında eklenecektir.
      </p>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

/**
 * Team Page Component
 * Ekip sayfası - profesyonel ekip üyeleri.
 * 
 * @admin-sync Ekip üyeleri /admin/ekip'den API ile çekilir
 */
export default function TeamPage() {
  // State management with proper types
  const [state, setState] = useState<PageState>({
    members: [],
    loading: true,
    error: null,
  });

  const shouldReduceMotion = useReducedMotion();

  // Memoized fetch function
  const fetchTeam = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error('Ekip üyeleri yüklenirken bir hata oluştu');
      const data = await res.json();
      setState({
        members: Array.isArray(data) ? data.filter((m: TeamMember) => m.isActive) : [],
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Error fetching team', {}, error instanceof Error ? error : undefined);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu',
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const { members, loading, error } = state;

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section
        className="bg-slate-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
        aria-label="Sayfa başlığı"
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 sm:h-16 sm:w-16">
            <Users className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">Ekibimiz</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Deneyimli ve profesyonel ekibimizle tanışın. Güvenilir kadromuz hizmetinizdedir.
          </p>
        </div>
      </section>

      {/* Team Members Grid */}
      <section
        className="py-16 bg-white dark:bg-slate-900"
        aria-label="Ekip üyeleri"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchTeam} />
          ) : members.length > 0 ? (
            <div
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="Ekip üyeleri listesi"
            >
              {members.map((member, index) => (
                <div key={member.id} role="listitem">
                  <TeamCard member={member} index={index} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* Values Section */}
      <section
        className="bg-slate-50 dark:bg-slate-800 py-16"
        aria-label="Neden biz"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Neden Bizi Tercih Etmelisiniz?</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Profesyonel ekibimiz ve kaliteli hizmet anlayışımızla fark yaratıyoruz
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <motion.article
              initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.5 }}
              className="rounded-2xl bg-white dark:bg-slate-700 p-8 shadow-lg text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <span className="text-2xl font-bold">20+</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yıllık Deneyim</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                Temizlik sektöründe 20 yılı aşkın tecrübemizle hizmet veriyoruz
              </p>
            </motion.article>
            <motion.article
              initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.1, duration: shouldReduceMotion ? 0.2 : 0.5 }}
              className="rounded-2xl bg-white dark:bg-slate-700 p-8 shadow-lg text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <span className="text-2xl font-bold">50+</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Uzman Personel</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                Eğitimli ve deneyimli temizlik personelimizle hizmetinizdeyiz
              </p>
            </motion.article>
            <motion.article
              initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0.2 : 0.5 }}
              className="rounded-2xl bg-white dark:bg-slate-700 p-8 shadow-lg text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <span className="text-2xl font-bold">%100</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Müşteri Memnuniyeti</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                Müşterilerimizin memnuniyeti bizim için en önemli önceliktir
              </p>
            </motion.article>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
