import { SEO_CHECKLIST_SEED } from '@/config/seo-checklist';
import { prisma } from '@/lib/prisma';

export async function ensureSeoChecklistSeedRows() {
  for (const item of SEO_CHECKLIST_SEED) {
    await prisma.seoChecklistStatus.upsert({
      where: { key: item.key },
      create: {
        key: item.key,
        section: item.section,
        label: item.label,
        sortOrder: item.sortOrder,
      },
      update: {
        section: item.section,
        label: item.label,
        sortOrder: item.sortOrder,
      },
    });
  }
}

