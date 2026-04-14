import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit-log';
import { getToken } from 'next-auth/jwt';
import { revalidatePath } from 'next/cache';
import { SITE_CONTACT } from '@/config/site-contact';

export const dynamic = 'force-dynamic';

async function getRow() {
  let row = await prisma.siteSettings.findFirst();
  if (!row) {
    row = await prisma.siteSettings.create({
      data: {
        siteName: 'Günen Temizlik',
        siteDescription: "İstanbul'un güvenilir profesyonel temizlik şirketi",
        siteUrl: 'https://gunentemizlik.com',
        email: SITE_CONTACT.email,
        phone: SITE_CONTACT.phoneDisplay,
        whatsapp: SITE_CONTACT.whatsappDigits,
      },
    });
  }
  return row;
}

export async function GET(request: NextRequest) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  const row = await getRow();
  return NextResponse.json({
    promoBannerJson: row.promoBannerJson ?? null,
    trustBandItemsJson: row.trustBandItemsJson ?? null,
    messageTemplatesJson: row.messageTemplatesJson ?? null,
    marketingBannerVariant: row.marketingBannerVariant ?? 'A',
    consentPolicyVersion: row.consentPolicyVersion ?? '1',
  });
}

export async function PUT(request: NextRequest) {
  const err = await requireAdminAuth(request);
  if (err) return err;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const row = await getRow();
    const data: Record<string, unknown> = {};
    if (body.promoBannerJson !== undefined) {
      if (body.promoBannerJson === null) data.promoBannerJson = null;
      else if (typeof body.promoBannerJson === 'object') data.promoBannerJson = body.promoBannerJson;
      else return NextResponse.json({ error: 'promoBannerJson nesne veya null' }, { status: 400 });
    }
    if (body.trustBandItemsJson !== undefined) {
      if (body.trustBandItemsJson === null) data.trustBandItemsJson = null;
      else if (Array.isArray(body.trustBandItemsJson)) data.trustBandItemsJson = body.trustBandItemsJson;
      else return NextResponse.json({ error: 'trustBandItemsJson dizi veya null' }, { status: 400 });
    }
    if (body.messageTemplatesJson !== undefined) {
      if (body.messageTemplatesJson === null) data.messageTemplatesJson = null;
      else if (typeof body.messageTemplatesJson === 'object') data.messageTemplatesJson = body.messageTemplatesJson;
      else return NextResponse.json({ error: 'messageTemplatesJson nesne veya null' }, { status: 400 });
    }
    if (body.marketingBannerVariant !== undefined) {
      const v = String(body.marketingBannerVariant).toUpperCase();
      if (v !== 'A' && v !== 'B') {
        return NextResponse.json({ error: 'marketingBannerVariant A veya B' }, { status: 400 });
      }
      data.marketingBannerVariant = v;
    }
    if (body.consentPolicyVersion !== undefined) {
      data.consentPolicyVersion = String(body.consentPolicyVersion).slice(0, 32);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }
    const updated = await prisma.siteSettings.update({
      where: { id: row.id },
      data: data as Parameters<typeof prisma.siteSettings.update>[0]['data'],
    });
    const secret = process.env.NEXTAUTH_SECRET || 'development-secret-do-not-use-in-production';
    const token = await getToken({ req: request, secret });
    await writeAuditLog({
      userId: token?.sub ?? null,
      userEmail: String(token?.email || 'unknown'),
      action: 'site.marketing.update',
      resource: 'SiteSettings',
      resourceId: row.id,
      metadata: { keys: Object.keys(data) },
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    });
    revalidatePath('/');
    revalidatePath('/iletisim');
    return NextResponse.json({
      promoBannerJson: updated.promoBannerJson ?? null,
      trustBandItemsJson: updated.trustBandItemsJson ?? null,
      messageTemplatesJson: updated.messageTemplatesJson ?? null,
      marketingBannerVariant: updated.marketingBannerVariant ?? 'A',
      consentPolicyVersion: updated.consentPolicyVersion ?? '1',
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Kaydedilemedi' },
      { status: 500 }
    );
  }
}
