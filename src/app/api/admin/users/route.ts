import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Talep ataması için admin/editör listesi */
export async function GET(request: NextRequest) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'EDITOR'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { email: 'asc' },
  });
  return NextResponse.json(users);
}
