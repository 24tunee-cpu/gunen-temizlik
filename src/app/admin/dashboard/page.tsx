'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Loader2,
  RefreshCw,
  FileText,
  MessageSquare,
  Sparkles,
  Eye,
  HelpCircle,
  Image as ImageIcon,
  Mail,
  Award,
  Quote,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// TYPES (API /api/admin/dashboard ile uyumlu)
// ============================================

interface DashboardPayload {
  generatedAt: string;
  counts: {
    servicesTotal: number;
    servicesActive: number;
    servicesInactive: number;
    blogTotal: number;
    blogPublished: number;
    blogDrafts: number;
    blogViewsTotal: number;
    contactsTotal: number;
    contactsUnread: number;
    teamActive: number;
    faqActive: number;
    testimonialsActive: number;
    galleryActive: number;
    subscribersActive: number;
    certificatesActive: number;
    contactsThisWeek: number;
    contactsPrevWeek: number;
  };
  contactsWeekHint: string;
  chart: { labels: string[]; values: number[]; title: string };
  recentContacts: Array<{
    id: string;
    name: string;
    email: string;
    service?: string | null;
    read: boolean;
    createdAt: string;
  }>;
  recentBlog: Array<{
    id: string;
    title: string;
    slug: string;
    published: boolean;
    updatedAt: string;
  }>;
  activity: Array<{
    id: string;
    kind: 'contact' | 'blog';
    title: string;
    subtitle: string;
    at: string;
  }>;
}

// ============================================
// HELPERS
// ============================================

function formatRelativeTr(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return new Date(iso).toLocaleString('tr-TR');
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} sa. önce`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 14) return `${diffD} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(n);
}

// ============================================
// UI PARTS
// ============================================

function StatsCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  trendLabel,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:shadow-none sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.07] dark:opacity-[0.12]"
        style={{ background: 'currentColor' }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {hint ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>
          ) : null}
          {trendLabel ? (
            <p
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                trend === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend === 'down'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight size={14} aria-hidden />
              ) : trend === 'down' ? (
                <ArrowDownRight size={14} aria-hidden />
              ) : null}
              {trendLabel}
            </p>
          ) : null}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner ${color}`}
        >
          <Icon className="h-6 w-6 text-white" aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}

const CHART_MAX_PX = 112;

function MiniBarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  const safeValues = values.length ? values : [0];
  const safeLabels = labels.length === safeValues.length ? labels : safeValues.map(() => '');

  return (
    <div>
      <div className="flex h-[7.5rem] items-end gap-1.5 sm:gap-2">
        {safeValues.map((value, i) => {
          const barPx = Math.max(6, Math.round((value / max) * CHART_MAX_PX));
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barPx }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[2.75rem] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-700 dark:to-emerald-500"
                title={`${formatNumber(value)} talep`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[10px] text-slate-400 dark:text-slate-500 sm:text-xs">
        {safeLabels.map((lab, i) => (
          <span key={i} className="min-w-0 flex-1 truncate text-center">
            {lab}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({
  items,
}: {
  items: DashboardPayload['activity'];
}) {
  const icon = (kind: string) => {
    switch (kind) {
      case 'contact':
        return <MessageSquare size={14} className="text-violet-600 dark:text-violet-400" />;
      case 'blog':
        return <FileText size={14} className="text-sky-600 dark:text-sky-400" />;
      default:
        return <Activity size={14} className="text-slate-600" />;
    }
  };

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Henüz kayıtlı aktivite yok. İletişim veya blog güncellemeleri burada görünecek.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((row) => (
        <li key={row.id}>
          <div className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/80"
              aria-hidden
            >
              {icon(row.kind)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-slate-900 dark:text-white">
                {row.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {row.subtitle}
              </p>
            </div>
            <time
              className="shrink-0 text-xs text-slate-400 dark:text-slate-500"
              dateTime={row.at}
            >
              {formatRelativeTr(row.at)}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-700 lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

const CONTENT_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ElementType;
  key: keyof DashboardPayload['counts'];
}> = [
  { href: '/admin/ekip', label: 'Ekip', icon: Users, key: 'teamActive' },
  { href: '/admin/sss', label: 'SSS', icon: HelpCircle, key: 'faqActive' },
  { href: '/admin/referanslar', label: 'Referans', icon: Quote, key: 'testimonialsActive' },
  { href: '/admin/galeri', label: 'Galeri', icon: ImageIcon, key: 'galleryActive' },
  { href: '/admin/ebulten', label: 'Bülten', icon: Mail, key: 'subscribersActive' },
  { href: '/admin/sertifikalar', label: 'Sertifika', icon: Award, key: 'certificatesActive' },
];

// ============================================
// PAGE
// ============================================

export default function AdminDashboardPage() {
  useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Oturum süresi dolmuş veya yetkiniz yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error(`Sunucu yanıtı: ${res.status}`);
      }
      const json = (await res.json()) as DashboardPayload;
      setData(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(msg);
      trackError(err instanceof Error ? err : new Error(msg), { context: 'admin-dashboard' });
      toast.error('Dashboard', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <SkeletonDashboard />;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-center text-slate-600 dark:text-slate-300">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Tekrar dene
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { counts, chart, recentContacts, activity, contactsWeekHint } = data;

  const contactTrend: 'up' | 'down' | 'neutral' =
    counts.contactsThisWeek > counts.contactsPrevWeek
      ? 'up'
      : counts.contactsThisWeek < counts.contactsPrevWeek
        ? 'down'
        : 'neutral';

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-8">
      {/* Üst başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Kontrol paneli
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Site içeriği ve talepler — canlı veritabanı özetiniz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:text-sm">
            <Calendar size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Yenile
          </button>
        </div>
      </div>

      {/* Ana KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Hizmetler"
          value={counts.servicesActive}
          hint={
            counts.servicesTotal === 0
              ? 'Veritabanında henüz hizmet yok'
              : counts.servicesTotal === counts.servicesActive
                ? `${formatNumber(counts.servicesTotal)} kayıt · tümü yayında`
                : `${formatNumber(counts.servicesActive)} yayında · ${formatNumber(counts.servicesInactive)} pasif · ${formatNumber(counts.servicesTotal)} toplam`
          }
          icon={Sparkles}
          trend={counts.servicesInactive > 0 ? 'neutral' : 'up'}
          trendLabel={
            counts.servicesTotal === 0
              ? 'Hizmet eklemek için Hızlı işlemler'
              : counts.servicesInactive > 0
                ? `${formatNumber(counts.servicesInactive)} pasif hizmet`
                : 'Tüm hizmetler aktif'
          }
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={0}
        />
        <StatsCard
          title="Blog"
          value={counts.blogPublished}
          hint={`${formatNumber(counts.blogDrafts)} taslak · ${formatNumber(counts.blogTotal)} yazı · ${formatNumber(counts.blogViewsTotal)} toplam görüntülenme`}
          icon={FileText}
          trend="neutral"
          trendLabel={
            counts.blogDrafts > 0
              ? `${formatNumber(counts.blogDrafts)} yayında değil`
              : 'Tüm yazılar yayında'
          }
          color="bg-gradient-to-br from-sky-500 to-blue-700"
          delay={0.05}
        />
        <StatsCard
          title="Son 7 gün · talep"
          value={counts.contactsThisWeek}
          hint={contactsWeekHint}
          icon={BarChart3}
          trend={contactTrend}
          trendLabel={
            counts.contactsPrevWeek === 0 && counts.contactsThisWeek === 0
              ? 'Önceki 7 gün: 0'
              : `Önceki 7 gün: ${formatNumber(counts.contactsPrevWeek)}`
          }
          color="bg-gradient-to-br from-violet-500 to-purple-700"
          delay={0.1}
        />
        <StatsCard
          title="Okunmamış mesaj"
          value={counts.contactsUnread}
          hint={`${formatNumber(counts.contactsTotal)} toplam iletişim talebi`}
          icon={MessageSquare}
          trend={counts.contactsUnread > 0 ? 'up' : 'neutral'}
          trendLabel={
            counts.contactsUnread > 0
              ? 'Talepler sayfasını kontrol edin'
              : 'Güncel'
          }
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0.15}
        />
      </div>

      {/* İçerik özeti şeridi */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:p-5"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          İçerik envanteri
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CONTENT_LINKS.map(({ href, label, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-emerald-600"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">{label}</span>
              </span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                {formatNumber(counts[key])}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafik */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {chart.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Günlük yeni iletişim formu kayıtları
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Eye size={12} aria-hidden />
              Veritabanı
            </span>
          </div>
          <MiniBarChart values={chart.values} labels={chart.labels} />
        </motion.div>

        {/* Hızlı işlemler */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hızlı işlemler</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sık kullanılan yönetim sayfaları</p>
          <nav className="mt-4 flex flex-col gap-2" aria-label="Hızlı işlemler">
            <Link
              href="/admin/hizmetler/yeni"
              className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={18} />
                Yeni hizmet
              </span>
              <ArrowRight size={16} className="opacity-60" />
            </Link>
            <Link
              href="/admin/blog/yeni"
              className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 transition hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/40"
            >
              <span className="flex items-center gap-2">
                <FileText size={18} />
                Yeni blog yazısı
              </span>
              <ArrowRight size={16} className="opacity-60" />
            </Link>
            <Link
              href="/admin/talepler"
              className="flex items-center justify-between gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900 transition hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-900/40"
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={18} />
                Müşteri talepleri
              </span>
              <ArrowRight size={16} className="opacity-60" />
            </Link>
            <Link
              href="/admin/blog"
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700/50"
            >
              <span className="flex items-center gap-2">
                <FileText size={18} />
                Tüm blog yazıları
              </span>
              <ArrowRight size={16} className="opacity-60" />
            </Link>
          </nav>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Son hareketler</h2>
            <Activity size={18} className="text-slate-400" aria-hidden />
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Son iletişim talepleri ve blog güncellemeleri (birleşik zaman çizelgesi)
          </p>
          <ActivityFeed items={activity} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Son talepler</h2>
            <Link
              href="/admin/talepler"
              className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Tümünü aç
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Henüz iletişim talebi yok.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentContacts.map((m) => (
                <li key={m.id}>
                  <Link
                    href="/admin/talepler"
                    className="flex items-center gap-3 py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <Users size={18} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-white">{m.name}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {m.service?.trim() || m.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.read
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                        }`}
                      >
                        {m.read ? 'Okundu' : 'Yeni'}
                      </span>
                      <time className="text-xs text-slate-400" dateTime={m.createdAt}>
                        {formatRelativeTr(m.createdAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Özet verisi:{' '}
        <time dateTime={data.generatedAt}>
          {new Date(data.generatedAt).toLocaleString('tr-TR')}
        </time>
      </p>
    </div>
  );
}
