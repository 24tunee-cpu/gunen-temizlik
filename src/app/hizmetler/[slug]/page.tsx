/**
 * @fileoverview Service Detail Page (Dynamic Route)
 * @description Dinamik hizmet detay sayfası.
 * Prisma'dan veri çeken, SEO optimizasyonlu server component.
 *
 * @architecture
 * - Server Component (Server-Side Rendering)
 * - Dynamic Route Segment [slug]
 * - Prisma ORM database access
 * - JSON-LD structured data (Service schema)
 * - ISR/SSG compatible
 *
 * @admin-sync
 * Hizmet içerikleri admin paneldeki /admin/hizmetler sayfasından yönetilir.
 * Slug bazlı dinamik routing.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import SiteLayout from '../../site/layout';
import { Sparkles, Check, ArrowRight, Phone, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { DISTRICT_LANDINGS, getServiceBySlug } from '@/config/programmatic-seo';
import { SITE_CONTACT } from '@/config/site-contact';
import {
  canonicalUrl,
  generateBreadcrumbSchema,
  generateFAQSchema,
  getSiteUrl,
  serializeSchemaGraph,
} from '@/lib/seo';
import { keywordsForPage } from '@/lib/seo-keywords';
import { serviceFaqFromFeatures, serviceKeywordsFromTitleAndSlug } from '@/lib/service-seo-targets';

// ============================================
// TYPES
// ============================================

/** Page props for dynamic route */
interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Service data with Prisma fields */
interface ServiceData {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string | null;
  metaDesc: string | null;
  metaTitle: string | null;
  image: string | null;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ServiceContentPack = {
  idealFor: string[];
  process: string[];
  equipment: string[];
  standards: string[];
};

const DEFAULT_CONTENT_PACK: ServiceContentPack = {
  idealFor: [
    'Taşınma, tadilat veya sezonluk genel toparlama sonrası detaylı temizlik ihtiyacında',
    'Düzenli bakım planı kurmak isteyen ev ve iş yeri kullanıcılarında',
    'Hijyen standardını yükseltmek ve kontrol listesi ile ilerlemek gereken senaryolarda',
  ],
  process: [
    'Talep ve alan bilgisi alınır, kapsam netleştirilir.',
    'Yüzey türüne uygun ürün ve ekipman planı yapılır.',
    'Uygulama sonrası kalite kontrol adımıyla teslim tamamlanır.',
  ],
  equipment: ['HEPA filtreli profesyonel süpürge', 'Mikrofiber yüzey setleri', 'Buhar ve ekstraksiyon ekipmanı'],
  standards: [
    'Alan bazlı kontrol listesi ile adım adım uygulama',
    'Yüzeye uygun ürün seçimi ve güvenli dozaj',
    'Uygulama sonrası eksik kontrolü ve hızlı geri bildirim',
  ],
};

const SERVICE_CONTENT_PACKS: Record<string, ServiceContentPack> = {
  'ev-temizligi': {
    idealFor: [
      'Yoğun iş temposunda düzenli temizlik takvimi oluşturmak isteyen hanelerde',
      'Taşınma öncesi/sonrası, misafir öncesi veya mevsim geçişi genel temizlikte',
      'Mutfak-banyo odaklı hijyen kontrolü gereken aile kullanımında',
    ],
    process: [
      'Öncelik alanları (mutfak, banyo, yaşam alanı) belirlenir.',
      'Toz alma, yüzey temizliği ve zemin uygulaması sıralı yürütülür.',
      'Nihai kontrol ve kullanıcı notları ile süreç kapatılır.',
    ],
    equipment: ['Mikrofiber toz alma seti', 'Yüzey uyumlu pH dengeli ürünler', 'Derz ve köşe detay ekipmanları'],
    standards: [
      'Temas yoğun yüzeyler için artırılmış hijyen protokolü',
      'Kullanıcı hassasiyetine göre ürün seçimi (çocuk/evcil hayvan vb.)',
      'Tekrarlı randevuda aynı kaliteyi koruyan kontrol şablonu',
    ],
  },
  'ofis-temizligi': {
    idealFor: [
      'Mesai akışını bozmadan düzenli hijyen standardı isteyen ofislerde',
      'Toplantı odası, ortak alan ve mutfak yoğun kullanılan ekiplerde',
      'Sözleşmeli ve raporlanabilir temizlik modeli arayan kurumsal yapılarda',
    ],
    process: [
      'Mesai saatine göre vardiya planı ve alan önceliği belirlenir.',
      'Ortak alan, çalışma alanı ve ıslak hacim uygulamaları yürütülür.',
      'Haftalık/aylık kontrol turu ile standardizasyon sürdürülür.',
    ],
    equipment: ['Sessiz çalışma modlu ekipman', 'Cam ve yüzey bakım setleri', 'Kurumsal alan kontrol checklisti'],
    standards: [
      'Mesai dışı planlama ile iş sürekliliğini koruma',
      'Temas noktalarında düzenli hijyen takibi',
      'Periyodik raporlama ve tekrar planı',
    ],
  },
  'insaat-sonrasi-temizlik': {
    idealFor: [
      'Tadilat veya yeni teslim alanlarında ince toz ve kalıntı birikimi olduğunda',
      'Yaşama/çalışma başlamadan önce güvenli ve detaylı son temizlik gerektiğinde',
      'Cam, derz, dolap içi ve zemin teslim standardı istenen projelerde',
    ],
    process: [
      'Kaba kalıntı ayrıştırması ve alan güvenlik kontrolü yapılır.',
      'İnce toz, cam, yüzey ve zemin katmanlı temizlikle tamamlanır.',
      'Teslim öncesi kontrol turu ile eksikler kapatılır.',
    ],
    equipment: ['Yüksek emiş gücüne sahip toz ekipmanı', 'Yüzey dostu inşaat sonrası ürün seti', 'Cam ve derz detay ekipmanları'],
    standards: [
      'Yüzey türüne göre hasarsız uygulama prensibi',
      'Katmanlı temizlik sırası ile toz geri dönüşünü azaltma',
      'Teslim checklisti ile net kapanış',
    ],
  },
};

function toAbsoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const input = pathOrUrl.trim();
  if (/^https?:\/\//i.test(input)) return input;
  const base = getSiteUrl();
  return `${base}${input.startsWith('/') ? input : `/${input}`}`;
}

// ============================================
// METADATA GENERATION
// ============================================

/**
 * Generate dynamic metadata for service detail page
 * @param params Route parameters with slug
 * @returns SEO metadata
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const service = await prisma.service.findUnique({
      where: { slug },
    });

    if (!service || !service.isActive) {
      return {
        title: 'Hizmet Bulunamadı | Günen Temizlik',
        description: 'Aradığınız hizmet bulunamadı.'
      };
    }

    const title = service.metaTitle?.trim() || `${service.title} | Günen Temizlik - İstanbul`;
    const description = service.metaDesc || service.shortDesc;
    const canonical = canonicalUrl(`/hizmetler/${service.slug}`);
    const imageUrl = toAbsoluteUrl(service.image) ?? canonicalUrl('/logo.png');
    const derivedKeywords = serviceKeywordsFromTitleAndSlug(`${service.title} ${service.slug}`);

    return {
      title,
      description,
      keywords: keywordsForPage('hizmetler', [...derivedKeywords, ...service.features]),
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonical,
        locale: 'tr_TR',
        siteName: 'Günen Temizlik',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: service.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'Temizlik Hizmet Detayı | İstanbul | Günen',
      description: 'İstanbul genelinde profesyonel temizlik hizmet detayları ve teklif bilgileri.',
    };
  }
}

// ============================================
// JSON-LD STRUCTURED DATA HELPER
// ============================================

/**
 * Generate JSON-LD structured data for Service schema
 * @param service Service data from Prisma
 * @returns JSON-LD object
 */
function generateServiceSchema(service: ServiceData) {
  const image = toAbsoluteUrl(service.image);
  const url = canonicalUrl(`/hizmetler/${service.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    "name": service.title,
    "url": url,
    "serviceType": service.title,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Günen Temizlik Şirketi",
      "url": canonicalUrl('/'),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": SITE_CONTACT.addressLine,
        "addressLocality": SITE_CONTACT.addressLocality,
        "addressRegion": SITE_CONTACT.addressRegion,
        "postalCode": SITE_CONTACT.postalCode,
        "addressCountry": "TR"
      }
    },
    "areaServed": "İstanbul",
    "description": service.description || service.shortDesc,
    "image": image || canonicalUrl('/logo.png'),
  };
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

/**
 * Service Detail Page Component
 * Dinamik hizmet detay sayfası.
 * 
 * @param params Route parameters
 * @returns Service detail page
 * @throws notFound() if service not found or inactive
 */
export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch service data from database
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  // Handle not found or inactive service
  if (!service || !service.isActive) {
    notFound();
  }

  // Generate structured data
  const serviceSchema = generateServiceSchema(service as ServiceData);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Hizmetler', url: '/hizmetler' },
    { name: service.title, url: `/hizmetler/${service.slug}` },
  ]);
  const serviceFaq = serviceFaqFromFeatures(service.features || []);
  const contentPack = SERVICE_CONTENT_PACKS[service.slug] ?? DEFAULT_CONTENT_PACK;
  const serviceMeta = getServiceBySlug(service.slug);
  const relatedBlogs = serviceMeta
    ? await prisma.blogPost.findMany({
        where: {
          published: true,
          OR: [
            { tags: { hasSome: serviceMeta.blogTagHints } },
            { title: { contains: service.title, mode: 'insensitive' } },
            { excerpt: { contains: service.title, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }, { views: 'desc' }],
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
        },
      })
    : [];
  const faqSchema = generateFAQSchema(serviceFaq);
  const schemaGraph = serializeSchemaGraph([
    serviceSchema as Record<string, unknown>,
    breadcrumbSchema,
    faqSchema,
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaGraph }} />

      <SiteLayout>
        {/* Hero Section */}
        <section
          className="bg-slate-900 pt-24 pb-12 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16"
          aria-label="Hizmet başlığı"
        >
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 sm:h-20 sm:w-20">
              <Sparkles className="h-8 w-8 text-emerald-400 sm:h-10 sm:w-10" aria-hidden="true" />
            </div>
            <h1 className="text-balance break-words text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              {service.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              {service.shortDesc}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <main className="bg-white dark:bg-slate-900">
          <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Service Image */}
            {service.image && (
              <figure className="mb-12 aspect-video overflow-hidden rounded-2xl">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={1200}
                  height={630}
                  className="h-full w-full object-cover"
                  priority
                />
              </figure>
            )}

            {getServiceBySlug(service.slug) && (
              <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Bu hizmetin verildiği bölgeler</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Bölgenize özel sayfalardan hızlıca teklif alabilir, süreç detaylarını görebilirsiniz.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {DISTRICT_LANDINGS.slice(0, 6).map((district) => (
                    <Link
                      key={district.slug}
                      href={`/bolgeler/${district.slug}/${service.slug}`}
                      className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      {district.name} {service.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300">
              {service.description ? (
                <div dangerouslySetInnerHTML={{ __html: service.description }} />
              ) : (
                <p>{service.shortDesc}</p>
              )}
            </div>

            {/* Features */}
            {service.features.length > 0 && (
              <section className="mt-12" aria-label="Hizmet özellikleri">
                <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                  Hizmet Özellikleri
                </h2>
                <ul className="space-y-4" role="list">
                  {service.features.map((feature: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                      role="listitem"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                İstanbul'da {service.title} hangi durumlarda tercih edilir?
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
                {contentPack.idealFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {service.title} süreci nasıl ilerliyor?
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700 dark:text-slate-300">
                {contentPack.process.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label="Ekipman ve standartlar">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Kullandığımız ekipmanlar</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
                  {contentPack.equipment.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Uygulama standartlarımız</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
                  {contentPack.standards.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Trust Indicators */}
            <section className="mt-12 grid gap-4 sm:grid-cols-2" aria-label="Güvenceler">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Shield className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Kalite Kontrol Adımı</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Uygulama sonrası eksik kontrol ve hızlı geri bildirim</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Clock className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">24 saat açık</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Acil durumlar için her zaman</p>
                </div>
              </div>
            </section>

            <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sık sorulanlar</h2>
              <div className="mt-4 space-y-3">
                {serviceFaq.map((faq) => (
                  <div key={faq.question} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{faq.question}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {relatedBlogs.length > 0 && (
              <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {service.title} ile ilgili blog rehberleri
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Hizmete karar verirken size yardımcı olacak içerikler:
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {relatedBlogs.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-emerald-500/40 dark:border-slate-700 dark:bg-slate-900/40"
                    >
                      <p className="text-xs text-emerald-600 dark:text-emerald-300">{post.category}</p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-white">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* CTA Buttons */}
            <nav
              className="mt-12 flex flex-col gap-4 sm:flex-row"
              aria-label="Hizmet aksiyonları"
            >
              <Link
                href="/iletisim"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-white font-semibold hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Phone size={20} aria-hidden="true" />
                Hemen Teklif Al
              </Link>
              <Link
                href="/hizmetler"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-8 py-4 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <ArrowRight size={20} aria-hidden="true" />
                Tüm Hizmetler
              </Link>

              <Link
                href="/harita-ve-yorumlar"
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-8 py-4 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Sparkles size={20} aria-hidden="true" />
                Harita ve Yorumlar
              </Link>
            </nav>
          </article>
        </main>
      </SiteLayout>
    </>
  );
}
