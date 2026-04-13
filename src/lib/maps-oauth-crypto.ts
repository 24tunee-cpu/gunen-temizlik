/**
 * Haritalar OAuth token’ları için AES-256-GCM şifreleme.
 * MAPS_OAUTH_SECRET yoksa NEXTAUTH_SECRET kullanılır (üretimde MAPS_OAUTH_SECRET önerilir).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

function deriveKey(): Buffer {
  const secret =
    process.env.MAPS_OAUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'development-maps-oauth-key-change-me';
  return scryptSync(secret, 'gunen-maps-oauth-v1', 32);
}

export function encryptMapsSecret(plain: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptMapsSecret(encB64: string): string {
  const buf = Buffer.from(encB64, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
