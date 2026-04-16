import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit-log';
import { getToken } from 'next-auth/jwt';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

export const dynamic = 'force-dynamic';

const STATUSES = new Set(['pending', 'confirmed', 'declined', 'done']);

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  const { id } = await params;
  try {
    const body = (await request.json()) as { status?: string; adminNotes?: string | null };
    const data: { status?: string; adminNotes?: string | null } = {};
    if (body.status !== undefined) {
      if (!STATUSES.has(body.status)) {
        return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.adminNotes !== undefined) {
      data.adminNotes =
        body.adminNotes === null ? null : String(body.adminNotes).slice(0, 8000);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Alan yok' }, { status: 400 });
    }
    const row = await prisma.appointmentRequest.update({
      where: { id },
      data,
    });
    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'appointment.update',
      resource: 'AppointmentRequest',
      resourceId: id,
      metadata: data,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 400 });
  }
}
