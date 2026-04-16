import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit-log';
import { getToken } from 'next-auth/jwt';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function normalizePath(p: string): string {
  const t = p.trim();
  if (!t.startsWith('/')) return `/${t}`;
  return t.replace(/\/+$/, '') || '/';
}

export async function PUT(request: NextRequest, { params }: Params) {
  const err = await requireAdminOnly(request);
  if (err) return err;
  const { id } = await params;
  try {
    const body = (await request.json()) as {
      fromPath?: string;
      toPath?: string;
      permanent?: boolean;
      active?: boolean;
    };
    const data: Prisma.RedirectRuleUpdateInput = {};
    if (body.fromPath !== undefined) data.fromPath = normalizePath(String(body.fromPath));
    if (body.toPath !== undefined) {
      const raw = String(body.toPath).trim();
      data.toPath = raw.startsWith('http') ? raw.slice(0, 2000) : normalizePath(raw);
    }
    if (body.permanent !== undefined) data.permanent = Boolean(body.permanent);
    if (body.active !== undefined) data.active = Boolean(body.active);
    const row = await prisma.redirectRule.update({
      where: { id },
      data,
    });
    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'redirect.update',
      resource: 'RedirectRule',
      resourceId: id,
      metadata: data,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json(
      { error: 'Yönlendirme kuralı güncellenemedi' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const err = await requireAdminOnly(request);
  if (err) return err;
  const { id } = await params;
  try {
    await prisma.redirectRule.delete({ where: { id } });
    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'redirect.delete',
      resource: 'RedirectRule',
      resourceId: id,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Silinemedi' }, { status: 400 });
  }
}
