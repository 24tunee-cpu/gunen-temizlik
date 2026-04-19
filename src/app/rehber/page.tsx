import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLayout from '../site/layout';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemaGraph,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: 'İstanbul Temizlik Rehberi | Hangi Hizmet Ne Zaman?',
  description:
    'İstanbul için ev, ofis, inşaat sonrası ve periyodik temizlikte doğru hizmeti seçmek için pratik karar rehberi ve uygulama önerileri.',
  alternates: { canonical: canonicalUrl('/rehber') },
  openGraph: {
    title: 'Hangi temizlik ne zaman? | Günen Temizlik rehberi',
    description:
      'İnşaat sonrası, ofis, derinlemesine ve periyodik temizlik için pratik karar rehberi.',
    url: canonicalUrl('/rehber'),
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Günen Temizlik',
    images: [
      {
        url: canonicalUrl('/logo.png'),
        width: 1200,
        height: 630,
        alt: 'Günen Temizlik - Temizlik rehberi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hangi temizlik ne zaman? | Günen Temizlik rehberi',
    description:
      'İnşaat sonrası, ofis, derinlemesine ve periyodik temizlik için pratik karar rehberi.',
    images: [canonicalUrl('/logo.png')],
  },
};

const rehberTitle = 'İstanbul Temizlik Rehberi | Hangi Hizmet Ne Zaman?';
const rehberDescription =
  'İstanbul için ev, ofis, inşaat sonrası ve periyodik temizlikte doğru hizmeti seçmek için pratik karar rehberi.';

const rehberJsonLd = serializeSchemaGraph([
  generateWebPageSchema({
    path: '/rehber',
    title: rehberTitle,
    description: rehberDescription,
  }),
  generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Temizlik rehberi', url: '/rehber' },
  ]) as Record<string, unknown>,
]);

const blocks = [
  {
    title: 'İnşaat ve tadilat sonrası',
    body: 'Toz, harç ve yapışkan kalıntılar için önce kabaca süpürme, ardından profesyonel ekip ile detaylı temizlik önerilir. Havalandırma ve yüzey tipine göre ürün seçimi kritiktir.',
  },
  {
    title: 'Ofis ve ortak alanlar',
    body: 'Çalışma saatleri dışında veya hafta sonu blok randevu genelde verimi artırır. Halı ve döşeme yoğunluğu yüksekse düzenli periyot planlanmalıdır.',
  },
  {
    title: 'Ev derinlemesine',
    body: 'Dolap içleri, cam ve mutfak yağları ayrı aşamalarda ele alınır. Alerji ve evcil hayvan varlığını önceden paylaşmanız ürün seçimini güvenli hale getirir.',
  },
  {
    title: 'Periyodik bakım',
    body: 'Haftalık hafif — aylık derin dengesi bütçe ve hijyen için uygundur. Yoğun kullanılan banyo ve mutfak önceliklendirilir.',
  },
];

export default function RehberPage() {
  return (
    <SiteLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: rehberJsonLd }} />
      <article className="bg-white py-12 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hangi temizlik ne zaman?</h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Aşağıdaki özet, doğru hizmeti ve zamanlamayı seçmenize yardımcı olur. Kesin süre ve fiyat için{' '}
            <Link href="/randevu" className="font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400">
              keşif talebi
            </Link>{' '}
            veya{' '}
            <Link href="/iletisim" className="font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400">
              iletişim
            </Link>{' '}
            formunu kullanabilirsiniz.
          </p>
          <ol className="mt-10 space-y-8">
            {blocks.map((b, i) => (
              <li key={b.title} className="rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Bölüm {i + 1}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{b.title}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </article>
    </SiteLayout>
  );
}
