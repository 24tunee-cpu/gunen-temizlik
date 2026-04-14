'use client';

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  MessageSquare,
  Settings,
  Image as ImageIcon,
  Mail,
  Users,
  Award,
  HelpCircle,
  DollarSign,
  FolderOpen,
  BarChart3,
  WandSparkles,
  MapPin,
  Link2,
  CalendarClock,
  ScrollText,
  Megaphone,
} from 'lucide-react';

/** Alt menü satırı (site dışı için external) */
export type AdminMenuChild = {
  href: string;
  label: string;
  external?: boolean;
};

export type AdminMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
  /** Varsa sidebar’da açılır alt menü */
  children?: AdminMenuChild[];
};

export type AdminMenuGroup = {
  id: string;
  label: string;
  items: AdminMenuItem[];
};

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'operasyon',
    label: 'Operasyon',
    items: [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        ariaLabel: 'Yönetim özeti',
      },
      { href: '/admin/talepler', label: 'Müşteri talepleri', icon: MessageSquare, ariaLabel: 'İletişim talepleri' },
      { href: '/admin/randevular', label: 'Randevu talepleri', icon: CalendarClock, ariaLabel: 'Keşif ve randevu' },
    ],
  },
  {
    id: 'icerik',
    label: 'İçerik yönetimi',
    items: [
      { href: '/admin/hizmetler', label: 'Hizmetler', icon: Sparkles, ariaLabel: 'Hizmetler yönetimi' },
      { href: '/admin/blog', label: 'Blog', icon: FileText, ariaLabel: 'Blog yazıları' },
      { href: '/admin/galeri', label: 'Galeri', icon: ImageIcon, ariaLabel: 'Galeri yönetimi' },
      { href: '/admin/medya', label: 'Medya', icon: FolderOpen, ariaLabel: 'Medya kütüphanesi' },
      { href: '/admin/ekip', label: 'Ekibimiz', icon: Users, ariaLabel: 'Ekip üyeleri' },
      { href: '/admin/sertifikalar', label: 'Sertifikalar', icon: Award, ariaLabel: 'Sertifikalar' },
      {
        href: '/admin/sss',
        label: 'Bilgi merkezi',
        icon: HelpCircle,
        ariaLabel: 'SSS, rehber ve referanslar',
        children: [
          { href: '/admin/sss', label: 'SSS' },
          { href: '/rehber', label: 'Rehber (site)', external: true },
          { href: '/admin/referanslar', label: 'Referanslar' },
        ],
      },
      { href: '/admin/fiyatlar', label: 'Fiyat listesi', icon: DollarSign, ariaLabel: 'Fiyat listesi' },
    ],
  },
  {
    id: 'buyume',
    label: 'Büyüme ve SEO',
    items: [
      { href: '/admin/haritalar', label: 'Haritalar', icon: MapPin, ariaLabel: 'Google, Yandex ve Apple harita profilleri' },
      { href: '/admin/yonlendirmeler', label: 'URL yönlendirmeleri', icon: Link2, ariaLabel: '301/302 yönlendirme' },
      { href: '/admin/pazarlama-icerik', label: 'Pazarlama içerik', icon: Megaphone, ariaLabel: 'Banner ve şablonlar' },
      { href: '/admin/ebulten', label: 'E-bülten', icon: Mail, ariaLabel: 'Bülten aboneleri' },
      { href: '/admin/pazarlama-analitik', label: 'Pazarlama analitik', icon: BarChart3, ariaLabel: 'Pazarlama performansı' },
      { href: '/admin/seo-otomasyon', label: 'SEO otomasyon', icon: WandSparkles, ariaLabel: 'Programatik SEO otomasyon' },
    ],
  },
  {
    id: 'sistem',
    label: 'Sistem',
    items: [
      { href: '/admin/ayarlar', label: 'Site ayarları', icon: Settings, ariaLabel: 'Site ayarları' },
      { href: '/admin/denetim', label: 'Denetim günlüğü', icon: ScrollText, ariaLabel: 'Audit log' },
    ],
  },
];

/** Aktif sayfa — alt rotalar dahil (ör. /admin/blog/yeni → Blog) */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(`${href}/`);
}

/** Header başlığı: en uzun eşleşen menü etiketi (alt menü öncelikli) */
export function getAdminPageTitle(pathname: string): string {
  let bestLen = -1;
  let title = 'Yönetim Paneli';
  for (const g of ADMIN_MENU_GROUPS) {
    for (const item of g.items) {
      if (item.children?.length) {
        let childHit = false;
        for (const ch of item.children) {
          if (ch.external) continue;
          if (isAdminNavActive(pathname, ch.href) && ch.href.length >= bestLen) {
            bestLen = ch.href.length;
            title = ch.label;
            childHit = true;
          }
        }
        if (childHit) continue;
      }
      if (isAdminNavActive(pathname, item.href) && item.href.length >= bestLen) {
        bestLen = item.href.length;
        title = item.label;
      }
    }
  }
  return title;
}

/** Sidebar vurgusu: grup veya tek link */
export function isAdminMenuItemActive(pathname: string, item: AdminMenuItem): boolean {
  if (item.children?.some((c) => !c.external && isAdminNavActive(pathname, c.href))) {
    return true;
  }
  return isAdminNavActive(pathname, item.href);
}

export function flattenAdminMenuItems(): AdminMenuItem[] {
  return ADMIN_MENU_GROUPS.flatMap((g) => g.items);
}

/** Menü düzleştirme (alt satırlar ayrı kayıt — arama vb. için) */
export function flattenAdminMenuLeaves(): { href: string; label: string; groupId: string }[] {
  const out: { href: string; label: string; groupId: string }[] = [];
  for (const g of ADMIN_MENU_GROUPS) {
    for (const item of g.items) {
      if (item.children?.length) {
        for (const ch of item.children) {
          out.push({ href: ch.href, label: ch.label, groupId: g.id });
        }
      } else {
        out.push({ href: item.href, label: item.label, groupId: g.id });
      }
    }
  }
  return out;
}
