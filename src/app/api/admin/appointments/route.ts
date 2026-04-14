import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  const status = request.nextUrl.searchParams.get('status')?.trim();
  const where = status ? { status } : {};
  const rows = await prisma.appointmentRequest.findMany({
    where,
    orderBy: { preferredDate: 'asc' },
  });
  return NextResponse.json(rows);
}
