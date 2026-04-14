import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) {
    return NextResponse.json({ blog: [], faq: [], services: [] });
  }
  const term = q.slice(0, 80);
  const contains = { contains: term, mode: 'insensitive' as const };

  const [blog, faq, services] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        published: true,
        OR: [{ title: contains }, { excerpt: contains }, { tags: { has: term } }],
      },
      take: 12,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, category: true },
    }),
    prisma.faq.findMany({
      where: { isActive: true, OR: [{ question: contains }, { answer: contains }] },
      take: 12,
      orderBy: { order: 'asc' },
      select: { id: true, question: true, category: true },
    }),
    prisma.service.findMany({
      where: { isActive: true, OR: [{ title: contains }, { shortDesc: contains }, { description: contains }] },
      take: 12,
      orderBy: { order: 'asc' },
      select: { id: true, title: true, slug: true, shortDesc: true },
    }),
  ]);

  return NextResponse.json({
    blog: blog.map((b) => ({ type: 'blog' as const, ...b, href: `/blog/${b.slug}` })),
    faq: faq.map((f) => ({ type: 'faq' as const, ...f, href: '/sss' })),
    services: services.map((s) => ({ type: 'service' as const, ...s, href: `/hizmetler/${s.slug}` })),
  });
}
