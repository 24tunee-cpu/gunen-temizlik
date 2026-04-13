import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';

/**
 * Google yorumları + taslak durumları (önbellekten).
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const platform = request.nextUrl.searchParams.get('platform') || 'google';
  if (platform !== 'google') {
    return NextResponse.json({ reviews: [], message: 'Bu platform için henüz önbellek yok.' });
  }

  const [reviews, drafts] = await Promise.all([
    prisma.mapReviewSnapshot.findMany({
      where: { provider: platform },
      orderBy: { fetchedAt: 'desc' },
      take: 200,
    }),
    prisma.mapReviewReplyDraft.findMany({
      where: { provider: platform },
    }),
  ]);

  const draftByReview = new Map(drafts.map((d) => [d.reviewName, d]));

  const merged = reviews.map((r) => {
    const d = draftByReview.get(r.reviewName);
    return {
      reviewName: r.reviewName,
      locationResourceName: r.locationResourceName,
      reviewerDisplayName: r.reviewerDisplayName,
      starRating: r.starRating,
      comment: r.comment,
      replyComment: r.replyComment,
      reviewTime: r.reviewTime,
      fetchedAt: r.fetchedAt.toISOString(),
      draft: d
        ? {
            id: d.id,
            draftText: d.draftText,
            status: d.status,
            approvedAt: d.approvedAt?.toISOString() ?? null,
            sentAt: d.sentAt?.toISOString() ?? null,
            errorMessage: d.errorMessage,
          }
        : null,
    };
  });

  return NextResponse.json({ reviews: merged });
}
