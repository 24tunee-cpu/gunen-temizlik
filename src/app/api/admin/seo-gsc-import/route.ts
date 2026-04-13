import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildMetaSuggestions, parseGscCsv } from '@/lib/gsc-meta';
import { requireAdminAuth } from '@/lib/security';

type ImportBody = {
  csv?: string;
  apply?: boolean;
  limit?: number;
};

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as ImportBody;
  const csv = body.csv?.trim();
  if (!csv) {
    return NextResponse.json({ error: 'CSV metni zorunlu.' }, { status: 400 });
  }

  const rows = parseGscCsv(csv);
  const suggestions = buildMetaSuggestions(rows);
  const limit = Math.min(200, Math.max(1, Number(body.limit || 80)));
  const limited = suggestions.slice(0, limit);

  if (body.apply) {
    await Promise.all(
      limited.map((s) =>
        prisma.programmaticMetaOverride.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            district: s.district,
            service: s.service,
            title: s.title,
            description: s.description,
            isActive: true,
          },
          update: {
            title: s.title,
            description: s.description,
            isActive: true,
          },
        })
      )
    );
  }

  return NextResponse.json({
    parsedRows: rows.length,
    suggestions: limited,
    applied: !!body.apply,
  });
}
