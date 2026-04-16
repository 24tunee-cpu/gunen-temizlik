import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';
import { getMapsGoogleRedirectUri, mapsGoogleOAuthConfigured } from '@/lib/maps-env';
import { saveGoogleOAuthTokens } from '@/lib/google-maps-sync';
import { ensureMapPlatformRows } from '@/lib/map-platforms';
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
    return NextResponse.redirect(new URL('/admin/haritalar?maps_error=unauthorized', baseUrl(request)));
  }

  const cookieState = request.cookies.get('maps_google_oauth_state')?.value;
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  const redirectWithClear = (path: string) => {
    const r = NextResponse.redirect(new URL(path, baseUrl(request)));
    r.cookies.set('maps_google_oauth_state', '', { maxAge: 0, path: '/' });
    return r;
  };

  if (err) {
    return redirectWithClear(`/admin/haritalar?maps_error=${encodeURIComponent(err)}`);
  }

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithClear('/admin/haritalar?maps_error=invalid_state');
  }

  if (!mapsGoogleOAuthConfigured()) {
    return redirectWithClear('/admin/haritalar?maps_error=google_not_configured');
  }

  const clientId = process.env.MAPS_GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.MAPS_GOOGLE_CLIENT_SECRET!.trim();
  const redirectUri = getMapsGoogleRedirectUri();

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  let tokens;
  try {
    const tr = await oauth2.getToken(code);
    tokens = tr.tokens;
  } catch {
    return redirectWithClear('/admin/haritalar?maps_error=token_exchange');
  }

  const refresh = tokens.refresh_token;
  if (!refresh) {
    return redirectWithClear('/admin/haritalar?maps_error=no_refresh_token');
  }

  oauth2.setCredentials(tokens);
  let email: string | null = null;
  try {
    const u = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (u.ok) {
      const j = (await u.json()) as { email?: string };
      email = j.email ?? null;
    }
  } catch {
    // isteğe bağlı
  }

  await ensureMapPlatformRows();

  await saveGoogleOAuthTokens({
    refreshToken: refresh,
    accessToken: tokens.access_token ?? null,
    expiryDate: tokens.expiry_date ?? null,
    email,
  });

  return redirectWithClear('/admin/haritalar?maps_tab=google&maps_ok=connected');
}
