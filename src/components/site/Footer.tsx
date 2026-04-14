/**
 * @fileoverview Footer Component
 * @description Site footer bileşeni.
 * Newsletter form, navigation links, contact info, ve social links ile.
 *
 * @example
 * <Footer />
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Send,
  Globe,
  Share2,
  MessageCircle,
  ArrowUp,
  Loader2,
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { toTelHref } from '@/config/site-contact';

// ============================================
// TYPES
// ============================================

/** Footer link tipi */
interface FooterLink {
  label: string;
  href: string;
}

/** Footer link grubu tipi */
interface FooterLinkGroup {
  hizmetler: FooterLink[];
  kurumsal: FooterLink[];
}

/** Social link tipi */
interface SocialLink {
  icon: React.ComponentType<{ size: number }>;
  href: string;
  label: string;
  color: string;
}

// ============================================
// CONSTANTS
// ============================================

/** Footer navigasyon linkleri */
const FOOTER_LINKS: FooterLinkGroup = {
  hizmetler: [
    { label: 'İnşaat Sonrası Temizlik', href: '/hizmetler/insaat-sonrasi-temizlik' },
    { label: 'Ofis Temizliği', href: '/hizmetler/ofis-temizligi' },
    { label: 'Koltuk Yıkama', href: '/hizmetler/koltuk-yikama' },
    { label: 'Halı Temizliği', href: '/hizmetler/hali-temizligi' },
    { label: 'Dış Cephe Temizliği', href: '/hizmetler/dis-cephe-temizligi' },
  ],
  kurumsal: [
    { label: 'Hakkımızda', href: '/hakkimizda' },
    { label: 'Ekibimiz', href: '/ekibimiz' },
    { label: 'Bölgeler', href: '/bolgeler' },
    { label: 'Randevu', href: '/randevu' },
    { label: 'Rehber', href: '/rehber' },
    { label: 'Arama', href: '/ara' },
    { label: 'Blog', href: '/blog' },
    { label: 'Referanslar', href: '/referanslar' },
    { label: 'İletişim', href: '/iletisim' },
  ],
};

// ============================================
// COMPONENT
// ============================================

/**
 * Footer Component
 * Site footer with newsletter, links, and contact info.
 */
export function Footer() {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const socialLinks = useMemo((): SocialLink[] => {
    const links: SocialLink[] = [];
    const ig = settings.instagram?.trim();
    const fb = settings.facebook?.trim();
    const tw = settings.twitter?.trim();
    if (ig)
      links.push({ icon: Globe, href: ig, label: 'Instagram', color: 'hover:bg-pink-500' });
    if (fb)
      links.push({ icon: Share2, href: fb, label: 'Facebook', color: 'hover:bg-blue-600' });
    if (tw)
      links.push({ icon: MessageCircle, href: tw, label: 'X (Twitter)', color: 'hover:bg-sky-500' });
    return links;
  }, [settings.instagram, settings.facebook, settings.twitter]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || submitting) return;

    setSubscribeError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        message?: string;
      };

      if (!res.ok) {
        setSubscribeError(
          typeof data.error === 'string' ? data.error : 'İşlem başarısız. Lütfen tekrar deneyin.'
        );
        return;
      }

      setDoneMessage(
        typeof data.message === 'string' && data.message.length > 0
          ? data.message
          : 'Teşekkürler! Bültenimize başarıyla kaydoldunuz.'
      );
      setEmail('');
    } catch {
      setSubscribeError('Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-950" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <motion.div
          className="mb-16 pb-16 border-b border-slate-800"
          initial={{ opacity: 0, y: shouldReduceMotion ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
        >
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">E-Bültenimize Katılın</h3>
              <p className="text-slate-400">
                Temizlik ipuçları, kampanyalar ve özel fırsatlardan haberdar olun.
              </p>
            </div>
            <div>
              {doneMessage ? (
                <motion.div
                  className="flex items-center gap-3 text-emerald-400"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0.2 : 0.4 }}
                  role="status"
                  aria-live="polite"
                >
                  <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{doneMessage}</span>
                </motion.div>
              ) : (
                <form
                  onSubmit={(e) => void handleSubscribe(e)}
                  className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
                  aria-label="E-bülten aboneliği"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="E-posta adresiniz"
                      required
                      disabled={submitting}
                      autoComplete="email"
                      className="min-h-11 min-w-0 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                      aria-label="E-posta adresi"
                      aria-required="true"
                      aria-invalid={!!subscribeError}
                      aria-describedby={subscribeError ? 'footer-newsletter-error' : undefined}
                    />
                    {subscribeError ? (
                      <p id="footer-newsletter-error" className="text-sm text-red-400" role="alert">
                        {subscribeError}
                      </p>
                    ) : null}
                  </div>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={shouldReduceMotion || submitting ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion || submitting ? {} : { scale: 0.98 }}
                    className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    aria-label={submitting ? 'Kaydediliyor…' : 'Abone ol'}
                  >
                    {submitting ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                    ) : (
                      <Send size={18} aria-hidden="true" />
                    )}
                    {submitting ? 'Gönderiliyor…' : 'Abone Ol'}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group" aria-label={`${settings.siteName} - Ana sayfa`}>
              {settings.logo ? (
                <motion.div
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Image
                    src={settings.logo}
                    alt={settings.siteName}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain p-1"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  aria-hidden="true"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
              )}
              <span className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{settings.siteName}</span>
            </Link>
            <p className="text-slate-400">
              {settings.siteDescription ||
                "İstanbul'un her bölgesinde profesyonel temizlik hizmetleri. Deneyimli ekibimiz ve modern ekipmanlarımızla yanınızdayız."}
            </p>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.1, y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all ${social.color} hover:text-white`}
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Hizmetler */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Hizmetlerimiz</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.hizmetler.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-all hover:text-emerald-400 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Kurumsal</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.kurumsal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-all hover:text-emerald-400 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">İletişim</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-slate-400 whitespace-pre-line">
                  {settings.address?.trim() || 'Ataşehir, İstanbul'}
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="h-5 w-5 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <a
                  href={toTelHref(settings.phone)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                  aria-label={`Telefon: ${settings.phone}`}
                >
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail className="h-5 w-5 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <a
                  href={`mailto:${settings.email}`}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                  aria-label={`E-posta: ${settings.email}`}
                >
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} {settings.siteName}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/gizlilik" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-kosullari" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">
              Kullanım Koşulları
            </Link>
            <motion.button
              onClick={scrollToTop}
              whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              aria-label="Sayfanın başına dön"
            >
              <ArrowUp size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
