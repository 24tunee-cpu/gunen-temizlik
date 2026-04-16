import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { randomBytes } from 'crypto';
import {
  getMapsGoogleRedirectUri,
  mapsGoogleOAuthConfigured,
  MAPS_GOOGLE_OAUTH_SCOPES,
} from '@/lib/maps-env';
import { getNextAuthJwtSecret } from '@/lib/auth-secret';

function baseUrl(req: NextRequest) {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    req.nextUrl.origin ||
    'http://localhost:3000'
  );
}

export async function GET(request: NextRequest) {
  const secret = getNextAuthJwtSecret();
  const jwt = await getToken({ req: request, secret });
  if (!jwt || jwt.role !== 'ADMIN') {
    const login = new URL('/login', baseUrl(request));
    login.searchParams.set('callbackUrl', '/admin/haritalar');
    return NextResponse.redirect(login);
  }

  if (!mapsGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/admin/haritalar?maps_error=google_not_configured', baseUrl(request))
    );
  }

  const state = randomBytes(24).toString('hex');
  const redirectUri = getMapsGoogleRedirectUri();
  const params = new URLSearchParams({
    client_id: process.env.MAPS_GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: MAPS_GOOGLE_OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const res = NextResponse.redirect(url);
  res.cookies.set('maps_google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
