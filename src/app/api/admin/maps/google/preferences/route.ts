import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as
    | { preferredAccountName?: string | null; preferredLocationName?: string | null }
    | null;

  const acc =
    body?.preferredAccountName != null && String(body.preferredAccountName).trim() !== ''
      ? sanitizeInput(String(body.preferredAccountName)).slice(0, 320)
      : null;
  const loc =
    body?.preferredLocationName != null && String(body.preferredLocationName).trim() !== ''
      ? sanitizeInput(String(body.preferredLocationName)).slice(0, 320)
      : null;

  const existing = await prisma.mapOAuthConnection.findUnique({ where: { provider: 'google' } });
  if (!existing) {
    return NextResponse.json({ error: 'Önce Google hesabını bağlayın.' }, { status: 400 });
  }

  const row = await prisma.mapOAuthConnection.update({
    where: { provider: 'google' },
    data: {
      preferredAccountName: acc,
      preferredLocationName: loc,
    },
  });

  return NextResponse.json({
    ok: true,
    preferredAccountName: row.preferredAccountName,
    preferredLocationName: row.preferredLocationName,
  });
}
