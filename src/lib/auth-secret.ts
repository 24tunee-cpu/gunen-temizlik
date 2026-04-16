const DEV_FALLBACK_SECRET = 'development-secret-do-not-use-in-production';

export function getNextAuthJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required in production');
  }
  return DEV_FALLBACK_SECRET;
}
