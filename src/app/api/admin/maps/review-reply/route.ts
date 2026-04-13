import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import { getValidGoogleAccessToken, postGoogleReviewReply } from '@/lib/google-maps-sync';

/**
 * Onaylanmış taslağı Google’a gönderir (My Business v4 reply).
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as { reviewName?: string } | null;
  if (!body?.reviewName?.trim()) {
    return NextResponse.json({ error: 'reviewName gerekli.' }, { status: 400 });
  }

  const reviewName = sanitizeInput(body.reviewName).slice(0, 500);

  const draft = await prisma.mapReviewReplyDraft.findUnique({
    where: {
      provider_reviewName: { provider: 'google', reviewName },
    },
  });

  if (!draft || draft.status !== 'approved') {
    return NextResponse.json(
      { error: 'Göndermek için taslağın onaylı (approved) olması gerekir.' },
      { status: 400 }
    );
  }

  const access = await getValidGoogleAccessToken();
  if (!access) {
    return NextResponse.json({ error: 'Google access token alınamadı.' }, { status: 401 });
  }

  const result = await postGoogleReviewReply(access.token, reviewName, draft.draftText);

  if (!result.ok) {
    await prisma.mapReviewReplyDraft.update({
      where: { id: draft.id },
      data: {
        status: 'failed',
        errorMessage: `HTTP ${result.status}: ${JSON.stringify(result.data).slice(0, 800)}`,
      },
    });
    return NextResponse.json(
      { ok: false, message: 'Google yanıt gönderilemedi.', detail: result.data },
      { status: 502 }
    );
  }

  await prisma.mapReviewReplyDraft.update({
    where: { id: draft.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      errorMessage: null,
    },
  });

  await prisma.mapReviewSnapshot.update({
    where: { reviewName },
    data: { replyComment: draft.draftText },
  });

  return NextResponse.json({ ok: true });
}
