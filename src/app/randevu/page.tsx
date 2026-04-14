import type { Metadata } from 'next';
import SiteLayout from '../site/layout';
import { AppointmentRequestForm } from '@/components/site/AppointmentRequestForm';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemaGraph,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Ücretsiz keşif ve randevu | Günen Temizlik',
  description: 'Uygun tarih ve saat diliminde ücretsiz keşif talebi oluşturun.',
  alternates: { canonical: canonicalUrl('/randevu') },
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
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ücretsiz keşif talebi</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Formu doldurun; operasyon ekibimiz onay ve kesin saat için sizi arar.
          </p>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <AppointmentRequestForm />
        </div>
      </div>
    </SiteLayout>
  );
}
