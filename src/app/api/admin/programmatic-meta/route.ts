import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, sanitizeInput } from '@/lib/security';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const rows = await prisma.programmaticMetaOverride.findMany({
    orderBy: [{ district: 'asc' }, { service: 'asc' }],
  });
  return NextResponse.json(rows);
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as
    | {
        key?: string;
        district?: string;
        service?: string;
        title?: string | null;
        description?: string | null;
        isActive?: boolean;
      }
    | null;

  if (!body?.key || !body?.district || !body?.service) {
    return NextResponse.json({ error: 'key, district, service zorunlu.' }, { status: 400 });
  }

  const key = sanitizeInput(body.key).slice(0, 120);
  const district = sanitizeInput(body.district).slice(0, 80);
  const service = sanitizeInput(body.service).slice(0, 120);
  const title = typeof body.title === 'string' ? sanitizeInput(body.title).slice(0, 140) : null;
  const description =
    typeof body.description === 'string' ? sanitizeInput(body.description).slice(0, 260) : null;
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;

  const row = await prisma.programmaticMetaOverride.upsert({
    where: { key },
    create: { key, district, service, title, description, isActive },
    update: { district, service, title, description, isActive },
  });

  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => null)) as { key?: string } | null;
  if (!body?.key) {
    return NextResponse.json({ error: 'key zorunlu.' }, { status: 400 });
  }

  const key = sanitizeInput(body.key).slice(0, 120);
  await prisma.programmaticMetaOverride.deleteMany({ where: { key } });
  return NextResponse.json({ ok: true });
}
