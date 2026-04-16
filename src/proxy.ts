import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSitemapPath = pathname === '/sitemap.xml' || pathname.endsWith('/sitemap.xml');
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/robots.txt' ||
    isSitemapPath
  ) {
    return NextResponse.next();
  }

  try {
    const url = new URL('/api/redirects/resolve', request.nextUrl.origin);
    url.searchParams.set('path', pathname);
    const res = await fetch(url.toString(), {
      headers: { 'x-middleware-fetch': '1' },
    });
    if (!res.ok) return NextResponse.next();
    const data = (await res.json()) as { redirect?: string | null; permanent?: boolean };
    if (!data.redirect || typeof data.redirect !== 'string') {
      return NextResponse.next();
    }
    const target = data.redirect.startsWith('http')
      ? data.redirect
      : new URL(data.redirect, request.nextUrl.origin).toString();
    return NextResponse.redirect(target, data.permanent ? 308 : 307);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|.*sitemap\\.xml$).*)'],
};
