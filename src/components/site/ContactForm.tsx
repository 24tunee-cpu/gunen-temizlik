/**
 * @fileoverview Contact Form Component
 * @description İletişim formu bileşeni.
 * Validasyon, floating labels, success state, ve accessibility desteği ile.
 *
 * @example
 * <ContactForm />
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, CheckCircle, Phone, Mail, MapPin, Clock, AlertCircle } from 'lucide-react';
import logger from '@/lib/logger';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { SITE_CONTACT, toTelHref } from '@/config/site-contact';
import { trackGa4Event } from '@/lib/ga4-client';

// ============================================
// TYPES
// ============================================

/** Form hataları tipi */
interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

/** Floating label input props */
interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  ariaDescribedBy?: string;
  /** Sayfa teması — `/iletisim` için `dark` */
  variant?: 'light' | 'dark';
}

/** Form veri tipi */
interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

// ============================================
// CONSTANTS
// ============================================

/** Hizmet seçenekleri */
const SERVICE_OPTIONS = [
  { value: '', label: 'Seçiniz...' },
  { value: 'İnşaat Sonrası Temizlik', label: 'İnşaat Sonrası Temizlik' },
  { value: 'Ofis Temizliği', label: 'Ofis Temizliği' },
  { value: 'Koltuk Yıkama', label: 'Koltuk Yıkama' },
  { value: 'Halı Temizliği', label: 'Halı Temizliği' },
  { value: 'Dış Cephe Temizliği', label: 'Dış Cephe Temizliği' },
  { value: 'Diğer', label: 'Diğer' },
];

const SERVICE_COOKIE_NAME = 'gt_contact_service';
const SERVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ALLOWED_SERVICE_VALUES = new Set(SERVICE_OPTIONS.map((o) => o.value).filter(Boolean));

function readServiceCookie(): string {
  if (typeof document === 'undefined') return '';
  const parts = `; ${document.cookie}`.split(`; ${SERVICE_COOKIE_NAME}=`);
  if (parts.length < 2) return '';
  const rest = parts.pop()?.split(';').shift();
  if (!rest) return '';
  try {
    return decodeURIComponent(rest);
  } catch {
    return '';
  }
}

function writeServiceCookie(value: string) {
  if (typeof document === 'undefined' || !value) return;
  if (!ALLOWED_SERVICE_VALUES.has(value)) return;
  const enc = encodeURIComponent(value);
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SERVICE_COOKIE_NAME}=${enc}; Path=/; Max-Age=${SERVICE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/** Validasyon kuralları */
const VALIDATION_RULES = {
  name: { min: 2, message: 'İsim en az 2 karakter olmalıdır' },
  message: { min: 10, message: 'Mesaj en az 10 karakter olmalıdır' },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Geçerli bir e-posta adresi giriniz' },
  phone: { pattern: /^[0-9\s\-\+\(\)]{10,}$/, message: 'Geçerli bir telefon numarası giriniz' },
};

/**
 * Floating Label Input Component
 * Animasyonlu floating label input with accessibility support.
 */
function FloatingLabelInput({
  id,
  label,
  type = 'text',
  required = false,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  ariaDescribedBy,
  variant = 'light',
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isActive = isFocused || value.length > 0;
  const errorId = `${id}-error`;
  const isDark = variant === 'dark';

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        animate={{
          y: isActive ? -24 : 12,
          scale: isActive ? 0.85 : 1,
          color: isActive ? (isDark ? '#34d399' : '#059669') : (isDark ? '#94a3b8' : '#64748b'),
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="absolute left-4 font-medium pointer-events-none origin-left transition-colors"
        style={{ top: 0 }}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </motion.label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'w-full rounded-xl border-2 px-4 pb-2 pt-6 text-base transition-all duration-300 outline-none',
          error
            ? isDark
              ? 'border-red-500/60 focus:border-red-400 bg-red-950/30 text-white'
              : 'border-red-300 focus:border-red-500 bg-red-50/30'
            : isDark
              ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 hover:border-slate-500'
              : 'border-slate-200 focus:border-emerald-500 hover:border-emerald-300',
        )}
        placeholder={isActive ? placeholder : ''}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : ariaDescribedBy}
        aria-required={required}
      />
      <AnimatePresence>
        {error && (
          <motion.div
            id={errorId}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="flex items-center gap-1 mt-1 text-sm text-red-500"
            role="alert"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export interface ContactFormProps {
  /** Ana sayfa: `light` (varsayılan). İletişim sayfası: `dark`. */
  variant?: 'light' | 'dark';
}

/**
 * Contact Form Component
 * Full-featured contact form with validation and accessibility.
 */
export function ContactForm({ variant = 'light' }: ContactFormProps) {
  const isDark = variant === 'dark';
  const { settings } = useSiteSettings();

  const contactCards = useMemo(
    () => {
      const phone = settings.phone?.trim() || SITE_CONTACT.phoneDisplay;
      const email = settings.email?.trim() || SITE_CONTACT.email;
      const addr = settings.address?.trim() || 'Ataşehir, İstanbul';
      const hours = settings.workingHours?.trim() || '7/24 Hizmet';
      return [
        {
          icon: Phone,
          label: 'Telefon',
          value: phone,
          href: toTelHref(settings.phone?.trim() || SITE_CONTACT.phoneE164),
          color: 'from-emerald-500 to-emerald-600',
          ariaLabel: `Telefon: ${phone}`,
        },
        {
          icon: Mail,
          label: 'E-posta',
          value: email,
          href: `mailto:${email}`,
          color: 'from-blue-500 to-blue-600',
          ariaLabel: `E-posta: ${email}`,
        },
        {
          icon: MapPin,
          label: 'Adres',
          value: addr,
          href: '#',
          color: 'from-amber-500 to-amber-600',
          ariaLabel: `Adres: ${addr}`,
        },
        {
          icon: Clock,
          label: 'Çalışma Saatleri',
          value: hours,
          href: '#',
          color: 'from-purple-500 to-purple-600',
          ariaLabel: `Çalışma saatleri: ${hours}`,
        },
      ];
    },
    [settings.phone, settings.email, settings.address, settings.workingHours]
  );

  const CONTACT_DRAFT_KEY = 'contact-form-draft-v1';

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      let name = '';
      let email = '';
      let phone = '';
      let service = '';
      let message = '';
      const raw = localStorage.getItem(CONTACT_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormData>;
        if (typeof parsed.name === 'string') name = parsed.name;
        if (typeof parsed.email === 'string') email = parsed.email;
        if (typeof parsed.phone === 'string') phone = parsed.phone;
        if (typeof parsed.service === 'string') service = parsed.service;
        if (typeof parsed.message === 'string') message = parsed.message;
      }
      if (!service) {
        const fromCookie = readServiceCookie();
        if (fromCookie && ALLOWED_SERVICE_VALUES.has(fromCookie)) {
          service = fromCookie;
        }
      }
      setFormData({ name, email, phone, service, message });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        if (formData.name || formData.email || formData.message || formData.phone || formData.service) {
          localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(formData));
        }
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [formData]);

  // ============================================
  // MEMOIZED VALIDATION
  // ============================================
  const validationErrors = useMemo(() => {
    const newErrors: FormErrors = {};

    if (touched.name && formData.name.length < VALIDATION_RULES.name.min) {
      newErrors.name = VALIDATION_RULES.name.message;
    }

    if (touched.email && !VALIDATION_RULES.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION_RULES.email.message;
    }

    if (touched.phone && formData.phone && !VALIDATION_RULES.phone.pattern.test(formData.phone)) {
      newErrors.phone = VALIDATION_RULES.phone.message;
    }

    if (touched.message && formData.message.length < VALIDATION_RULES.message.min) {
      newErrors.message = VALIDATION_RULES.message.message;
    }

    return newErrors;
  }, [formData, touched]);

  // Sync errors with validation
  useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFieldChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    try {
      localStorage.removeItem(CONTACT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    setTouched({});
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      message: true,
    });

    // Check for errors
    const hasErrors = Object.keys(validationErrors).length > 0;
    const hasEmptyRequired = !formData.name || !formData.email || !formData.message;

    if (hasErrors || hasEmptyRequired) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (formData.service) {
          writeServiceCookie(formData.service);
        }
        trackGa4Event('generate_lead', {
          form_id: 'contact',
          form_destination: '/iletisim',
          service: formData.service || undefined,
        });
        setSuccess(true);
        resetForm();
        toast.success('Gönderildi!', 'Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.');
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      logger.error('Error submitting form', {}, error instanceof Error ? error : undefined);
      toast.error('Gönderme Hatası', 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [formData, validationErrors, resetForm]);

  return (
    <section
      className={cn(
        'relative overflow-hidden py-16 sm:py-20 md:py-24',
        isDark ? 'bg-slate-900' : 'bg-slate-50',
      )}
      aria-label="İletişim formu"
    >
      <div
        className={cn(
          'absolute inset-0',
          isDark
            ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-900 to-slate-900'
            : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl',
          isDark ? 'bg-emerald-500/10' : 'bg-emerald-200/20',
        )}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
          >
            <motion.span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium',
                isDark
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-emerald-100 text-emerald-700',
              )}
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              İletişim
            </motion.span>
            <h2
              className={cn(
                'mt-4 text-balance text-2xl font-bold sm:text-3xl md:text-4xl',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              Bize Ulaşın
            </h2>
            <p className={cn('mt-4 text-base sm:text-lg', isDark ? 'text-slate-300' : 'text-slate-600')}>
              Temizlik hizmetleri hakkında bilgi almak veya randevu oluşturmak için bize ulaşabilirsiniz.
            </p>

            <div className="mt-8 space-y-4">
              {contactCards.map((item) => {
                const gradient = isDark ? 'from-emerald-500 to-emerald-600' : item.color;
                return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02, x: 4 }}
                  className={cn(
                    'group flex min-w-0 items-center gap-3 rounded-xl p-3 transition-colors sm:gap-4',
                    isDark ? 'hover:bg-slate-800/80' : 'hover:bg-white',
                  )}
                  aria-label={item.ariaLabel}
                >
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg sm:h-12 sm:w-12', gradient)} aria-hidden="true">
                    <item.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{item.label}</p>
                    <p
                      className={cn(
                        'break-words font-semibold transition-colors',
                        isDark
                          ? 'text-white group-hover:text-emerald-400'
                          : 'text-slate-900 group-hover:text-emerald-600',
                      )}
                    >
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              );
              })}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl blur-xl" aria-hidden="true" />

            <div
              className={cn(
                'relative rounded-2xl border p-5 shadow-xl sm:p-8',
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-100',
              )}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 }}
                    transition={{ duration: shouldReduceMotion ? 0.2 : 0.4 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: shouldReduceMotion ? 0 : 0.2 }}
                      className={cn(
                        'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                        isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
                      )}
                      aria-hidden="true"
                    >
                      <CheckCircle className={cn('h-10 w-10', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                    </motion.div>
                    <h3 className={cn('text-2xl font-bold mb-2', isDark ? 'text-white' : 'text-slate-900')}>
                      Mesajınız Gönderildi!
                    </h3>
                    <p className={cn('mb-6', isDark ? 'text-slate-300' : 'text-slate-600')}>
                      En kısa sürede size dönüş yapacağız.
                    </p>
                    <motion.button
                      onClick={() => setSuccess(false)}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                      className="rounded-xl bg-emerald-500 px-6 py-3 text-white font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Yeni Mesaj Gönder
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    aria-label="İletişim formu"
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <FloatingLabelInput
                        id="name"
                        label="İsim Soyisim"
                        required
                        value={formData.name}
                        onChange={(value) => handleFieldChange('name', value)}
                        onBlur={() => handleBlur('name')}
                        error={errors.name}
                        placeholder="Adınız Soyadınız"
                        variant={variant}
                      />
                      <FloatingLabelInput
                        id="email"
                        label="E-posta"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(value) => handleFieldChange('email', value)}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                        placeholder="ornek@email.com"
                        variant={variant}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FloatingLabelInput
                        id="phone"
                        label="Telefon"
                        type="tel"
                        value={formData.phone}
                        onChange={(value) => handleFieldChange('phone', value)}
                        onBlur={() => handleBlur('phone')}
                        error={errors.phone}
                        placeholder="0546 715 2844"
                        variant={variant}
                      />
                      <div className="relative">
                        <label
                          htmlFor="service"
                          className={cn('block text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-slate-700')}
                        >
                          Hizmet Seçin
                        </label>
                        <select
                          id="service"
                          value={formData.service}
                          onChange={(e) => handleFieldChange('service', e.target.value)}
                          className={cn(
                            'w-full rounded-xl border-2 px-4 py-3 focus:border-emerald-500 outline-none transition-colors',
                            isDark
                              ? 'border-slate-600 bg-slate-800 text-white'
                              : 'border-slate-200 bg-white text-slate-900',
                          )}
                        >
                          {SERVICE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <label
                        htmlFor="message"
                        className={cn('block text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-slate-700')}
                      >
                        Mesajınız <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleFieldChange('message', e.target.value)}
                        onBlur={() => handleBlur('message')}
                        className={cn(
                          'w-full rounded-xl border-2 px-4 py-3 outline-none resize-none',
                          errors.message
                            ? isDark
                              ? 'border-red-500/60 focus:border-red-400 bg-red-950/30 text-white'
                              : 'border-red-300 focus:border-red-500 bg-red-50/30'
                            : isDark
                              ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 hover:border-slate-500'
                              : 'border-slate-200 focus:border-emerald-500 hover:border-emerald-300',
                        )}
                        placeholder="Nasıl yardımcı olabiliriz?"
                        aria-invalid={!!errors.message}
                        aria-required="true"
                      />
                      <AnimatePresence>
                        {errors.message && (
                          <motion.div
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                            className="flex items-center gap-1 mt-1 text-sm text-red-500"
                            role="alert"
                          >
                            <AlertCircle size={14} aria-hidden="true" />
                            <span>{errors.message}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || Object.keys(errors).length > 0}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={loading ? 'Mesaj gönderiliyor' : 'Mesaj gönder'}
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send size={18} aria-hidden="true" />
                          Gönder
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ContactForm;
