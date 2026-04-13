/**
 * Haritalar modülü — sunucu tarafı seed + tüm export’lar.
 */

export * from './map-platforms-data';

import { prisma } from '@/lib/prisma';
import { MAP_PLATFORMS } from './map-platforms-data';

export async function ensureMapPlatformRows(): Promise<void> {
  for (const platform of MAP_PLATFORMS) {
    await prisma.mapPlatformListing.upsert({
      where: { platform },
      create: {
        platform,
        connectionStatus: 'not_connected',
      },
      update: {},
    });
  }
}
