/**
 * @fileoverview Prisma Client Yapılandırması ve Yardımcıları
 * @description Singleton Prisma client, soft delete middleware,
 * query logging, pagination helpers, ve transaction yönetimi.
 *
 * @example
 * // Basit kullanım
 * import { prisma } from '@/lib/prisma';
 * const user = await prisma.user.findFirst({ where: { id: 1 } });
 *
 * // Pagination ile
 * const { data, pagination } = await paginate(
 *   prisma.service.findMany,
 *   { where: { isActive: true } },
 *   { page: 1, limit: 10 }
 * );
 *
 * // Transaction
 * await transaction(async (tx) => {
 *   await tx.user.create({ data: { name: 'John' } });
 *   await tx.profile.create({ data: { userId: 1 } });
 * });
 */

import { PrismaClient, PrismaClientKnownRequestError } from '@prisma/client';
// import { createLogger } from './logger'; // DISABLED for production

const logger = createLogger('db/prisma');

// ============================================
// PRISMA CLIENT CONFIGURATION
// ============================================

/** PrismaClient singleton instance'ı */
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Prisma client oluştur veya mevcut instance'ı al
 * @note Development'ta hot reload koruması için global kullanılır
 */
function createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });

    return client;
}

/** Singleton Prisma client instance'ı */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Development'ta hot reload koruması
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;

// ============================================
// PRISMA ERROR HANDLING
// ============================================

/** Prisma hata kodları ve mesajları */
export const PrismaErrorCodes = {
    P2000: 'Input data is too long',
    P2001: 'Record does not exist',
    P2002: 'Unique constraint violation',
    P2003: 'Foreign key constraint failed',
    P2004: 'Constraint failed',
    P2005: 'Invalid value stored',
    P2006: 'Invalid data type',
    P2007: 'Data validation error',
    P2008: 'Failed to parse query',
    P2009: 'Failed to validate query',
    P2010: 'Raw query failed',
    P2011: 'Null constraint violation',
    P2012: 'Missing required value',
    P2013: 'Missing required argument',
    P2014: 'Relation violation',
    P2015: 'Related record not found',
    P2016: 'Query interpretation error',
    P2017: 'Records not connected',
    P2018: 'Required connected records not found',
    P2019: 'Input error',
    P2020: 'Value out of range',
    P2021: 'Table does not exist',
    P2022: 'Column does not exist',
    P2023: 'Inconsistent column data',
    P2024: 'Connection timed out',
    P2025: 'Record not found',
    P2026: 'Database query error',
    P2027: 'Multiple errors occurred',
    P2030: 'Cannot find fulltext index',
    P2031: 'Missing fulltext index',
    P2033: 'Number out of range',
    P2034: 'Transaction failed',
} as const;

export type PrismaErrorCode = keyof typeof PrismaErrorCodes;

/**
 * Prisma hatasını işle ve Türkçe mesaj döndür
 * @param error Prisma hata objesi
 * @returns İşlenmiş hata mesajı
 */
export function handlePrismaError(error: unknown): {
    code: string;
    message: string;
    field?: string;
    originalError: unknown;
} {
    if (error instanceof PrismaClientKnownRequestError) {
        const code = error.code as PrismaErrorCode;
        const defaultMessage = PrismaErrorCodes[code] || 'Database error';

        // Field extraction from meta
        const meta = error.meta as Record<string, unknown> | undefined;
        const field = meta?.target
            ? Array.isArray(meta.target)
                ? meta.target.join(', ')
                : String(meta.target)
            : undefined;

        // Türkçe mesajlar
        const turkishMessages: Record<string, string> = {
            P2002: 'Bu bilgi zaten kayıtlı. Lütfen farklı bir değer deneyin.',
            P2003: 'İlişkili kayıt bulunamadı.',
            P2025: 'Kayıt bulunamadı.',
            P2011: 'Zorunlu alan boş bırakılamaz.',
            P2012: 'Zorunlu bir değer eksik.',
        };

        return {
            code,
            message: turkishMessages[code] || defaultMessage,
            field,
            originalError: error,
        };
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return {
            code: 'VALIDATION_ERROR',
            message: 'Geçersiz veri formatı. Lütfen bilgilerinizi kontrol edin.',
            originalError: error,
        };
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return {
            code: 'INIT_ERROR',
            message: 'Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.',
            originalError: error,
        };
    }

    // Bilinmeyen hata
    return {
        code: 'UNKNOWN_ERROR',
        message: 'Beklenmeyen bir hata oluştu.',
        originalError: error,
    };
}

// ============================================
// PAGINATION HELPERS
// ============================================

/** Pagination parametreleri */
export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
}

/** Pagination sonuç arayüzü */
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * Prisma query'ini paginate et
 *
 * @example
 * const result = await paginate(
 *   (args) => prisma.service.findMany(args),
 *   { where: { isActive: true } },
 *   { page: 1, limit: 10, orderBy: 'createdAt', order: 'desc' }
 * );
 */
export async function paginate<T, A extends Record<string, unknown>>(
    queryFn: (args: A) => Promise<T[]>,
    queryArgs: Omit<A, 'skip' | 'take' | 'orderBy'>,
    params: PaginationParams,
    countFn?: (args: Omit<A, 'skip' | 'take' | 'orderBy'>) => Promise<number>
): Promise<PaginatedResult<T>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    // OrderBy oluştur
    const orderBy = params.orderBy
        ? { [params.orderBy]: params.order || 'desc' }
        : undefined;

    // Query'yi çalıştır
    const args = {
        ...queryArgs,
        skip,
        take: limit,
        ...(orderBy && { orderBy }),
    } as unknown as A;

    const data = await queryFn(args);

    // Toplam sayıyı al (countFn varsa)
    let total = data.length;
    if (countFn) {
        total = await countFn(queryArgs);
    }

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

/**
 * Cursor-based pagination (daha performanslı)
 *
 * @example
 * const result = await paginateCursor(
 *   (args) => prisma.service.findMany(args),
 *   { where: { isActive: true } },
 *   { cursor: lastId, limit: 10 }
 * );
 */
export async function paginateCursor<T, A extends Record<string, unknown>>(
    queryFn: (args: A) => Promise<T[]>,
    queryArgs: Omit<A, 'cursor' | 'take' | 'skip'>,
    params: {
        cursor?: string | number;
        limit?: number;
        orderBy?: string;
        order?: 'asc' | 'desc';
    }
): Promise<{
    data: T[];
    nextCursor: string | number | null;
    hasMore: boolean;
}> {
    const limit = Math.min(100, Math.max(1, params.limit || 10));

    const args = {
        ...queryArgs,
        take: limit + 1, // Bir fazla al (next cursor kontrolü için)
        ...(params.cursor && {
            cursor: { id: params.cursor },
            skip: 1, // Cursor'ı atla
        }),
        ...(params.orderBy && {
            orderBy: { [params.orderBy]: params.order || 'desc' },
        }),
    } as unknown as A;

    const data = await queryFn(args);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore && items.length > 0
        ? (items[items.length - 1] as { id: string | number }).id
        : null;

    return {
        data: items,
        nextCursor,
        hasMore,
    };
}

// ============================================
// TRANSACTION HELPERS
// ============================================

/**
 * Transaction wrapper - Hata durumunda rollback
 *
 * @example
 * await transaction(async (tx) => {
 *   const user = await tx.user.create({ data: { name: 'John' } });
 *   await tx.profile.create({ data: { userId: user.id } });
 * });
 */
export async function transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
        maxWait?: number;
        timeout?: number;
    }
): Promise<T> {
    return await prisma.$transaction(async (tx) => {
        return await fn(tx);
    }, options);
}

/**
 * Interactive transaction (manuel commit/rollback)
 * Gelişmiş transaction kontrolü için
 */
export async function interactiveTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
    return await prisma.$transaction(async (tx) => {
        try {
            const result = await fn(tx);
            return result;
        } catch (error) {
            // logger.error('Transaction failed', { error }); // DISABLED
            throw error;
        }
    });
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Veritabanı bağlantı sağlık kontrolü
 * @returns { healthy: boolean; latency: number }
 */
export async function checkDatabaseHealth(): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
}> {
    const start = Date.now();

    try {
        // Connection check
        await prisma.$connect();

        const latency = Date.now() - start;

        return {
            healthy: true,
            latency,
        };
    } catch (error) {
        const latency = Date.now() - start;

        // logger.error('Database health check failed', { error }); // DISABLED

        return {
            healthy: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Bağlantıyı kapat (cleanup için)
 * @note Test ve graceful shutdown için kullanılır
 */
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
    // logger.info('Prisma disconnected'); // DISABLED
}

// ============================================
// TYPE EXPORTS
// ============================================

/** Prisma tiplerini dışa aktar */
export type { Prisma } from '@prisma/client';

/** Model tipleri - Prisma schema'dan otomatik üretilir */
export type {
    User,
    Service,
    BlogPost,
    Certificate,
} from '@prisma/client';
