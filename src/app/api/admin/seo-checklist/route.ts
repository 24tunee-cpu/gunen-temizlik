import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import { ensureSeoChecklistSeedRows } from '@/lib/seo-checklist';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  await ensureSeoChecklistSeedRows();

  const [rows, latestSync] = await Promise.all([
    prisma.seoChecklistStatus.findMany({
      orderBy: [{ sortOrder: 'asc' }, { section: 'asc' }],
    }),
    prisma.seoAutomationSyncLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        source: true,
        status: true,
        message: true,
        startedAt: true,
        finishedAt: true,
        stats: true,
      },
    }),
  ]);
  const summary = {
    total: rows.length,
    completed: rows.filter((r) => r.completed).length,
  };

  return NextResponse.json({ summary, rows, latestSync });
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as
    | { key?: string; completed?: boolean; note?: string | null }
    | null;

  if (!body?.key || typeof body.completed !== 'boolean') {
    return NextResponse.json({ error: 'key ve completed zorunlu.' }, { status: 400 });
  }

  const key = sanitizeInput(body.key).slice(0, 120);
  const note = typeof body.note === 'string' ? sanitizeInput(body.note).slice(0, 500) : null;

  const row = await prisma.seoChecklistStatus.update({
    where: { key },
    data: {
      completed: body.completed,
      completedAt: body.completed ? new Date() : null,
      note,
    },
  });

  return NextResponse.json({ ok: true, row });
}

