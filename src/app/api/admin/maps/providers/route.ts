import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/security';

/**
 * Yandex / Apple — resmi API entegrasyonu için yer tutucu (yol haritası).
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const p = request.nextUrl.searchParams.get('platform');
  if (p === 'yandex') {
    return NextResponse.json({
      platform: 'yandex',
      phase: 'planned',
      summary:
        'Yandex Sprav / işletme API’leri ayrı OAuth ve doğrulama gerektirir. Bu sürümde manuel checklist ve bağlantılar Haritalar sayfasında tutulur.',
      docUrl: 'https://yandex.com/support/sprav/',
    });
  }
  if (p === 'apple') {
    return NextResponse.json({
      platform: 'apple',
      phase: 'planned',
      summary:
        'Apple Business Connect çoğu işletmede ayrı onboarding ve API erişimi ile gelir. Otomatik senkron için Apple’ın güncel Business Connect API dokümantasyonu takip edilecek.',
      docUrl: 'https://businessconnect.apple.com/',
    });
  }

  return NextResponse.json({
    platforms: [
      { id: 'yandex', phase: 'planned' },
      { id: 'apple', phase: 'planned' },
    ],
  });
}
