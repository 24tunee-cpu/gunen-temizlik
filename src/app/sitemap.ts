import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/seo';

type StaticEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

/** Herkese açık sayfalar (admin / auth hariç). */
const STATIC_PAGES: StaticEntry[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/hizmetler', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/iletisim', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.85 },
  { path: '/galeri', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/referanslar', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/hakkimizda', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/ekibimiz', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/sss', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/gizlilik', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/kullanim-kosullari', changeFrequency: 'yearly', priority: 0.4 },
];

function toAbsoluteUrl(base: string, path: string): string {
  if (!path) return `${base}/`;
  return `${base}${path}`;
}

/**
 * Sitemap — statik sayfalar + yayında blog yazıları + aktif hizmet detayları.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: toAbsoluteUrl(base, path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const [posts, services] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    dynamicEntries = [
      ...posts.map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
      ...services.map((s) => ({
        url: `${base}/hizmetler/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      })),
    ];
  } catch {
    // Örn. build sırasında DB yoksa yalnızca statik URL'ler döner.
  }

  return [...staticEntries, ...dynamicEntries];
}
