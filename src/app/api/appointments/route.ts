import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeInput, isValidEmail, isValidPhone } from '@/lib/security';

const rateLimitMap = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 5;

function rl(ip: string): boolean {
  const now = Date.now();
  const t = rateLimitMap.get(ip) || [];
  const v = t.filter((x) => now - x < WINDOW);
  if (v.length >= MAX) return true;
  v.push(now);
  rateLimitMap.set(ip, v);
  return false;
}

function ip(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

const SLOTS = new Set(['morning', 'afternoon', 'evening', 'flexible']);

export async function POST(request: NextRequest) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  const clientIp = ip(request);
  if (rl(clientIp)) {
    return NextResponse.json({ error: 'Çok fazla istek. Lütfen daha sonra deneyin.' }, { status: 429, headers });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.website || body.honeypot) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400, headers });
    }

    const name = sanitizeInput(String(body.name || '')).slice(0, 120);
    const email = sanitizeInput(String(body.email || '').toLowerCase()).slice(0, 200);
    const phone = body.phone ? sanitizeInput(String(body.phone)).slice(0, 30) : '';
    const preferredDateStr = String(body.preferredDate || '');
    const timeSlot = String(body.timeSlot || 'flexible');
    const district = body.district ? sanitizeInput(String(body.district)).slice(0, 120) : null;
    const address = body.address ? sanitizeInput(String(body.address)).slice(0, 500) : null;
    const serviceHint = body.serviceHint ? sanitizeInput(String(body.serviceHint)).slice(0, 200) : null;
    const notes = body.notes ? sanitizeInput(String(body.notes)).slice(0, 2000) : null;

    if (name.length < 2) {
      return NextResponse.json({ error: 'İsim gerekli' }, { status: 400, headers });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Geçerli e-posta girin' }, { status: 400, headers });
    }
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Geçerli telefon girin' }, { status: 400, headers });
    }
    const preferredDate = new Date(preferredDateStr);
    if (Number.isNaN(preferredDate.getTime())) {
      return NextResponse.json({ error: 'Geçerli tarih seçin' }, { status: 400, headers });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preferredDate < today) {
      return NextResponse.json({ error: 'Tarih bugünden önce olamaz' }, { status: 400, headers });
    }
    if (!SLOTS.has(timeSlot)) {
      return NextResponse.json({ error: 'Geçersiz saat dilimi' }, { status: 400, headers });
    }

    const row = await prisma.appointmentRequest.create({
      data: {
        name,
        email,
        phone: phone || null,
        preferredDate,
        timeSlot,
        district,
        address,
        serviceHint,
        notes,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Talebiniz alındı. Ekibimiz en kısa sürede size dönüş yapacak.',
        id: row.id,
      },
      { status: 201, headers }
    );
  } catch (e) {
    console.error('appointment POST', e);
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500, headers });
  }
}
