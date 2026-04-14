/**
 * Admin dashboard özet API — yalnızca ADMIN oturumu.
 * Tüm sayılar Prisma ile veritabanından; sahte analitik yok.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildLast7DaysContactSeries(
  rows: { createdAt: Date }[],
  now: Date
): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(localDateKey(d));
    labels.push(
      d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })
    );
  }
  const values = keys.map(() => 0);
  const idxMap = new Map(keys.map((k, i) => [k, i] as const));
  for (const row of rows) {
    const k = localDateKey(new Date(row.createdAt));
    const ix = idxMap.get(k);
    if (ix !== undefined) values[ix] += 1;
  }
  return { labels, values };
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminAuth(req);
  if (denied) return denied;

  try {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const startCurrentWeek = new Date(end);
    startCurrentWeek.setDate(startCurrentWeek.getDate() - 6);
    startCurrentWeek.setHours(0, 0, 0, 0);

    const startPrevWeek = new Date(startCurrentWeek);
    startPrevWeek.setDate(startPrevWeek.getDate() - 7);

    const [
      servicesTotal,
      servicesActive,
      blogTotal,
      blogPublished,
      blogViewsAgg,
      contactsTotal,
      contactsUnread,
      teamActive,
      faqActive,
      testimonialsActive,
      galleryActive,
      subscribersActive,
      certificatesActive,
      contactsThisWeek,
      contactsPrevWeek,
      contactsForChart,
      recentContacts,
      recentBlog,
    ] = await prisma.$transaction([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.contactRequest.count(),
      prisma.contactRequest.count({ where: { read: false } }),
      prisma.teamMember.count({ where: { isActive: true } }),
      prisma.faq.count({ where: { isActive: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.gallery.count({ where: { isActive: true } }),
      prisma.subscriber.count({ where: { isActive: true } }),
      prisma.certificate.count({ where: { isActive: true } }),
      prisma.contactRequest.count({
        where: { createdAt: { gte: startCurrentWeek, lte: end } },
      }),
      prisma.contactRequest.count({
        where: { createdAt: { gte: startPrevWeek, lt: startCurrentWeek } },
      }),
      prisma.contactRequest.findMany({
        where: { createdAt: { gte: startCurrentWeek } },
        select: { createdAt: true },
      }),
      prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          service: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          updatedAt: true,
        },
      }),
    ]);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [appointmentsPending, contactsPipelineNew, marketingEventsWeek, lastMapSync] =
      await Promise.all([
        prisma.appointmentRequest.count({ where: { status: 'pending' } }),
        prisma.contactRequest.count({ where: { pipelineStatus: 'new' } }),
        prisma.marketingEvent.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.mapSyncRun.findFirst({
          orderBy: { startedAt: 'desc' },
          select: { status: true, message: true, startedAt: true, provider: true },
        }),
      ]);

    const blogViewsTotal = blogViewsAgg._sum.views ?? 0;
    const blogDrafts = blogTotal - blogPublished;
    const servicesInactive = servicesTotal - servicesActive;

    const { labels: chartLabels, values: chartValues } = buildLast7DaysContactSeries(
      contactsForChart,
      now
    );

    let contactsWeekHint: string;
    if (contactsThisWeek === 0 && contactsPrevWeek === 0) {
      contactsWeekHint = 'Son 14 günde yeni talep yok';
    } else if (contactsPrevWeek === 0) {
      contactsWeekHint = `Son 7 gün: ${contactsThisWeek} talep`;
    } else {
      const pct = Math.round(
        ((contactsThisWeek - contactsPrevWeek) / contactsPrevWeek) * 100
      );
      contactsWeekHint = `Son 7 gün ${contactsThisWeek} talep · önceki 7 güne göre ${pct >= 0 ? '+' : ''}${pct}%`;
    }

    type ActivityKind = 'contact' | 'blog';

    const activity: Array<{
      id: string;
      kind: ActivityKind;
      title: string;
      subtitle: string;
      at: string;
    }> = [];

    for (const c of recentContacts) {
      activity.push({
        id: `contact-${c.id}`,
        kind: 'contact',
        title: `İletişim: ${c.name}`,
        subtitle: c.service?.trim() || c.email,
        at: c.createdAt.toISOString(),
      });
    }
    for (const b of recentBlog) {
      activity.push({
        id: `blog-${b.id}`,
        kind: 'blog',
        title: b.title,
        subtitle: b.published ? 'Yayında · güncellendi' : 'Taslak',
        at: b.updatedAt.toISOString(),
      });
    }

    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const activityTop = activity.slice(0, 10);

    return NextResponse.json({
      generatedAt: now.toISOString(),
      counts: {
        servicesTotal,
        servicesActive,
        servicesInactive,
        blogTotal,
        blogPublished,
        blogDrafts,
        blogViewsTotal,
        contactsTotal,
        contactsUnread,
        teamActive,
        faqActive,
        testimonialsActive,
        galleryActive,
        subscribersActive,
        certificatesActive,
        contactsThisWeek,
        contactsPrevWeek,
      },
      contactsWeekHint,
      chart: {
        labels: chartLabels,
        values: chartValues,
        title: 'İletişim talepleri (son 7 gün)',
      },
      recentContacts: recentContacts.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        service: c.service,
        read: c.read,
        createdAt: c.createdAt.toISOString(),
      })),
      recentBlog: recentBlog.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        published: b.published,
        updatedAt: b.updatedAt.toISOString(),
      })),
      activity: activityTop,
      funnel: {
        appointmentsPending,
        contactsPipelineNew,
        marketingEventsWeek,
        lastMapSync: lastMapSync
          ? {
              status: lastMapSync.status,
              message: lastMapSync.message,
              startedAt: lastMapSync.startedAt.toISOString(),
              provider: lastMapSync.provider,
            }
          : null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[admin/dashboard]', message);
    return NextResponse.json(
      { error: 'Dashboard verileri alınamadı' },
      { status: 500 }
    );
  }
}
