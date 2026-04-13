/**
 * @fileoverview Site Layout
 * @description Site-wide layout bileşeni.
 * Navbar, Footer, FloatingWhatsApp ve skip-to-content link ile.
 * Tüm site sayfalarını saran ana layout.
 *
 * @architecture
 * - Client Component (Client-Side Rendering)
 * - Semantic HTML landmarks
 * - Skip link for accessibility
 * - Dark mode support
 *
 * @accessibility
 * - Skip to content link for keyboard navigation
 * - ARIA landmarks (banner, main, contentinfo)
 * - Semantic HTML5 elements
 */

'use client';

import { Navbar } from '@/components/site/Navbar';
import { Footer } from '@/components/site/Footer';
import { FloatingWhatsApp } from '@/components/site/FloatingWhatsApp';
import MobileCallBar from '@/components/site/MobileCallBar';

// ============================================
// TYPES
// ============================================

/** SiteLayout component props */
interface SiteLayoutProps {
  /** Sayfa içeriği */
  children: React.ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Site Layout Component
 * Tüm site sayfalarını saran layout.
 * Navbar, main content, footer ve floating action button ile.
 * 
 * @param children Page content
 */
export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-white transition-colors dark:bg-slate-900">
      {/* Skip to Content Link - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        İçeriğe atla
      </a>

      {/* Navigation */}
      <header role="banner">
        <Navbar />
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex min-h-0 min-w-0 flex-1 flex-col pb-20 lg:pb-0"
        role="main"
        aria-label="Sayfa içeriği"
      >
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo">
        <Footer />
      </footer>

      {/* Floating Action Button */}
      <FloatingWhatsApp />
      <MobileCallBar />
    </div>
  );
}
