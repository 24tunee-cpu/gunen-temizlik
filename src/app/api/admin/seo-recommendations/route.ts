import { NextRequest, NextResponse } from 'next/server';
import { DISTRICT_LANDINGS, SERVICE_LANDINGS } from '@/config/programmatic-seo';
import { SEO_CHECKLIST_SEED } from '@/config/seo-checklist';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';

type Recommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'meta' | 'content' | 'cta' | 'checklist';
  title: string;
  detail: string;
  key?: string;
};

function keyFromPath(path: string): string | null {
  const m = path.match(/^\/bolgeler\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return `${m[1]}/${m[2]}`;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const days = 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const allKeys = DISTRICT_LANDINGS.flatMap((d) =>
    SERVICE_LANDINGS.map((s) => `${d.slug}/${s.slug}`)
  );

  const [events, overrides, checklistRows] = await Promise.all([
    prisma.marketingEvent.findMany({
      where: { createdAt: { gte: from }, pagePath: { startsWith: '/bolgeler/' } },
      select: { eventType: true, source: true, pagePath: true },
      take: 3000,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.programmaticMetaOverride.findMany({
      where: { isActive: true },
      select: { key: true, title: true, description: true },
    }),
    prisma.seoChecklistStatus.findMany({
      select: { key: true, completed: true, label: true },
      where: { key: { in: SEO_CHECKLIST_SEED.map((x) => x.key) } },
    }),
  ]);

  const statMap = new Map<string, { total: number; phone: number; whatsapp: number }>();
  for (const evt of events) {
    const key = keyFromPath(evt.pagePath || '');
    if (!key) continue;
    const stat = statMap.get(key) || { total: 0, phone: 0, whatsapp: 0 };
    stat.total += 1;
    if (evt.eventType === 'phone_click') stat.phone += 1;
    if (evt.eventType === 'whatsapp_click') stat.whatsapp += 1;
    statMap.set(key, stat);
  }

  const overrideKeys = new Set(overrides.map((o) => o.key));
  const recommendations: Recommendation[] = [];

  // 1) Hot page + missing meta override
  for (const [key, stat] of [...statMap.entries()].sort((a, b) => b[1].total - a[1].total)) {
    if (stat.total < 4) continue;
    if (overrideKeys.has(key)) continue;
    recommendations.push({
      id: `meta-${key}`,
      priority: 'high',
      type: 'meta',
      title: `${key} için meta override ekleyin`,
      detail: `Son 30 günde ${stat.total} etkileşim aldı. Özel title/description ile CTR artırma fırsatı var.`,
      key,
    });
    if (recommendations.length >= 5) break;
  }

  // 2) Zero-event pages
  const zeroEventKeys = allKeys.filter((k) => !statMap.has(k)).slice(0, 6);
  for (const key of zeroEventKeys) {
    recommendations.push({
      id: `content-${key}`,
      priority: 'medium',
      type: 'content',
      title: `${key} sayfası için iç link desteği artırın`,
      detail: 'Son 30 günde dönüşüm event yok. Blog ve hizmet sayfalarından bağlayıp CTA metnini güçlendirin.',
      key,
    });
  }

  // 3) Global CTA winner hint
  let aScore = 0;
  let bScore = 0;
  for (const evt of events) {
    const source = evt.source || '';
    if (source.includes('programmatic-cta-A')) aScore += 1;
    if (source.includes('programmatic-cta-B')) bScore += 1;
  }
  const totalAb = aScore + bScore;
  if (totalAb >= 20) {
    const winner = aScore >= bScore ? 'A' : 'B';
    const diff = Math.abs(aScore - bScore);
    if (diff >= Math.ceil(totalAb * 0.15)) {
      recommendations.push({
        id: 'cta-winner',
        priority: 'medium',
        type: 'cta',
        title: `CTA varyant ${winner} önde görünüyor`,
        detail: `A/B eventleri: A=${aScore}, B=${bScore}. Kazananı yeni varsayılan yapıp yeni varyant testi açın.`,
      });
    }
  }

  // 4) checklist pending nudges
  const completedMap = new Map(checklistRows.map((r) => [r.key, r.completed]));
  for (const item of SEO_CHECKLIST_SEED) {
    if (completedMap.get(item.key)) continue;
    recommendations.push({
      id: `check-${item.key}`,
      priority: 'low',
      type: 'checklist',
      title: `Checklist: ${item.section}`,
      detail: item.label,
    });
    if (recommendations.filter((r) => r.type === 'checklist').length >= 3) break;
  }

  return NextResponse.json({
    rangeDays: days,
    counters: {
      trackedLandingKeys: statMap.size,
      activeOverrides: overrideKeys.size,
      totalLandingKeys: allKeys.length,
    },
    recommendations: recommendations.slice(0, 14),
  });
}

