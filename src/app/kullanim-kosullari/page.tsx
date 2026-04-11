/**
 * @fileoverview Terms of Service Page
 * @description Kullanım koşulları sayfası.
 * Yasal bilgilendirme ve hizmet şartları.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Static content (legal page)
 * - Semantic HTML5 elements
 * - Accessible by design
 *
 * @legal
 * Bu sayfadaki içerik yasal bağlayıcılığa sahiptir.
 * Değişiklikler admin panelden yapılmalı ve hukuk danışmanlığı alınmalıdır.
 */

import type { Metadata } from 'next';
import { FileText, Check } from 'lucide-react';
import SiteLayout from '../site/layout';

// ============================================
// METADATA (SEO)
// ============================================

export const metadata: Metadata = {
  title: 'Kullanım Koşulları | Günen Temizlik',
  description: 'Günen Temizlik hizmetlerinin kullanım koşulları, sorumluluklar ve yasal bilgilendirmeler.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://gunentemizlik.com/kullanim-kosullari',
  },
};

// ============================================
// TERMS CONFIGURATION
// ============================================

/** Son güncelleme tarihi - Admin panelden dinamik çekilebilir */
const LAST_UPDATED = '2024-12-01';

/** Kullanım koşulları maddeleri - Admin panelden yönetilebilir */
const TERMS_ITEMS = [
  {
    id: 'service-scope',
    title: 'Hizmet Kapsamı',
    content: 'Günen Temizlik olarak İstanbul genelinde inşaat sonrası temizlik, ofis temizliği, koltuk yıkama, halı temizliği ve cam temizliği hizmetleri sunmaktayız. Hizmet detayları ve fiyatlar için iletişime geçebilirsiniz.'
  },
  {
    id: 'cancellation',
    title: 'Randevu ve İptal',
    content: 'Randevularınızı en az 24 saat öncesinden iptal edebilirsiniz. 24 saatten kısa sürede yapılan iptallerde ücret talep edilebilir.'
  },
  {
    id: 'payment',
    title: 'Ödeme Koşulları',
    content: 'Hizmet bedeli, hizmet tamamlandıktan sonra nakit veya havale/EFT yoluyla ödenebilir. Kurumsal müşteriler için özel ödeme planları sunulmaktadır.'
  },
  {
    id: 'guarantee',
    title: 'Garanti ve Sorumluluk',
    content: 'Tüm hizmetlerimizde müşteri memnuniyeti garantisi sunuyoruz. Memnun kalmadığınız durumlarda 48 saat içinde ücretsiz düzeltme yapılır.'
  },
  {
    id: 'customer-obligations',
    title: 'Müşteri Yükümlülükleri',
    content: 'Hizmet öncesinde değerli eşyaların güvenli bir yerde saklanması, temizlik alanına erişim sağlanması ve gerekli kolaylıkların tanınması müşterinin sorumluluğundadır.'
  },
  {
    id: 'changes',
    title: 'Değişiklik Hakkı',
    content: 'Günen Temizlik, kullanım koşulları ve fiyatlandırma konusunda değişiklik yapma hakkını saklı tutar. Değişiklikler web sitemizde yayınlanır yayınlanmaz yürürlüğe girer.'
  }
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Terms of Service Page Component
 * Kullanım koşulları sayfası - yasal bilgilendirme.
 * 
 * @legal Bu sayfa yasal içerik içerir. Değişiklikler hukuk danışmanlığı ile yapılmalıdır.
 */
export default function TermsPage() {
  return (
    <SiteLayout>
      <div className="flex min-h-full flex-1 flex-col bg-slate-900">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-16 sm:py-24 md:py-32"
        aria-label="Sayfa başlığı"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30">
              <FileText className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              Kullanım Koşulları
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              Hizmetlerimizi kullanmadan önce lütfen kullanım koşullarımızı okuyun
            </p>
          </div>
        </div>
      </section>

      {/* Content — flex-1: footer öncesi boşlukta beyaz layout zemini görünmez */}
      <section className="flex-1 bg-slate-900 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
          <article className="space-y-8">
            {TERMS_ITEMS.map((item) => (
              <article
                key={item.id}
                id={item.id}
                className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-800/50 p-4 backdrop-blur-sm dark:bg-slate-800/30 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Check className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </article>

          {/* Last Updated */}
          <footer className="mt-12 text-center text-sm text-slate-400">
            <p>
              Son güncelleme:{" "}
              <time dateTime={LAST_UPDATED}>
                {new Date(LAST_UPDATED).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
            <p className="mt-1">© {new Date().getFullYear()} Günen Temizlik. Tüm hakları saklıdır.</p>
          </footer>
        </div>
      </section>
      </div>
    </SiteLayout>
  );
}
