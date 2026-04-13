import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allProgrammaticPairs, buildSmartMetaForPair } from '@/lib/programmatic-smart-meta';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

type Body = {
  mode?: 'missing' | 'all';
};

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as Body;
  const mode = body.mode === 'all' ? 'all' : 'missing';

  const log = await prisma.seoAutomationSyncLog.create({
    data: {
      source: 'smart_meta_bulk',
      status: 'running',
      message: `mode=${mode}`,
    },
  });

  let upserted = 0;
  let skipped = 0;

  try {
    for (const { district, service, key } of allProgrammaticPairs()) {
      const existing = await prisma.programmaticMetaOverride.findUnique({
        where: { key },
        select: { title: true, description: true },
      });

      if (
        mode === 'missing' &&
        existing?.title?.trim() &&
        existing?.description?.trim()
      ) {
        skipped++;
        continue;
      }

      const { title, description } = buildSmartMetaForPair(district, service);

      await prisma.programmaticMetaOverride.upsert({
        where: { key },
        create: {
          key,
          district: sanitizeInput(district.slug).slice(0, 80),
          service: sanitizeInput(service.slug).slice(0, 120),
          title: sanitizeInput(title).slice(0, 140),
          description: sanitizeInput(description).slice(0, 260),
          isActive: true,
        },
        update: {
          district: sanitizeInput(district.slug).slice(0, 80),
          service: sanitizeInput(service.slug).slice(0, 120),
          title: sanitizeInput(title).slice(0, 140),
          description: sanitizeInput(description).slice(0, 260),
          isActive: true,
        },
      });
      upserted++;
    }

    const stats = { mode, upserted, skipped, totalPairs: upserted + skipped };
    await prisma.seoAutomationSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'ok',
        message: `${upserted} sayfa güncellendi, ${skipped} atlandı.`,
        finishedAt: new Date(),
        stats,
      },
    });

    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
    await prisma.seoAutomationSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'error',
        message: msg,
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
