import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';
import { disconnectGoogleMaps } from '@/lib/google-maps-sync';
import { mapsGoogleOAuthConfigured } from '@/lib/maps-env';
import { ensureMapPlatformRows } from '@/lib/map-platforms';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  await ensureMapPlatformRows();

  const configured = mapsGoogleOAuthConfigured();
  const conn = await prisma.mapOAuthConnection.findUnique({ where: { provider: 'google' } });
  const lastSync = await prisma.mapSyncRun.findFirst({
    where: { provider: 'google' },
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      source: true,
      status: true,
      message: true,
      startedAt: true,
      finishedAt: true,
      stats: true,
    },
  });

  const locationRows = await prisma.mapLocationSnapshot.findMany({
    where: { provider: 'google' },
    orderBy: { title: 'asc' },
    select: { resourceName: true, title: true },
  });

  const accountSet = new Set<string>();
  for (const l of locationRows) {
    const m = l.resourceName.match(/^(accounts\/[^/]+)\//);
    if (m) accountSet.add(m[1]);
  }

  const locationCount = locationRows.length;
  const reviewCount = await prisma.mapReviewSnapshot.count({ where: { provider: 'google' } });
  const pendingDrafts = await prisma.mapReviewReplyDraft.count({
    where: { provider: 'google', status: 'pending' },
  });
  const approvedDrafts = await prisma.mapReviewReplyDraft.count({
    where: { provider: 'google', status: 'approved' },
  });

  return NextResponse.json({
    configured,
    connected: Boolean(conn?.refreshTokenEnc),
    accountEmail: conn?.accountEmail ?? null,
    preferredAccountName: conn?.preferredAccountName ?? null,
    preferredLocationName: conn?.preferredLocationName ?? null,
    accessExpiresAt: conn?.accessExpiresAt?.toISOString() ?? null,
    lastSync,
    accounts: [...accountSet].map((name) => ({ name })),
    locations: locationRows,
    counts: {
      locations: locationCount,
      reviews: reviewCount,
      pendingDrafts,
      approvedDrafts,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  await disconnectGoogleMaps();
  return NextResponse.json({ ok: true });
}
