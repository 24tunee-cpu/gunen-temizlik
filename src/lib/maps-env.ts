/**
 * Haritalar / Google Business ortak env yardımcıları
 */

export function getMapsGoogleRedirectUri(): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return `${base}/api/admin/maps/google/oauth/callback`;
}

export function mapsGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.MAPS_GOOGLE_CLIENT_ID?.trim() && process.env.MAPS_GOOGLE_CLIENT_SECRET?.trim()
  );
}

export const MAPS_GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ');
