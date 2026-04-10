'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { createLogger } from '@/lib/logger';
import { toast } from '@/store/toastStore';
import { trackError } from '@/lib/client-error-handler';
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Loader2,
  RefreshCw,
  FileText,
  MessageSquare,
  Sparkles,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  services: number;
  blogPosts: number;
  contactRequests: number;
  unreadMessages: number;
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgSessionTime: string;
}

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'contact';
  title: string;
  user: string;
  timestamp: string;
  entity: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trendValue && (
            <p className={`mt-1 flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> :
                trend === 'down' ? <ArrowDownRight size={14} /> : null}
              {trendValue}
            </p>
          )}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function MiniChart({ data, color = 'bg-emerald-500' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((value, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${((value - min) / range) * 100}%` }}
          transition={{ delay: i * 0.1 }}
          className={`flex-1 rounded-t ${color} opacity-80 dark:opacity-60 hover:opacity-100 dark:hover:opacity-80 transition-opacity`}
        />
      ))}
    </div>
  );
}

function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'create': return <Sparkles size={14} className="text-emerald-600" />;
      case 'update': return <Activity size={14} className="text-blue-600" />;
      case 'delete': return <ArrowDownRight size={14} className="text-red-600" />;
      case 'contact': return <MessageSquare size={14} className="text-purple-600" />;
      default: return <Eye size={14} className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activity.user} • {activity.entity}</p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{activity.timestamp}</span>
        </motion.div>
      ))}
    </div>
  );
}

const logger = createLogger('admin/dashboard');

export default function AdminDashboardPage() {
  useAuth();
  const [stats, setStats] = useState<Stats>({
    services: 0,
    blogPosts: 0,
    contactRequests: 0,
    unreadMessages: 0,
    pageViews: 1247,
    uniqueVisitors: 856,
    conversionRate: 3.2,
    avgSessionTime: '2:34',
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('Dashboard mounted, fetching stats');

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.debug('Fetching dashboard data from APIs');

        const [servicesRes, blogRes, contactRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/blog'),
          fetch('/api/contact'),
        ]);

        // Check responses
        if (!servicesRes.ok) {
          throw new Error(`Services API failed: ${servicesRes.status}`);
        }
        if (!blogRes.ok) {
          throw new Error(`Blog API failed: ${blogRes.status}`);
        }
        if (!contactRes.ok) {
          throw new Error(`Contact API failed: ${contactRes.status}`);
        }

        const services = await servicesRes.json();
        const blogPosts = await blogRes.json();
        const contacts = await contactRes.json();

        logger.info('Dashboard data fetched successfully', {
          servicesCount: services.length,
          blogCount: blogPosts.length,
          contactsCount: contacts.length,
        });

        setStats(prev => ({
          ...prev,
          services: services.length,
          blogPosts: blogPosts.length,
          contactRequests: contacts.length,
          unreadMessages: contacts.filter((c: any) => !c.read).length,
        }));

        setRecentMessages(contacts.slice(0, 5));

        // Mock activity feed
        setActivities([
          { id: '1', type: 'create', title: 'Yeni hizmet eklendi', user: 'Admin', timestamp: '2 dk önce', entity: 'Hizmetler' },
          { id: '2', type: 'contact', title: 'Yeni iletişim talebi', user: 'Ziyaretçi', timestamp: '5 dk önce', entity: 'İletişim' },
          { id: '3', type: 'update', title: 'Blog yazısı güncellendi', user: 'Admin', timestamp: '15 dk önce', entity: 'Blog' },
          { id: '4', type: 'view', title: 'Sayfa görüntüleme', user: 'Ziyaretçi', timestamp: '1 saat önce', entity: 'Analytics' },
          { id: '5', type: 'create', title: 'Yeni blog yazısı', user: 'Admin', timestamp: '2 saat önce', entity: 'Blog' },
        ]);

        toast.success('Dashboard yüklendi', 'Veriler başarıyla güncellendi', 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        logger.error('Failed to fetch dashboard stats', { error: errorMessage }, err instanceof Error ? err : undefined);
        trackError(err instanceof Error ? err : new Error(errorMessage), { context: 'dashboard' });
        setError(errorMessage);
        toast.error('Veri yüklenemedi', errorMessage, 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-emerald-500/30 dark:border-t-emerald-500/30"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-xl p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Veri Yüklenemedi</h3>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const chartData = [45, 52, 48, 65, 72, 68, 85, 92, 88, 95, 102, 110];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hoş geldiniz! İşte bugünün özeti.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <Calendar size={16} />
          {new Date().toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Hizmet"
          value={stats.services}
          icon={Sparkles}
          trend="up"
          trendValue="+2 bu ay"
          color="bg-gradient-to-br from-emerald-400 to-emerald-600"
          delay={0}
        />
        <StatsCard
          title="Blog Yazısı"
          value={stats.blogPosts}
          icon={FileText}
          trend="up"
          trendValue="+5 bu ay"
          color="bg-gradient-to-br from-blue-400 to-blue-600"
          delay={0.1}
        />
        <StatsCard
          title="Ziyaretçi (Bugün)"
          value={stats.uniqueVisitors}
          icon={Users}
          trend="up"
          trendValue="+12% vs dün"
          color="bg-gradient-to-br from-purple-400 to-purple-600"
          delay={0.2}
        />
        <StatsCard
          title="Okunmamış Mesaj"
          value={stats.unreadMessages}
          icon={MessageSquare}
          trend={stats.unreadMessages > 0 ? 'up' : 'neutral'}
          trendValue={stats.unreadMessages > 0 ? 'Yeni talep' : 'Tümü okundu'}
          color="bg-gradient-to-br from-orange-400 to-orange-600"
          delay={0.3}
        />
      </div>

      {/* Analytics Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Traffic Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ziyaretçi Trafiği</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Son 12 gün</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <TrendingUp size={16} />
                +24.5%
              </span>
            </div>
          </div>
          <MiniChart data={chartData} />
          <div className="flex justify-between mt-4 text-xs text-slate-400">
            <span>20 Mart</span>
            <span>25 Mart</span>
            <span>30 Mart</span>
            <span>2 Nisan</span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <Link
              href="/admin/hizmetler/yeni"
              className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Sparkles size={20} />
              <span className="font-medium">Yeni Hizmet Ekle</span>
            </Link>
            <Link
              href="/admin/blog/yeni"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <FileText size={20} />
              <span className="font-medium">Blog Yazısı Ekle</span>
            </Link>
            <Link
              href="/admin/talepler"
              className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <MessageSquare size={20} />
              <span className="font-medium">Mesajları Gör</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Son Aktiviteler</h2>
            <Clock size={18} className="text-slate-400" />
          </div>
          <ActivityFeed activities={activities} />
        </motion.div>

        {/* Recent Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Son İletişim Talepleri</h2>
            <MessageSquare size={18} className="text-slate-400" />
          </div>
          {recentMessages.length === 0 ? (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">Henüz mesaj yok</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <Users size={18} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{message.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{message.service || 'Genel'}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${message.read
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                      }`}
                  >
                    {message.read ? 'Okundu' : 'Yeni'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
