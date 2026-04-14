import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

/** SLA özeti + son senkron (haritalar paneli banner) */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
  const [totalPending, slaBreaches, lastSync] = await Promise.all([
    prisma.mapReviewReplyDraft.count({ where: { status: 'pending' } }),
    prisma.mapReviewReplyDraft.count({
      where: { status: 'pending', createdAt: { lt: twoDaysAgo } },
    }),
    prisma.mapSyncRun.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { status: true, message: true, startedAt: true, provider: true },
    }),
  ]);
  return NextResponse.json({ totalPending, slaBreaches, lastSync });
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as
    | { reviewName?: string; draftText?: string; action?: 'save' | 'approve' }
    | null;

  if (!body?.reviewName?.trim() || typeof body.draftText !== 'string') {
    return NextResponse.json({ error: 'reviewName ve draftText gerekli.' }, { status: 400 });
  }

  const reviewName = sanitizeInput(body.reviewName).slice(0, 500);
  const draftText = sanitizeInput(body.draftText).slice(0, 4000);
  const action = body.action === 'approve' ? 'approve' : 'save';

  const review = await prisma.mapReviewSnapshot.findUnique({ where: { reviewName } });
  if (!review) {
    return NextResponse.json({ error: 'Yorum önbellekte yok; önce senkron çalıştırın.' }, { status: 404 });
  }

  let status = 'pending';
  let approvedAt: Date | null = null;
  if (action === 'approve') {
    status = 'approved';
    approvedAt = new Date();
  }

  const row = await prisma.mapReviewReplyDraft.upsert({
    where: {
      provider_reviewName: { provider: review.provider, reviewName },
    },
    create: {
      provider: review.provider,
      reviewName,
      draftText,
      status,
      approvedAt,
    },
    update: {
      draftText,
      ...(action === 'approve'
        ? { status: 'approved', approvedAt: new Date() }
        : { status: 'pending', approvedAt: null, sentAt: null, errorMessage: null }),
    },
  });

  return NextResponse.json({ ok: true, draft: row });
}
