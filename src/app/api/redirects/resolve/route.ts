import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Middleware ve harici tüketiciler için hafif yönlendirme çözümü (Prisma Edge dışında).
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '';
  if (!path.startsWith('/') || path.length > 512) {
    return NextResponse.json({ redirect: null }, { status: 200 });
  }

  try {
    const rule = await prisma.redirectRule.findFirst({
      where: { fromPath: path, active: true },
      select: { toPath: true, permanent: true },
    });
    if (!rule) {
      return NextResponse.json({ redirect: null, permanent: false });
    }
    return NextResponse.json({
      redirect: rule.toPath,
      permanent: rule.permanent,
    });
  } catch {
    return NextResponse.json({ redirect: null }, { status: 200 });
  }
}
