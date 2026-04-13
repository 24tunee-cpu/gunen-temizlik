import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';
import {
  ensureMapPlatformRows,
  isConnectionStatus,
  isMapPlatformId,
  MAP_PLATFORMS,
  parseChecklistState,
} from '@/lib/map-platforms';

const MAX_URL = 2000;
const MAX_NAME = 200;
const MAX_ID = 500;
const MAX_NOTES = 4000;

function trimUrl(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = sanitizeInput(String(v)).trim();
  if (!t) return null;
  return t.slice(0, MAX_URL);
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  await ensureMapPlatformRows();

  const rows = await prisma.mapPlatformListing.findMany({
    orderBy: { platform: 'asc' },
  });

  const order = [...MAP_PLATFORMS];
  rows.sort((a, b) => order.indexOf(a.platform as (typeof MAP_PLATFORMS)[number]) - order.indexOf(b.platform as (typeof MAP_PLATFORMS)[number]));

  return NextResponse.json({ listings: rows });
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as
    | {
        platform?: string;
        businessName?: string | null;
        listingUrl?: string | null;
        dashboardUrl?: string | null;
        mapsEmbedUrl?: string | null;
        externalPlaceId?: string | null;
        connectionStatus?: string;
        checklistState?: Record<string, boolean> | null;
        internalNotes?: string | null;
      }
    | null;

  if (!body?.platform || !isMapPlatformId(body.platform)) {
    return NextResponse.json({ error: 'Geçerli platform gerekli (google, yandex, apple).' }, { status: 400 });
  }

  await ensureMapPlatformRows();

  const platform = body.platform;

  if (body.connectionStatus != null && !isConnectionStatus(body.connectionStatus)) {
    return NextResponse.json({ error: 'Geçersiz connectionStatus.' }, { status: 400 });
  }

  let checklistJson: Record<string, boolean> | undefined;
  if (body.checklistState !== undefined) {
    if (body.checklistState === null) {
      checklistJson = {};
    } else if (typeof body.checklistState === 'object' && !Array.isArray(body.checklistState)) {
      checklistJson = {};
      for (const [k, v] of Object.entries(body.checklistState)) {
        const key = sanitizeInput(k).slice(0, 80);
        if (key && typeof v === 'boolean') checklistJson[key] = v;
      }
    }
  }

  const data: Record<string, unknown> = {
    lastManualSyncAt: new Date(),
  };

  if (body.businessName !== undefined) {
    data.businessName =
      body.businessName == null || String(body.businessName).trim() === ''
        ? null
        : sanitizeInput(String(body.businessName)).slice(0, MAX_NAME);
  }
  if (body.listingUrl !== undefined) data.listingUrl = trimUrl(body.listingUrl ?? undefined);
  if (body.dashboardUrl !== undefined) data.dashboardUrl = trimUrl(body.dashboardUrl ?? undefined);
  if (body.mapsEmbedUrl !== undefined) data.mapsEmbedUrl = trimUrl(body.mapsEmbedUrl ?? undefined);
  if (body.externalPlaceId !== undefined) {
    data.externalPlaceId =
      body.externalPlaceId == null || String(body.externalPlaceId).trim() === ''
        ? null
        : sanitizeInput(String(body.externalPlaceId)).slice(0, MAX_ID);
  }
  if (body.internalNotes !== undefined) {
    data.internalNotes =
      body.internalNotes == null || String(body.internalNotes).trim() === ''
        ? null
        : sanitizeInput(String(body.internalNotes)).slice(0, MAX_NOTES);
  }
  if (body.connectionStatus !== undefined) data.connectionStatus = body.connectionStatus;
  if (checklistJson !== undefined) data.checklistState = checklistJson;

  const row = await prisma.mapPlatformListing.update({
    where: { platform },
    data,
  });

  return NextResponse.json({
    ok: true,
    listing: {
      ...row,
      checklistState: parseChecklistState(row.checklistState),
    },
  });
}
