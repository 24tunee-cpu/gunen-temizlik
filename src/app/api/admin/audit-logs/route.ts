import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const err = await requireAdminOnly(request);
  if (err) return err;
  const take = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get('take') || '50')));
  const skip = Math.max(0, Number(request.nextUrl.searchParams.get('skip') || '0'));
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.auditLog.count(),
  ]);
  return NextResponse.json({ rows, total, take, skip });
}
