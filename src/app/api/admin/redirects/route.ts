import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, requireAdminOnly, sanitizeInput } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit-log';
import { getToken } from 'next-auth/jwt';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

export const dynamic = 'force-dynamic';

function normalizePath(p: string): string {
  const t = p.trim();
  if (!t.startsWith('/')) return `/${t}`;
  return t.replace(/\/+$/, '') || '/';
}

export async function GET(request: NextRequest) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  const rows = await prisma.redirectRule.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const err = await requireAdminOnly(request);
  if (err) return err;
  try {
    const body = (await request.json()) as {
      fromPath?: string;
      toPath?: string;
      permanent?: boolean;
      active?: boolean;
    };
    const fromPath = normalizePath(String(body.fromPath || ''));
    const toPathRaw = String(body.toPath || '').trim();
    if (fromPath.length < 2 || toPathRaw.length < 1) {
      return NextResponse.json({ error: 'fromPath ve toPath gerekli' }, { status: 400 });
    }
    const toPath = toPathRaw.startsWith('http') ? sanitizeInput(toPathRaw).slice(0, 2000) : normalizePath(toPathRaw);
    const row = await prisma.redirectRule.create({
      data: {
        fromPath,
        toPath,
        permanent: body.permanent !== false,
        active: body.active !== false,
      },
    });
    const secret = getNextAuthJwtSecret();
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'redirect.create',
      resource: 'RedirectRule',
      resourceId: row.id,
      metadata: { fromPath, toPath },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kayıt oluşturulamadı';
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Bu kaynak yolu zaten tanımlı' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Yönlendirme kuralı oluşturulamadı' }, { status: 500 });
  }
}
