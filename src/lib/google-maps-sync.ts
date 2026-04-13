/**
 * Google Business Profile / My Business API — hesap, konum ve yorum senkronu.
 * OAuth ile alınan access token kullanır; hata durumunda kısmi sonuç dönebilir.
 */

import { google } from 'googleapis';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { decryptMapsSecret, encryptMapsSecret } from '@/lib/maps-oauth-crypto';
import { getMapsGoogleRedirectUri, mapsGoogleOAuthConfigured } from '@/lib/maps-env';

const PROVIDER = 'google';

type Json = Record<string, unknown>;

async function apiGet(accessToken: string, url: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, data };
}

function starRatingToInt(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number' && raw >= 1 && raw <= 5) return raw;
  if (typeof raw === 'string') {
    const map: Record<string, number> = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
      STAR_RATING_UNSPECIFIED: 0,
    };
    if (map[raw] !== undefined) return map[raw] || null;
    const m = raw.match(/^(\d)/);
    if (m) return parseInt(m[1], 10);
    return null;
  }
  if (typeof raw === 'object' && raw !== null && 'value' in (raw as Json)) {
    return starRatingToInt((raw as Json).value);
  }
  return null;
}

export async function getValidGoogleAccessToken(): Promise<{ token: string; email: string | null } | null> {
  if (!mapsGoogleOAuthConfigured()) return null;

  const row = await prisma.mapOAuthConnection.findUnique({ where: { provider: PROVIDER } });
  if (!row?.refreshTokenEnc) return null;

  const refresh = decryptMapsSecret(row.refreshTokenEnc);
  const clientId = process.env.MAPS_GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.MAPS_GOOGLE_CLIENT_SECRET!.trim();
  const redirectUri = getMapsGoogleRedirectUri();

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refresh });

  const { token } = await oauth2.getAccessToken();
  const access = token || oauth2.credentials.access_token;
  if (!access) return null;

  const expiry = oauth2.credentials.expiry_date
    ? new Date(oauth2.credentials.expiry_date)
    : null;

  await prisma.mapOAuthConnection.update({
    where: { provider: PROVIDER },
    data: {
      accessToken: access,
      accessExpiresAt: expiry,
    },
  });

  return { token: access, email: row.accountEmail };
}

function locationPathForReviews(locationResourceName: string): string | null {
  const m = locationResourceName.match(/^accounts\/([^/]+)\/locations\/([^/]+)$/);
  if (!m) return null;
  return `accounts/${m[1]}/locations/${m[2]}`;
}

export type GoogleSyncResult = {
  ok: boolean;
  status: 'success' | 'partial' | 'error';
  message: string;
  stats: Json;
};

export async function runGoogleMapsSync(source: 'manual' | 'cron'): Promise<GoogleSyncResult> {
  const started = new Date();
  const stats: Json = {
    accounts: 0,
    locations: 0,
    reviews: 0,
    reviewErrors: [] as string[],
  };

  const logRun = async (status: string, message: string) => {
    await prisma.mapSyncRun.create({
      data: {
        provider: PROVIDER,
        source,
        status,
        message,
        stats: stats as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
  };

  try {
    const auth = await getValidGoogleAccessToken();
    if (!auth) {
      await logRun('error', 'Google bağlantısı veya access token yok.');
      return {
        ok: false,
        status: 'error',
        message: 'Google OAuth bağlantısı yok veya token alınamadı.',
        stats,
      };
    }

    const { token } = auth;

    const accRes = await apiGet(
      token,
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=50'
    );
    if (!accRes.ok) {
      const msg = `Hesap listesi alınamadı (${accRes.status})`;
      await logRun('error', msg);
      return { ok: false, status: 'error', message: msg, stats };
    }

    const accData = accRes.data as { accounts?: Array<{ name?: string }> };
    const accounts = accData.accounts || [];
    stats.accounts = accounts.length;

    const conn = await prisma.mapOAuthConnection.findUnique({ where: { provider: PROVIDER } });
    let accountName = accounts[0]?.name;
    const prefAcc = conn?.preferredAccountName;
    if (prefAcc && accounts.some((a) => a.name === prefAcc)) {
      accountName = prefAcc;
    }

    if (!accountName) {
      const msg = 'Google hesabında işletme hesabı bulunamadı.';
      await logRun('error', msg);
      return { ok: false, status: 'error', message: msg, stats };
    }

    const locUrl = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`
    );
    locUrl.searchParams.set('pageSize', '100');
    locUrl.searchParams.set(
      'readMask',
      'name,title,websiteUri,phoneNumbers,storefrontAddress,categories,profile,metadata'
    );

    const locRes = await apiGet(token, locUrl.toString());
    if (!locRes.ok) {
      const msg = `Konum listesi alınamadı (${locRes.status})`;
      await logRun('partial', msg);
      return { ok: false, status: 'partial', message: msg, stats };
    }

    const locData = locRes.data as { locations?: Array<{ name?: string; title?: string }> };
    const locations = locData.locations || [];
    stats.locations = locations.length;

    for (const loc of locations) {
      if (!loc.name) continue;
      await prisma.mapLocationSnapshot.upsert({
        where: { provider_resourceName: { provider: PROVIDER, resourceName: loc.name } },
        create: {
          provider: PROVIDER,
          resourceName: loc.name,
          title: loc.title ?? null,
          payload: loc as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: loc.title ?? null,
          payload: loc as unknown as Prisma.InputJsonValue,
          fetchedAt: new Date(),
        },
      });
    }

    const conn2 = await prisma.mapOAuthConnection.findUnique({ where: { provider: PROVIDER } });
    let locationName = locations[0]?.name;
    const prefLoc = conn2?.preferredLocationName;
    if (prefLoc && locations.some((l) => l.name === prefLoc)) {
      locationName = prefLoc;
    }

    if (!locationName) {
      await prisma.mapPlatformListing.update({
        where: { platform: PROVIDER },
        data: { connectionStatus: 'connected', lastManualSyncAt: new Date() },
      });
      await logRun('success', 'Konumlar senkronlandı; yorum API’si için konum seçin.');
      return {
        ok: true,
        status: 'success',
        message: 'Konumlar güncellendi. Yorumlar için tercih edilen konum seçebilirsiniz.',
        stats,
      };
    }

    const reviewBase = locationPathForReviews(locationName);
    if (!reviewBase) {
      await logRun('partial', 'Konum adı ayrıştırılamadı.');
      return { ok: true, status: 'partial', message: 'Konum kaydı güncellendi.', stats };
    }

    let pageToken: string | undefined;
    let reviewCount = 0;
    do {
      const ru = new URL(`https://mybusiness.googleapis.com/v4/${reviewBase}/reviews`);
      ru.searchParams.set('pageSize', '50');
      if (pageToken) ru.searchParams.set('pageToken', pageToken);

      const revRes = await apiGet(token, ru.toString());
      if (!revRes.ok) {
        (stats.reviewErrors as string[]).push(`Yorumlar ${revRes.status}: ${JSON.stringify(revRes.data).slice(0, 200)}`);
        break;
      }

      const revData = revRes.data as {
        reviews?: Array<{
          name?: string;
          reviewer?: { displayName?: string };
          starRating?: unknown;
          comment?: string;
          reviewReply?: { comment?: string };
          createTime?: string;
        }>;
        nextPageToken?: string;
      };

      const reviews = revData.reviews || [];
      for (const r of reviews) {
        if (!r.name) continue;
        await prisma.mapReviewSnapshot.upsert({
          where: { reviewName: r.name },
          create: {
            provider: PROVIDER,
            reviewName: r.name,
            locationResourceName: locationName!,
            reviewerDisplayName: r.reviewer?.displayName ?? null,
            starRating: starRatingToInt(r.starRating),
            comment: r.comment ?? null,
            replyComment: r.reviewReply?.comment ?? null,
            reviewTime: r.createTime ?? null,
            payload: r as unknown as Prisma.InputJsonValue,
          },
          update: {
            reviewerDisplayName: r.reviewer?.displayName ?? null,
            starRating: starRatingToInt(r.starRating),
            comment: r.comment ?? null,
            replyComment: r.reviewReply?.comment ?? null,
            reviewTime: r.createTime ?? null,
            payload: r as unknown as Prisma.InputJsonValue,
            fetchedAt: new Date(),
          },
        });
        reviewCount++;
      }
      pageToken = revData.nextPageToken;
    } while (pageToken);

    stats.reviews = reviewCount;

    await prisma.mapPlatformListing.update({
      where: { platform: PROVIDER },
      data: { connectionStatus: 'connected', lastManualSyncAt: new Date() },
    });

    const hasRevErrors = (stats.reviewErrors as string[]).length > 0;
    const status = hasRevErrors ? 'partial' : 'success';
    const message = hasRevErrors
      ? 'Konumlar ve kısmen yorumlar güncellendi; bazı yorum istekleri başarısız olabilir (API / yetki).'
      : 'Konumlar ve yorumlar güncellendi.';

    await logRun(status, message);

    return {
      ok: true,
      status: hasRevErrors ? 'partial' : 'success',
      message,
      stats,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
    stats.error = message;
    await prisma.mapSyncRun.create({
      data: {
        provider: PROVIDER,
        source,
        status: 'error',
        message,
        stats: stats as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
    return { ok: false, status: 'error', message, stats };
  }
}

/** OAuth callback sonrası token kaydı */
export async function saveGoogleOAuthTokens(params: {
  refreshToken: string;
  accessToken?: string | null;
  expiryDate?: number | null;
  email?: string | null;
}): Promise<void> {
  const enc = encryptMapsSecret(params.refreshToken);
  await prisma.mapOAuthConnection.upsert({
    where: { provider: PROVIDER },
    create: {
      provider: PROVIDER,
      refreshTokenEnc: enc,
      accessToken: params.accessToken ?? null,
      accessExpiresAt: params.expiryDate ? new Date(params.expiryDate) : null,
      accountEmail: params.email ?? null,
    },
    update: {
      refreshTokenEnc: enc,
      accessToken: params.accessToken ?? null,
      accessExpiresAt: params.expiryDate ? new Date(params.expiryDate) : null,
      accountEmail: params.email ?? null,
    },
  });

  await prisma.mapPlatformListing.update({
    where: { platform: PROVIDER },
    data: { connectionStatus: 'connected' },
  });
}

export async function disconnectGoogleMaps(): Promise<void> {
  await prisma.mapOAuthConnection.deleteMany({ where: { provider: PROVIDER } });
  await prisma.mapLocationSnapshot.deleteMany({ where: { provider: PROVIDER } });
  await prisma.mapReviewSnapshot.deleteMany({ where: { provider: PROVIDER } });
  await prisma.mapReviewReplyDraft.deleteMany({ where: { provider: PROVIDER } });
  await prisma.mapPlatformListing.update({
    where: { platform: PROVIDER },
    data: { connectionStatus: 'not_connected' },
  });
}

export async function postGoogleReviewReply(accessToken: string, reviewName: string, comment: string) {
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 400) };
  }
  return { ok: res.ok, status: res.status, data };
}
