/**
 * @fileoverview Hero Component
 * @description Ana sayfa hero bölümü.
 * Particle effects, 3D card animations, ve accessibility desteği ile.
 *
 * @example
 * <Hero />
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Clock, Award, ChevronDown } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

/** FloatingCard component props */
interface FloatingCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** Trust badge tipi */
interface TrustBadge {
  icon: React.ComponentType<{ size: number; className?: string }>;
  text: string;
  color: string;
}

// ============================================
// SABİT DEĞERLER (Hydration fix için)
// ============================================

/** Partikül pozisyonları (sabit, SSR/client eşleşmesi için) */
const PARTICLE_POSITIONS = [
  15, 82, 37, 64, 23, 91, 48, 75, 12, 88,
  42, 59, 31, 76, 53, 69, 18, 95, 44, 67
];

/** Trust badges */
const TRUST_BADGES: TrustBadge[] = [
  { icon: Shield, text: 'Güvenilir Hizmet', color: 'from-emerald-500/20 to-emerald-600/20' },
  { icon: Clock, text: '7/24 Destek', color: 'from-blue-500/20 to-blue-600/20' },
  { icon: Award, text: '15+ Yıl Deneyim', color: 'from-amber-500/20 to-amber-600/20' },
];

// ============================================
// COMPONENT: FLOATING CARD
// ============================================

/**
 * Floating Card Component
 * @param children Card içeriği
 * @param delay Animasyon gecikmesi
 * @param className Ek CSS sınıfları
 */
function FloatingCard({ children, delay = 0, className = '' }: FloatingCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={className}
    >
      <motion.div
        animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
        transition={{
          duration: 4,
          delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Hero Component
 * Ana sayfa hero bölümü.
 */
export function Hero() {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Mount check (hydration fix)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }), [shouldReduceMotion]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: shouldReduceMotion ? 10 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.5,
      },
    },
  }), [shouldReduceMotion]);

  // Scroll handler
  const handleScrollClick = useCallback(() => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  }, []);

  return (
    <section className="relative min-h-[100dvh] min-h-screen overflow-hidden bg-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-950" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" aria-hidden="true" />

      {/* Particle Effect (Client-only to prevent hydration mismatch) */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {PARTICLE_POSITIONS.map((xPos, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              initial={{
                x: `${xPos}%`,
                y: '100%',
                opacity: 0
              }}
              animate={{
                y: '-10%',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8 + (i % 4),
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Glowing Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-3 pt-24 pb-14 sm:px-6 sm:pt-28 sm:pb-16 md:pt-32 md:pb-20 lg:px-8 lg:pt-40">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: shouldReduceMotion ? 0.2 : 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm"
            >
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              >
                <Sparkles size={16} />
              </motion.div>
              <span className="text-sm font-medium">İstanbul&apos;un #1 Temizlik Şirketi</span>
            </motion.div>

            {/* Heading with staggered text animation */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-balance text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-block"
              >
                Profesyonel{' '}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent"
              >
                Temizlik
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-block"
              >
                Hizmetleri
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg"
            >
              İnşaat sonrası, ofis, koltuk yıkama ve daha fazlası.
              Deneyimli ekibimiz ve modern ekipmanlarımızla evinizi ve iş yerinizi
              pırıl pırıl yapıyoruz.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
            >
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} className="w-full min-w-0 sm:w-auto">
                <Link
                  href="/iletisim"
                  className="group relative inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 overflow-hidden sm:inline-flex sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                  aria-label="Hemen fiyat teklifi al"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative">Hemen Fiyat Al</span>
                  <motion.span
                    className="relative"
                    animate={shouldReduceMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    aria-hidden="true"
                  >
                    <ArrowRight size={20} />
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={shouldReduceMotion ? {} : { scale: 0.95 }} className="w-full min-w-0 sm:w-auto">
                <Link
                  href="/hizmetler"
                  className="group inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 sm:inline-flex sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                  aria-label="Tüm hizmetleri görüntüle"
                >
                  <span className="font-medium">Hizmetlerimiz</span>
                  <motion.span
                    animate={shouldReduceMotion ? {} : { rotate: [0, 90, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                    aria-hidden="true"
                  >
                    <ChevronDown size={20} />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges with hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap gap-8"
            >
              {TRUST_BADGES.map((badge, index) => (
                <motion.div
                  key={index}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 text-slate-400 cursor-default group"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${badge.color} group-hover:scale-110 transition-transform`} aria-hidden="true">
                    <badge.icon size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">
                    {badge.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - 3D Card Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <motion.div
                animate={shouldReduceMotion ? {} : { rotateY: [0, 5, 0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-3xl bg-slate-800/50 p-8 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
                style={{ transformStyle: shouldReduceMotion ? 'flat' : 'preserve-3d' }}
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center relative overflow-hidden" aria-hidden="true">
                  {/* Animated circles inside */}
                  <motion.div
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl"
                  />
                  <div className="relative z-10 h-36 w-36 sm:h-40 sm:w-40">
                    <Image
                      src="/logo.png"
                      alt=""
                      fill
                      className="object-contain drop-shadow-[0_0_28px_rgba(16,185,129,0.35)]"
                      priority
                      sizes="(min-width: 640px) 160px, 144px"
                    />
                  </div>
                </div>

                {/* Floating Stats Cards */}
                <FloatingCard delay={0.2} className="absolute -top-6 -right-6">
                  <div className="rounded-2xl bg-white p-5 shadow-xl border border-emerald-100" aria-hidden="true">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <Award className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">5000+</p>
                        <p className="text-xs text-slate-500 font-medium">Mutlu Müşteri</p>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard delay={0.5} className="absolute -bottom-6 -left-6">
                  <div className="rounded-2xl bg-slate-900 p-5 shadow-xl border border-slate-700" aria-hidden="true">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                        <Shield className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">%98</p>
                        <p className="text-xs text-slate-400 font-medium">Memnuniyet</p>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                {/* Additional mini cards */}
                <FloatingCard delay={0.8} className="absolute top-1/2 -right-12">
                  <div className="rounded-xl bg-emerald-500 p-3 shadow-lg" aria-hidden="true">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </FloatingCard>

                <FloatingCard delay={1.1} className="absolute top-20 -left-8">
                  <div className="rounded-xl bg-white p-3 shadow-lg border border-slate-200" aria-hidden="true">
                    <Sparkles className="h-6 w-6 text-emerald-500" />
                  </div>
                </FloatingCard>
              </motion.div>

              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl blur-2xl -z-10" aria-hidden="true" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.button
        onClick={handleScrollClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
        aria-label="Sayfayı aşağı kaydır"
      >
        <span className="text-xs font-medium">Aşağı Kaydır</span>
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-12 w-7 rounded-full border-2 border-emerald-500/30 p-1"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-full rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600"
          />
        </motion.div>
      </motion.button>
    </section>
  );
}

export default Hero;
