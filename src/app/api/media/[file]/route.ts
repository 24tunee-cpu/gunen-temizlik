import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { requireAdminAuth } from '@/lib/security';
import {
  UPLOADS_DIR,
  buildUploadUsageMap,
  isSafeUploadBasename,
} from '@/lib/media-inventory';

type RouteParams = { params: Promise<{ file: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const { file: rawParam } = await params;
  const decoded = decodeURIComponent(rawParam || '');

  if (!isSafeUploadBasename(decoded)) {
    return NextResponse.json({ error: 'Geçersiz dosya adı.' }, { status: 400 });
  }

  const force =
    request.nextUrl.searchParams.get('force') === '1' ||
    request.nextUrl.searchParams.get('force') === 'true';

  try {
    const map = await buildUploadUsageMap();
    const usages = map.get(decoded) ?? [];
    if (usages.length > 0 && !force) {
      return NextResponse.json(
        {
          error:
            'Bu dosya sitede kullanılıyor. Önce ilgili kayıttan kaldırın veya zorla silmek için ?force=true kullanın.',
          usages,
        },
        { status: 409 }
      );
    }

    const fullPath = path.join(UPLOADS_DIR, decoded);
    await unlink(fullPath);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 404 });
    }
    console.error('DELETE /api/media/[file]', e);
    return NextResponse.json({ error: 'Dosya silinemedi.' }, { status: 500 });
  }
}
