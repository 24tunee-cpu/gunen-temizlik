import { NextRequest } from 'next/server';
import { GET as GET_SITE_SETTINGS, PUT as PUT_SITE_SETTINGS, OPTIONS as OPTIONS_SITE_SETTINGS } from '@/app/api/site-settings/route';

export async function OPTIONS() {
  return OPTIONS_SITE_SETTINGS();
}

export async function GET(request: NextRequest) {
  return GET_SITE_SETTINGS(request);
}

export async function PUT(request: NextRequest) {
  return PUT_SITE_SETTINGS(request);
}

export async function POST(request: NextRequest) {
  return PUT_SITE_SETTINGS(request);
}
