/**
 * @fileoverview Next.js Configuration
 * @description Next.js 15+ configuration with security headers,
 * image optimization, webpack optimizations, and experimental features.
 *
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */

import type { NextConfig } from "next";
// import withBundleAnalyzer from '@next/bundle-analyzer'; // DISABLED for production build

// ============================================
// SECURITY CONFIGURATION
// ============================================

/** Content Security Policy (CSP) */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://apiv4.dextergpt.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob: https://gunentemizlik.com https://*.gunentemizlik.com https://images.unsplash.com;
  media-src 'self';
  connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com https://apiv4.dextergpt.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

// ============================================
// NEXT.JS CONFIG
// ============================================

const nextConfig: NextConfig = {
  // ============================================
  // OUTPUT CONFIG (For Static Export if needed)
  // ============================================
  // output: 'export', // Only for static hosting
  // distDir: 'dist',

  // ============================================
  // IMAGE OPTIMIZATION
  // ============================================
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gunentemizlik.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gunentemizlik.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      // Google Fonts için
      {
        protocol: 'https',
        hostname: 'fonts.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 31536000, // 1 yıl cache - Google botları için hız
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ============================================
  // COMPRESSION
  // ============================================
  compress: true,

  // ============================================
  // TRAILING SLASH
  // ============================================
  trailingSlash: false,

  // ============================================
  // SECURITY HEADERS
  // ============================================
  async headers() {
    const securityHeaders = [
      // CORS Headers (API routes)
      {
        key: 'Access-Control-Allow-Origin',
        value: process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gunentemizlik.com'
          : '*',
      },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization, X-CSRF-Token, X-API-Key, X-Correlation-ID',
      },
      {
        key: 'Access-Control-Max-Age',
        value: '86400',
      },
      // Security Headers
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      // CSP Header (en üstte olmalı)
      {
        key: 'Content-Security-Policy',
        value: cspHeader,
      },
    ];

    return [
      // API Routes
      {
        source: '/api/(.*)',
        headers: securityHeaders,
      },
      // Admin Routes (extra strict)
      {
        source: '/admin/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Static Assets (caching)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // All other routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ============================================
  // REDIRECTS
  // ============================================
  async redirects() {
    return [
      // www ↔ apex yönlendirmesini Vercel Domains üzerinden tek taraflı tutun.
      // Burada www → apex tanımlanırsa ve Vercel'de apex → www varsa ERR_TOO_MANY_REDIRECTS oluşur.
      // HTTP to HTTPS redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        permanent: true,
        destination: 'https://www.gunentemizlik.com/:path*',
      },
      // Legacy redirects (example)
      {
        source: '/hizmetlerimiz',
        destination: '/hizmetler',
        permanent: true,
      },
      // Old admin path redirect
      {
        source: '/admin-panel',
        destination: '/admin',
        permanent: true,
      },
      // Public fiyat listesi kaldırıldı; eski bağlantılar iletişime yönlendirilir
      {
        source: '/fiyatlar',
        destination: '/iletisim',
        permanent: true,
      },
    ];
  },

  // ============================================
  // REWRITES
  // ============================================
  async rewrites() {
    return [
      // API proxy (if needed for external APIs)
      // {
      //   source: '/api/external/:path*',
      //   destination: 'https://api.external-service.com/:path*',
      // },
    ];
  },

  // ============================================
  // WEBPACK CONFIGURATION
  // ============================================
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      // Split chunks more aggressively
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Handle SVG imports (if using @svgr/webpack)
    // config.module.rules.push({
    //   test: /\.svg$/,
    //   use: ['@svgr/webpack'],
    // });

    return config;
  },

  // ============================================
  // EXPERIMENTAL FEATURES
  // ============================================
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
    ],
    // Core Web Vitals optimizasyonu
    optimizeCss: true,
    // Bundle size optimizasyonu
    optimizeServerReact: true,
  },

  // ============================================
  // TURBOPACK CONFIG
  // ============================================
  turbopack: {},

  // ============================================
  // OTHER CONFIG
  // ============================================
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

// ============================================
export default nextConfig;
