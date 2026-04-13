import { NextRequest, NextResponse } from 'next/server';
import { runSeoChecklistAutoSync } from '@/lib/gsc-sync';
import { requireAdminAuth, requireApiKey } from '@/lib/security';

async function authorize(req: NextRequest) {
  const adminErr = await requireAdminAuth(req);
  if (!adminErr) return null;

  const apiErr = requireApiKey(req);
  if (!apiErr) return null;
  return adminErr;
}

export async function POST(request: NextRequest) {
  const authError = await authorize(request);
  if (authError) return authError;

  const source = request.headers.get('x-api-key') ? 'cron' : 'manual';
  const result = await runSeoChecklistAutoSync(source);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

