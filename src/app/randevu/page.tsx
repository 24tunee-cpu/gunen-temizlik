import type { Metadata } from 'next';
import SiteLayout from '../site/layout';
import { AppointmentRequestForm } from '@/components/site/AppointmentRequestForm';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemaGraph,
} from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';

export const metadata: Metadata = {
  title: 'Ücretsiz keşif ve randevu | Günen Temizlik',
  description: 'Uygun tarih ve saat diliminde ücretsiz keşif talebi oluşturun.',
  keywords: keywordsForPage('randevu'),
  alternates: { canonical: canonicalUrl('/randevu') },
  openGraph: {
    title: 'Ücretsiz keşif ve randevu | Günen Temizlik',
    description: 'Uygun tarih ve saat diliminde ücretsiz keşif talebi oluşturun.',
    url: canonicalUrl('/randevu'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Ücretsiz keşif ve randevu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ücretsiz keşif ve randevu | Günen Temizlik',
    description: 'Uygun tarih ve saat diliminde ücretsiz keşif talebi oluşturun.',
    images: [canonicalUrl('/logo.png')],
  },
};

const pageTitle = 'Ücretsiz keşif ve randevu | Günen Temizlik';
const pageDescription = 'Uygun tarih ve saat diliminde ücretsiz keşif talebi oluşturun.';

const randevuJsonLd = serializeSchemaGraph([
  generateWebPageSchema({
    path: '/randevu',
    title: pageTitle,
    description: pageDescription,
  }),
  generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Ücretsiz keşif talebi', url: '/randevu' },
  ]) as Record<string, unknown>,
]);

export default function RandevuPage() {
  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: randevuJsonLd }} />
      <div className="bg-slate-50 py-12 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Ücretsiz keşif
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                Hızlı randevu oluşturun, aynı gün geri dönüş alın
              </h1>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Formu 1 dakikada tamamlayın. Operasyon ekibimiz uygunluk ve net saat bilgisi için sizi arar.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">1</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">Talep gönderin</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tarih + saat dilimi belirtin</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">2</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">Onay araması</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Genelde 30 dk içinde dönüş</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">3</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">Keşif / hizmet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Net plan + fiyatlama</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sık sorulanlar</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">Randevu ne kadar sürede onaylanıyor?</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">Yoğunluğa göre aynı gün içinde dönüş yapıyoruz.</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">Keşif ücretli mi?</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">Hayır, keşif ve ön değerlendirme ücretsizdir.</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">Acil taleplerde ne yapmalıyım?</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">Formla birlikte not bırakabilir veya direkt bizi arayabilirsiniz.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <AppointmentRequestForm />
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
