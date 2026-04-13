import { prisma } from '@/lib/prisma';

const FALLBACK_ICON = '/favicon.ico';

/**
 * Sekme ikonu için URL: önce favicon, yoksa logo, yoksa varsayılan.
 * Göreli yollar `/` ile; mutlak URL'ler olduğu gibi döner.
 */
export async function getSiteIconHref(): Promise<string> {
  try {
    const row = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { favicon: true, logo: true },
    });
    const fav = row?.favicon?.trim();
    const logo = row?.logo?.trim();
    const raw = (fav && fav.length > 0 ? fav : logo && logo.length > 0 ? logo : FALLBACK_ICON).trim();
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return raw.startsWith('/') ? raw : `/${raw}`;
  } catch {
    return FALLBACK_ICON;
  }
}
