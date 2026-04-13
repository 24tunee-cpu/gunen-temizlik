import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/security';
import { listMediaFiles } from '@/lib/media-inventory';

/**
 * Admin medya kütüphanesi: public/uploads dosyaları + DB kullanım haritası.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const items = await listMediaFiles();
    return NextResponse.json(items);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Medya listelenemedi';
    console.error('GET /api/media', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
