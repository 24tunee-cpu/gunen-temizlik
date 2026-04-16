import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, requireAdminAuth, sanitizeInput } from '@/lib/security';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_POSTS_PER_MINUTE = 60;

function hashIp(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET || 'marketing-events-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24);
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const ip = getClientIp(request);

  const limit = checkRateLimit(`marketing-events:${ip}`, MAX_POSTS_PER_MINUTE, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many events' }, { status: 429, headers });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const eventType = typeof body.eventType === 'string' ? body.eventType.trim() : '';
    if (!['phone_click', 'whatsapp_click', 'email_click'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400, headers });
    }

    const source = typeof body.source === 'string' ? sanitizeInput(body.source).slice(0, 80) : null;
    const linkUrl = typeof body.link_url === 'string' ? sanitizeInput(body.link_url).slice(0, 400) : null;
    const linkText = typeof body.link_text === 'string' ? sanitizeInput(body.link_text).slice(0, 200) : null;
    const pagePath = typeof body.location === 'string' ? sanitizeInput(body.location).slice(0, 240) : null;

    await prisma.marketingEvent.create({
      data: {
        eventType,
        source,
        linkUrl,
        linkText,
        pagePath,
        userAgent: sanitizeInput(request.headers.get('user-agent') || '').slice(0, 500) || null,
        ipHash: hashIp(ip),
      },
    });

    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (error) {
    return NextResponse.json({ error: 'Event could not be recorded' }, { status: 500, headers });
  }
}

export async function GET(request: NextRequest) {
  const headers = { ...CORS_HEADERS };
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || 14)));
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [events, total, phoneClicks, whatsappClicks, emailClicks] = await Promise.all([
      prisma.marketingEvent.findMany({
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.marketingEvent.count({ where: { createdAt: { gte: from } } }),
      prisma.marketingEvent.count({ where: { createdAt: { gte: from }, eventType: 'phone_click' } }),
      prisma.marketingEvent.count({ where: { createdAt: { gte: from }, eventType: 'whatsapp_click' } }),
      prisma.marketingEvent.count({ where: { createdAt: { gte: from }, eventType: 'email_click' } }),
    ]);

    return NextResponse.json(
      {
        rangeDays: days,
        summary: { total, phoneClicks, whatsappClicks, emailClicks },
        events,
      },
      { headers }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Events could not be loaded' }, { status: 500, headers });
  }
}
