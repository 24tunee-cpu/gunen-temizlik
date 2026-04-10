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
import { toast } from '@/store/toastStore';

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
}

/** İletişim bilgisi tipi */
interface ContactInfoItem {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string;
  href: string;
  color: string;
  ariaLabel: string;
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

/** İletişim bilgileri */
const CONTACT_INFO: ContactInfoItem[] = [
  {
    icon: Phone,
    label: 'Telefon',
    value: '0555 123 45 67',
    href: 'tel:+905551234567',
    color: 'from-emerald-500 to-emerald-600',
    ariaLabel: 'Telefon et: 0555 123 45 67'
  },
  {
    icon: Mail,
    label: 'E-posta',
    value: 'info@gunentemizlik.com',
    href: 'mailto:info@gunentemizlik.com',
    color: 'from-blue-500 to-blue-600',
    ariaLabel: 'E-posta gönder: info@gunentemizlik.com'
  },
  {
    icon: MapPin,
    label: 'Adres',
    value: 'Ataşehir, İstanbul',
    href: '#',
    color: 'from-amber-500 to-amber-600',
    ariaLabel: 'Adres: Ataşehir, İstanbul'
  },
  {
    icon: Clock,
    label: 'Çalışma Saatleri',
    value: '7/24 Hizmet',
    href: '#',
    color: 'from-purple-500 to-purple-600',
    ariaLabel: 'Çalışma saatleri: 7/24 Hizmet'
  },
];

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
  ariaDescribedBy
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isActive = isFocused || value.length > 0;
  const errorId = `${id}-error`;

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
          color: isActive ? '#059669' : '#64748b',
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
        className={`w-full rounded-xl border-2 px-4 pt-6 pb-2 transition-all duration-300 outline-none
          ${error
            ? 'border-red-300 focus:border-red-500 bg-red-50/30'
            : 'border-slate-200 focus:border-emerald-500 hover:border-emerald-300'
          }
        `}
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

/**
 * Contact Form Component
 * Full-featured contact form with validation and accessibility.
 */
export function ContactForm() {
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
    <section className="relative bg-slate-50 py-24 overflow-hidden" aria-label="İletişim formu">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-slate-50" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
          >
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              İletişim
            </motion.span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Bize Ulaşın
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Temizlik hizmetleri hakkında bilgi almak veya randevu oluşturmak için bize ulaşabilirsiniz.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Phone, label: 'Telefon', value: '0555 123 45 67', href: 'tel:+905551234567', color: 'from-emerald-500 to-emerald-600', ariaLabel: 'Telefon numarası' },
                { icon: Mail, label: 'E-posta', value: 'info@gunentemizlik.com', href: 'mailto:info@gunentemizlik.com', color: 'from-blue-500 to-blue-600', ariaLabel: 'E-posta adresi' },
                { icon: MapPin, label: 'Adres', value: 'Ataşehir, İstanbul', href: '#', color: 'from-amber-500 to-amber-600', ariaLabel: 'Adres' },
                { icon: Clock, label: 'Çalışma Saatleri', value: '7/24 Hizmet', href: '#', color: 'from-purple-500 to-purple-600', ariaLabel: 'Çalışma saatleri' },
              ].map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.02, x: 4 }}
                  className="flex items-center gap-4 group p-3 rounded-xl hover:bg-white transition-colors"
                  aria-label={item.ariaLabel}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`} aria-hidden="true">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              ))}
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

            <div className="relative rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
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
                      className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
                      aria-hidden="true"
                    >
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Mesajınız Gönderildi!</h3>
                    <p className="text-slate-600 mb-6">
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
                        placeholder="0555 123 45 67"
                      />
                      <div className="relative">
                        <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-2">
                          Hizmet Seçin
                        </label>
                        <select
                          id="service"
                          value={formData.service}
                          onChange={(e) => handleFieldChange('service', e.target.value)}
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-emerald-500 outline-none transition-colors"
                        >
                          {SERVICE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                        Mesajınız <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleFieldChange('message', e.target.value)}
                        onBlur={() => handleBlur('message')}
                        className={`w-full rounded-xl border-2 px-4 py-3 outline-none resize-none
                          ${errors.message
                            ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 focus:border-emerald-500 hover:border-emerald-300'
                          }`}
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
