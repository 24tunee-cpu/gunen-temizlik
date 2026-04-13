import { readdir, stat } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const UPLOADS_PUBLIC_PREFIX = '/uploads';
export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export type MediaUsage = {
  /** Kısa kategori: Site, Blog, Galeri… */
  kind: string;
  /** İnsan okunur açıklama */
  label: string;
  /** Admin veya site linki (varsa) */
  href?: string;
};

export type MediaFileRecord = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: string;
  sizeBytes: number;
  uploadedAt: string;
  dimensions?: string;
  usages: MediaUsage[];
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function guessType(fileName: string): 'image' | 'video' | 'document' {
  const lower = fileName.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|ico|svg)$/i.test(lower)) return 'image';
  if (/\.(mp4|webm|mov)$/i.test(lower)) return 'video';
  return 'document';
}

/** /uploads/dosya.jpg → dosya.jpg */
export function extractUploadBasenamesFromString(value: string | null | undefined): string[] {
  if (!value || typeof value !== 'string') return [];
  const out = new Set<string>();
  const re = /\/uploads\/([^"'?\s<>#]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const base = decodeURIComponent(m[1]).replace(/\\/g, '/').split('/').pop();
    if (base && !base.includes('..')) out.add(base);
  }
  return [...out];
}

function addUsage(map: Map<string, MediaUsage[]>, fileName: string, usage: MediaUsage) {
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return;
  const list = map.get(fileName) ?? [];
  const key = `${usage.kind}|${usage.label}|${usage.href ?? ''}`;
  if (!list.some((u) => `${u.kind}|${u.label}|${u.href ?? ''}` === key)) {
    list.push(usage);
    map.set(fileName, list);
  }
}

/**
 * Tüm veritabanı kaynaklarında /uploads/... geçen yerleri tarar.
 */
export async function buildUploadUsageMap(): Promise<Map<string, MediaUsage[]>> {
  const map = new Map<string, MediaUsage[]>();

  const [
    settings,
    services,
    posts,
    gallery,
    certificates,
    team,
    testimonials,
    users,
  ] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.service.findMany({ select: { title: true, slug: true, image: true } }),
    prisma.blogPost.findMany({ select: { title: true, slug: true, image: true, content: true } }),
    prisma.gallery.findMany({ select: { title: true, id: true, image: true } }),
    prisma.certificate.findMany({ select: { title: true, id: true, image: true } }),
    prisma.teamMember.findMany({ select: { name: true, id: true, image: true } }),
    prisma.testimonial.findMany({ select: { name: true, id: true, avatar: true } }),
    prisma.user.findMany({ select: { email: true, image: true } }),
  ]);

  if (settings) {
    const pairs: [string | null | undefined, string][] = [
      [settings.logo, 'Site logosu'],
      [settings.favicon, 'Favicon'],
      [settings.ogImage, 'OG / sosyal paylaşım görseli'],
    ];
    for (const [val, label] of pairs) {
      for (const fn of extractUploadBasenamesFromString(val ?? undefined)) {
        addUsage(map, fn, { kind: 'Site ayarları', label, href: '/admin/ayarlar' });
      }
    }
  }

  for (const s of services) {
    for (const fn of extractUploadBasenamesFromString(s.image)) {
      addUsage(map, fn, {
        kind: 'Hizmet',
        label: s.title,
        href: '/admin/hizmetler',
      });
    }
  }

  for (const p of posts) {
    for (const fn of extractUploadBasenamesFromString(p.image)) {
      addUsage(map, fn, {
        kind: 'Blog (kapak)',
        label: p.title,
        href: '/admin/blog',
      });
    }
    for (const fn of extractUploadBasenamesFromString(p.content)) {
      addUsage(map, fn, {
        kind: 'Blog (içerik)',
        label: p.title,
        href: `/admin/blog`,
      });
    }
  }

  for (const g of gallery) {
    for (const fn of extractUploadBasenamesFromString(g.image)) {
      addUsage(map, fn, {
        kind: 'Galeri',
        label: g.title,
        href: '/admin/galeri',
      });
    }
  }

  for (const c of certificates) {
    for (const fn of extractUploadBasenamesFromString(c.image)) {
      addUsage(map, fn, {
        kind: 'Sertifika',
        label: c.title,
        href: '/admin/sertifikalar',
      });
    }
  }

  for (const t of team) {
    for (const fn of extractUploadBasenamesFromString(t.image)) {
      addUsage(map, fn, {
        kind: 'Ekip',
        label: t.name,
        href: '/admin/ekip',
      });
    }
  }

  for (const te of testimonials) {
    for (const fn of extractUploadBasenamesFromString(te.avatar)) {
      addUsage(map, fn, {
        kind: 'Referans',
        label: te.name,
        href: '/admin/referanslar',
      });
    }
  }

  for (const u of users) {
    for (const fn of extractUploadBasenamesFromString(u.image)) {
      addUsage(map, fn, {
        kind: 'Kullanıcı hesabı',
        label: u.email,
        href: '/admin/dashboard',
      });
    }
  }

  return map;
}

export async function listMediaFiles(): Promise<MediaFileRecord[]> {
  let names: string[] = [];
  try {
    names = await readdir(UPLOADS_DIR);
  } catch {
    return [];
  }

  const usageMap = await buildUploadUsageMap();
  const records: MediaFileRecord[] = [];

  for (const name of names) {
    if (name.startsWith('.') || name === '.gitkeep') continue;
    const full = path.join(UPLOADS_DIR, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;

    const url = `${UPLOADS_PUBLIC_PREFIX}/${encodeURIComponent(name)}`;
    const raw = usageMap.get(name);
    const usages =
      raw && raw.length > 0
        ? raw
        : [
            {
              kind: 'Kullanım',
              label:
                'Kayıtlı referans yok — şablonda, SEO alanında veya harici bağlantıda kullanılıyor olabilir.',
            },
          ];

    records.push({
      id: name,
      name,
      url,
      type: guessType(name),
      sizeBytes: st.size,
      size: formatBytes(st.size),
      uploadedAt: st.mtime.toISOString(),
      usages,
    });
  }

  records.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return records;
}

export function isSafeUploadBasename(name: string): boolean {
  if (!name || name.length > 240) return false;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return false;
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

export async function collectUsagesForBasename(fileName: string): Promise<MediaUsage[]> {
  const map = await buildUploadUsageMap();
  return map.get(fileName) ?? [];
}
