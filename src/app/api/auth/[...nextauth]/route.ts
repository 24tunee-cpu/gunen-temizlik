/**
 * @fileoverview NextAuth.js API Route Handler - FIXED for Next.js 15
 * @description Simplified NextAuth.js authentication endpoint.
 */

import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

// ============================================
// AUTH HANDLER - Next.js 15 Compatible
// ============================================

const handler = NextAuth(authOptions);

// Export handlers directly - no wrapper to avoid req.query issues
export { handler as GET, handler as POST };

// OPTIONS handler for CORS
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        },
    });
}
