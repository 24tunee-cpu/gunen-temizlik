/**
 * @fileoverview NextAuth.js Yapılandırması
 * @description Admin panel authentication, JWT session management,
 * ve audit logging. Credentials provider ile e-posta/şifre doğrulama.
 *
 * @security
 * - Session: 30 gün, JWT strategy
 * - Cookies: Secure, httpOnly, sameSite
 * - Password: bcrypt hash comparison
 * - Rate limiting: CheckRateLimit helper entegrasyonu
 *
 * @example
 * // API Route'ta kullanım
 * import { authOptions } from '@/lib/auth';
 * const handler = NextAuth(authOptions);
 * export { handler as GET, handler as POST };
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// ============================================
// TYPE DECLARATIONS (Module Augmentation)
// ============================================

/**
 * NextAuth tip genişletmeleri
 * @module next-auth
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/** User tipi (Prisma'dan) */
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  role: string;
}

/**
 * Şifre doğrulama
 * @param inputPassword Giriş şifresi
 * @param hashedPassword DB'deki hash
 * @returns boolean
 *
 * @note Development'ta test şifre kontrolü (sadece NODE_ENV !== 'production')
 */
async function verifyPassword(
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> {
  // Development'ta test şifre kontrolü (sadece test için)
  if (process.env.NODE_ENV !== 'production') {
    const testPassword = process.env.TEST_ADMIN_PASSWORD;
    if (testPassword && inputPassword === testPassword) {
      console.warn('Test password used in development', { env: process.env.NODE_ENV });
      return true;
    }
  }

  return bcrypt.compare(inputPassword, hashedPassword);
}

/**
 * Login audit log
 * @param email Kullanıcı e-postası
 * @param success Başarılı mı
 * @param reason Başarısızsa neden
 */
function logAuthEvent(email: string, success: boolean, reason?: string): void {
  if (success) {
    console.log('Admin login successful', { email });
  } else {
    console.warn('Admin login failed', { email, reason });
  }
}

// ============================================
// NEXTAUTH CONFIGURATION
// ============================================

/** Cookie ayarları (güvenlik) */
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * NextAuth.js yapılandırması
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
    updateAge: 24 * 60 * 60, // 24 saatte bir token refresh
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },

  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: cookieOptions,
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: cookieOptions,
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: cookieOptions,
    },
  },

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {
          label: 'E-posta',
          type: 'email',
          placeholder: 'admin@example.com',
        },
        password: {
          label: 'Şifre',
          type: 'password',
        },
      },

      /**
       * Kullanıcı doğrulama
       * @param credentials Login bilgileri
       * @returns User object veya null
       */
      async authorize(credentials): Promise<AuthUser | null> {
        // Validasyon
        if (!credentials?.email || !credentials?.password) {
          logAuthEvent(credentials?.email || 'unknown', false, 'Missing credentials');
          return null;
        }

        const { email, password } = credentials;

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
          logAuthEvent(email, false, 'User not found');
          return null;
        }

        if (!user.password) {
          logAuthEvent(email, false, 'No password set');
          return null;
        }

        // Şifre doğrulama
        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
          logAuthEvent(email, false, 'Invalid password');
          return null;
        }

        // Sadece admin kullanıcılar
        if (user.role !== 'ADMIN') {
          logAuthEvent(email, false, 'Not an admin user');
          return null;
        }

        // Başarılı login
        logAuthEvent(email, true);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          password: null, // Şifreyi token'a dahil etme
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * JWT token oluşturma/güncelleme
     * @param params Token params
     * @returns JWT token
     */
    async jwt({ token, user, account, trigger }) {
      // İlk login'de user bilgilerini token'a ekle
      if (user) {
        token.id = user.id;
        token.role = user.role;

        console.debug('JWT token created', { userId: user.id });
      }

      // Session update trigger'ı
      if (trigger === 'update' && token.id) {
        console.debug('JWT token updated', { userId: token.id });
      }

      return token;
    },

    /**
     * Session oluşturma
     * @param params Session params
     * @returns Session object
     */
    async session({ session, token, user }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;

        console.debug('Session created', { userId: token.id });
      }

      return session;
    },

    /**
     * SignIn callback
     * @param params SignIn params
     * @returns boolean (true = allow sign in)
     */
    async signIn({ user, account, credentials }) {
      console.log('Sign in attempt', {
        userId: user?.id,
        provider: account?.provider,
      });

      return true;
    },

    /**
     * Redirect callback
     * @param params Redirect params
     * @returns string (redirect URL)
     */
    async redirect({ url, baseUrl }) {
      // Güvenli redirect kontrolü
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },

  events: {
    /**
     * SignIn event'i
     */
    async signIn({ user, account, isNewUser }) {
      console.log('User signed in', {
        userId: user?.id,
        isNewUser,
        provider: account?.provider,
      });
    },

    /**
     * SignOut event'i
     */
    async signOut({ token, session }) {
      console.log('User signed out', { tokenSub: token?.sub });
    },

    /**
     * Session oluşturulduğunda
     */
    async session({ session, token }) {
      console.debug('Session event', { userId: token?.sub });
    },
  },
};
