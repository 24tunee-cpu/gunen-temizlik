import { google } from 'googleapis';
import type { Prisma } from '@prisma/client';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';
import { prisma } from '@/lib/prisma';
import { ensureSeoChecklistSeedRows } from '@/lib/seo-checklist';

type SyncSource = 'manual' | 'cron';

type SyncResult = {
  ok: boolean;
  message: string;
  stats: Record<string, unknown>;
};

function knownKeysSet() {
  return new Set(
    DISTRICT_LANDINGS.flatMap((d) => SERVICE_LANDINGS.map((s) => `${d.slug}/${s.slug}`))
  );
}

function keyFromPage(rawPage: string): { key: string; path: string } | null {
  let path = rawPage;
  try {
    if (rawPage.startsWith('http')) {
      path = new URL(rawPage).pathname;
    }
  } catch {
    // ignore and fallback
  }
  const m = path.match(/^\/bolgeler\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { key: `${m[1]}/${m[2]}`, path: `/bolgeler/${m[1]}/${m[2]}` };
}

function getGscCredentials() {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json) as { client_email: string; private_key: string };
  }

  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (email && privateKey) {
    return { client_email: email, private_key: privateKey };
  }

  return null;
}

async function fetchGscRows(days = 28) {
  const credentials = getGscCredentials();
  const siteUrl = process.env.GSC_SITE_URL;
  if (!credentials || !siteUrl) {
    return { rows: [], skipped: true, reason: 'GSC credentials/site URL missing' } as const;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const webmasters = google.webmasters({ version: 'v3', auth });

  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const rows: Array<{
    page: string;
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }> = [];

  let startRow = 0;
  const rowLimit = 25000;
  while (true) {
    const resp = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit,
        startRow,
      },
    });

    const chunk = (resp.data.rows || []).map((r) => ({
      page: String(r.keys?.[0] || ''),
      query: String(r.keys?.[1] || ''),
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctr: Number(r.ctr || 0),
      position: Number(r.position || 99),
    }));

    rows.push(...chunk);
    if (chunk.length < rowLimit) break;
    startRow += rowLimit;
  }

  return { rows, skipped: false, reason: '' } as const;
}

export async function runSeoChecklistAutoSync(source: SyncSource): Promise<SyncResult> {
  await ensureSeoChecklistSeedRows();
  const startedAt = new Date();
  const log = await prisma.seoAutomationSyncLog.create({
    data: {
      source,
      status: 'running',
      startedAt,
      message: 'SEO checklist automation started',
    },
  });

  try {
    const stats: Record<string, unknown> = {};
    const knownKeys = knownKeysSet();

    // 1) sitemap presence check
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gunentemizlik.com';
    const sitemapResp = await fetch(`${base.replace(/\/$/, '')}/sitemap.xml`, { method: 'GET' });
    const sitemapText = sitemapResp.ok ? await sitemapResp.text() : '';
    const hasBolgeler = sitemapText.includes('/bolgeler/');
    stats.sitemapBolgeler = hasBolgeler;
    await prisma.seoChecklistStatus.update({
      where: { key: 'post24h-sitemap-bolgeler' },
      data: {
        completed: hasBolgeler,
        completedAt: hasBolgeler ? new Date() : null,
        note: hasBolgeler
          ? 'Otomasyon: sitemap içinde /bolgeler path tespit edildi.'
          : 'Otomasyon: sitemap içinde /bolgeler path tespit edilemedi.',
      },
    });

    // 2) GSC metrics
    const gsc = await fetchGscRows(28);
    stats.gscSkipped = gsc.skipped;
    stats.gscReason = gsc.reason;
    stats.gscRows = gsc.rows.length;

    const agg = new Map<
      string,
      { pagePath: string; clicks: number; impressions: number; ctrWeighted: number; posWeighted: number; topQuery: string }
    >();
    for (const row of gsc.rows) {
      const parsed = keyFromPage(row.page);
      if (!parsed || !knownKeys.has(parsed.key)) continue;
      const curr = agg.get(parsed.key) || {
        pagePath: parsed.path,
        clicks: 0,
        impressions: 0,
        ctrWeighted: 0,
        posWeighted: 0,
        topQuery: row.query,
      };
      curr.clicks += row.clicks;
      curr.impressions += row.impressions;
      curr.ctrWeighted += row.ctr * row.impressions;
      curr.posWeighted += row.position * row.impressions;
      if (row.impressions > curr.impressions * 0.35) curr.topQuery = row.query;
      agg.set(parsed.key, curr);
    }

    const metricDate = new Date();
    metricDate.setHours(0, 0, 0, 0);
    let upsertedMetrics = 0;
    for (const [key, v] of agg.entries()) {
      const impressions = v.impressions || 1;
      await prisma.gscLandingMetric.upsert({
        where: { key_date: { key, date: metricDate } },
        create: {
          key,
          pagePath: v.pagePath,
          date: metricDate,
          clicks: v.clicks,
          impressions: v.impressions,
          ctr: v.ctrWeighted / impressions,
          position: v.posWeighted / impressions,
          topQuery: v.topQuery,
        },
        update: {
          pagePath: v.pagePath,
          clicks: v.clicks,
          impressions: v.impressions,
          ctr: v.ctrWeighted / impressions,
          position: v.posWeighted / impressions,
          topQuery: v.topQuery,
        },
      });
      upsertedMetrics += 1;
    }
    stats.metricsUpserted = upsertedMetrics;

    const metrics = [...agg.entries()].map(([key, v]) => ({
      key,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions ? v.ctrWeighted / v.impressions : 0,
      position: v.impressions ? v.posWeighted / v.impressions : 99,
    }));
    metrics.sort((a, b) => b.impressions - a.impressions);

    // top10 export check
    const top10Done = metrics.filter((m) => m.impressions > 0).length >= 10;
    await prisma.seoChecklistStatus.update({
      where: { key: 'weekly-top10-export' },
      data: {
        completed: top10Done,
        completedAt: top10Done ? new Date() : null,
        note: gsc.skipped
          ? `Otomasyon: GSC atlandı (${gsc.reason}).`
          : `Otomasyon: ${metrics.length} landing ölçüldü, top10 yeterlilik=${top10Done}.`,
      },
    });

    // low CTR meta update check
    const lowCtrKeys = metrics
      .filter((m) => m.impressions >= 100 && m.ctr < 0.012)
      .map((m) => m.key)
      .slice(0, 30);
    const overrideCount = lowCtrKeys.length
      ? await prisma.programmaticMetaOverride.count({
          where: { key: { in: lowCtrKeys }, isActive: true },
        })
      : 0;
    const lowCtrDone = lowCtrKeys.length === 0 || overrideCount >= Math.min(5, lowCtrKeys.length);
    await prisma.seoChecklistStatus.update({
      where: { key: 'weekly-low-ctr-meta-update' },
      data: {
        completed: lowCtrDone,
        completedAt: lowCtrDone ? new Date() : null,
        note: gsc.skipped
          ? `Otomasyon: GSC atlandı (${gsc.reason}).`
          : `Otomasyon: düşük CTR key=${lowCtrKeys.length}, aktif override=${overrideCount}.`,
      },
    });

    // monthly new combination plan check
    const enoughQuerySignals = metrics.filter((m) => m.impressions >= 80).length >= 8;
    await prisma.seoChecklistStatus.update({
      where: { key: 'monthly-new-combination-plan' },
      data: {
        completed: enoughQuerySignals,
        completedAt: enoughQuerySignals ? new Date() : null,
        note: gsc.skipped
          ? `Otomasyon: GSC atlandı (${gsc.reason}).`
          : `Otomasyon: impression>=80 sayfa adedi ${metrics.filter((m) => m.impressions >= 80).length}.`,
      },
    });

    // CTA A/B review check by events
    const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const abCount = await prisma.marketingEvent.count({
      where: {
        createdAt: { gte: from },
        source: { in: ['programmatic-cta-a-wa', 'programmatic-cta-b-wa'] },
      },
    });
    const abDone = abCount >= 20;
    await prisma.seoChecklistStatus.update({
      where: { key: 'weekly-cta-ab-review' },
      data: {
        completed: abDone,
        completedAt: abDone ? new Date() : null,
        note: `Otomasyon: son 14 günde A/B CTA event=${abCount}.`,
      },
    });

    // Semi-manual notes
    const semiManual = [
      'post24h-inspect-5-urls',
      'post24h-rich-results-clean',
      'weekly-internal-link-boost',
      'monthly-cannibalization-review',
    ];
    for (const key of semiManual) {
      await prisma.seoChecklistStatus.update({
        where: { key },
        data: {
          note: 'Bu madde yarı-manuel: otomasyon sinyal üretir, son onay operatör tarafında.',
        },
      });
    }

    await prisma.seoAutomationSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        message: 'SEO checklist automation completed',
        stats: stats as Prisma.InputJsonValue,
      },
    });

    return {
      ok: true,
      message: 'SEO checklist otomatik senkron tamamlandı.',
      stats,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.seoAutomationSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        message,
      },
    });
    return {
      ok: false,
      message: `SEO checklist sync başarısız: ${message}`,
      stats: {},
    };
  }
}

