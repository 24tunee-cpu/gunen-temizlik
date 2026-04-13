import { NextRequest, NextResponse } from 'next/server';
import { runGoogleMapsSync } from '@/lib/google-maps-sync';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Zamanlanmış Google Haritalar / GBP önbellek senkronu.
 * Vercel Cron veya harici scheduler: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim() || process.env.MAPS_CRON_SECRET?.trim();
  const auth = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');

  const okSecret = secret && auth === `Bearer ${secret}`;
  const okVercel = vercelCron === '1' && process.env.VERCEL === '1';

  if (!okSecret && !okVercel) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conn = await prisma.mapOAuthConnection.findUnique({ where: { provider: 'google' } });
  if (!conn?.refreshTokenEnc) {
    return NextResponse.json({ skipped: true, reason: 'Google bağlı değil.' });
  }

  const result = await runGoogleMapsSync('cron');
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
