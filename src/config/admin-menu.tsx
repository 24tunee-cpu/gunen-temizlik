'use client';

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  MessageSquare,
  Settings,
  Image as ImageIcon,
  Quote,
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

export type AdminMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
};

export type AdminMenuGroup = {
  id: string;
  label: string;
  items: AdminMenuItem[];
};

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'genel',
    label: 'Genel',
    items: [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        ariaLabel: 'Yönetim özeti',
      },
    ],
  },
  {
    id: 'icerik',
    label: 'İçerik',
    items: [
      { href: '/admin/hizmetler', label: 'Hizmetler', icon: Sparkles, ariaLabel: 'Hizmetler yönetimi' },
      { href: '/admin/blog', label: 'Blog', icon: FileText, ariaLabel: 'Blog yazıları' },
      { href: '/admin/galeri', label: 'Galeri', icon: ImageIcon, ariaLabel: 'Galeri yönetimi' },
      { href: '/admin/medya', label: 'Medya', icon: FolderOpen, ariaLabel: 'Medya kütüphanesi' },
      { href: '/admin/ekip', label: 'Ekibimiz', icon: Users, ariaLabel: 'Ekip üyeleri' },
      { href: '/admin/sertifikalar', label: 'Sertifikalar', icon: Award, ariaLabel: 'Sertifikalar' },
      { href: '/admin/sss', label: 'SSS', icon: HelpCircle, ariaLabel: 'Sıkça sorulan sorular' },
      { href: '/admin/fiyatlar', label: 'Fiyat listesi', icon: DollarSign, ariaLabel: 'Fiyat listesi' },
    ],
  },
  {
    id: 'iletisim',
    label: 'İletişim ve pazarlama',
    items: [
      { href: '/admin/referanslar', label: 'Referanslar', icon: Quote, ariaLabel: 'Müşteri yorumları' },
      { href: '/admin/haritalar', label: 'Haritalar', icon: MapPin, ariaLabel: 'Google, Yandex ve Apple harita profilleri' },
      { href: '/admin/talepler', label: 'Müşteri talepleri', icon: MessageSquare, ariaLabel: 'İletişim talepleri' },
      { href: '/admin/randevular', label: 'Randevu talepleri', icon: CalendarClock, ariaLabel: 'Keşif ve randevu' },
      { href: '/admin/yonlendirmeler', label: 'URL yönlendirmeleri', icon: Link2, ariaLabel: '301/302 yönlendirme' },
      { href: '/admin/pazarlama-icerik', label: 'Pazarlama içerik', icon: Megaphone, ariaLabel: 'Banner ve şablonlar' },
      { href: '/admin/denetim', label: 'Denetim günlüğü', icon: ScrollText, ariaLabel: 'Audit log' },
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
    ],
  },
];

/** Aktif sayfa — alt rotalar dahil (ör. /admin/blog/yeni → Blog) */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(`${href}/`);
}

/** Header başlığı: en uzun eşleşen menü etiketi */
export function getAdminPageTitle(pathname: string): string {
  let bestLen = -1;
  let title = 'Yönetim Paneli';
  for (const g of ADMIN_MENU_GROUPS) {
    for (const item of g.items) {
      if (isAdminNavActive(pathname, item.href) && item.href.length >= bestLen) {
        bestLen = item.href.length;
        title = item.label;
      }
    }
  }
  return title;
}

export function flattenAdminMenuItems(): AdminMenuItem[] {
  return ADMIN_MENU_GROUPS.flatMap((g) => g.items);
}
