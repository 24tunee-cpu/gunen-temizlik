import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/security';
import { runGoogleMapsSync } from '@/lib/google-maps-sync';

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const result = await runGoogleMapsSync('manual');
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
