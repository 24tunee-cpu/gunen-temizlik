import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type AuditMetadata = Record<string, unknown>;

/**
 * Yönetici işlemlerini kalıcı kayıt (başarısız olsa bile ana işlemi bozmaz).
 */
export async function writeAuditLog(params: {
  userId?: string | null;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: AuditMetadata | null;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userEmail: params.userEmail,
        userId: params.userId ?? undefined,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? undefined,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: params.ip ?? undefined,
      },
    });
  } catch (e) {
    console.error('[audit-log] write failed', e);
  }
}
