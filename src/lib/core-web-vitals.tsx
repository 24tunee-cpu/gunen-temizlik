/**
 * Core Web Vitals Optimizasyon Sistemi
 * LCP, FID, CLS metriklerini iyileştiren komponentler ve yardımcı fonksiyonlar
 * Mevcut sistemi bozmadan yeni özellikler ekler
 */

'use client';

import React, { useEffect, useState } from 'react';

// Core Web Vitals metrikleri
interface WebVitalsMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

// Google Analytics'e metrik gönderme fonksiyonu (basitleştirilmiş)
function sendToAnalytics(metric: any) {
  // Sadece production'da gönder ve gtag kontrolü yapmadan
  if (process.env.NODE_ENV === 'production') {
    console.log('Web Vitals Metric:', metric.name, metric.value);
    // İleride gtag entegrasyonu eklenebilir
  }
}

// Largest Contentful Paint (LCP) optimizasyonu
export function useLCPOptimization() {
  useEffect(() => {
    // LCP için resim optimizasyonu
    const optimizeLCP = () => {
      // En büyük resmi öncelikle yükle
      const images = document.querySelectorAll('img') as any;
      let largestImage: any = null;
      let largestSize = 0;

      images.forEach((img: any) => {
        const size = img.naturalWidth * img.naturalHeight;
        if (size > largestSize) {
          largestSize = size;
          largestImage = img;
        }
      });

      if (largestImage && !largestImage.complete) {
        largestImage.loading = 'eager';
        largestImage.fetchPriority = 'high';
      }

      // Preload için link ekle
      if (largestImage && largestImage.src) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = largestImage.src;
        document.head.appendChild(preloadLink);
      }
    };

    // Sayfa yüklendiğinde çalıştır
    if (document.readyState === 'complete') {
      optimizeLCP();
    } else {
      window.addEventListener('load', optimizeLCP);
    }

    return () => {
      window.removeEventListener('load', optimizeLCP);
    };
  }, []);
}

// First Input Delay (FID) optimizasyonu
export function useFIDOptimization() {
  useEffect(() => {
    // Event listener'ları pasif hale getir
    const makeEventListenersPassive = () => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;

      EventTarget.prototype.addEventListener = function (
        type: string,
        listener: EventListener,
        options?: boolean | AddEventListenerOptions
      ) {
        const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];

        if (passiveEvents.includes(type) && typeof options === 'object') {
          options.passive = true;
        }

        return originalAddEventListener.call(this, type, listener, options);
      };
    };

    makeEventListenersPassive();
  }, []);
}

// Cumulative Layout Shift (CLS) optimizasyonu
export function useCLSOptimization() {
  useEffect(() => {
    // Dinamik içerik için alan ayır
    const reserveSpaceForDynamicContent = () => {
      // Video placeholder'ları için sabit boyut
      const videoPlaceholders = document.querySelectorAll('.video-section .aspect-video');
      videoPlaceholders.forEach(placeholder => {
        (placeholder as HTMLElement).style.minHeight = '300px';
      });

      // Before/After section'ları için sabit boyut
      const beforeAfterSections = document.querySelectorAll('.before-after-section .aspect-video');
      beforeAfterSections.forEach(section => {
        (section as HTMLElement).style.minHeight = '200px';
      });

      // FAQ section'ları için animasyon önleme
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        (item as HTMLElement).style.contain = 'layout';
      });
    };

    // İçerik yüklendiğinde çalıştır
    const observer = new MutationObserver(() => {
      reserveSpaceForDynamicContent();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    reserveSpaceForDynamicContent();

    return () => {
      observer.disconnect();
    };
  }, []);
}

// Web Vitals monitoring hook'u
export function useWebVitalsMonitoring() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  useEffect(() => {
    // Web Vitals library'siz basit metrik ölçümü
    const measureWebVitals = () => {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        sendToAnalytics({ name: 'LCP', value: lastEntry.startTime, id: 'lcp' });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
          sendToAnalytics({ name: 'FID', value: entry.processingStart - entry.startTime, id: 'fid' });
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
            sendToAnalytics({ name: 'CLS', value: clsValue, id: 'cls' });
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP (First Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        sendToAnalytics({ name: 'FCP', value: fcpEntry.startTime, id: 'fcp' });
      }).observe({ entryTypes: ['paint'] });

      // TTFB (Time to First Byte)
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
        sendToAnalytics({ name: 'TTFB', value: ttfb, id: 'ttfb' });
      }
    };

    measureWebVitals();
  }, []);

  return metrics;
}

// Optimizasyon komponenti
export function CoreWebVitalsOptimizer() {
  const metrics = useWebVitalsMonitoring();

  useLCPOptimization();
  useFIDOptimization();
  useCLSOptimization();

  // Development'da metrikleri göster
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Core Web Vitals Metrics:', metrics);

      // Hatalı metrikleri uyar
      if (metrics.lcp && metrics.lcp > 2500) {
        console.warn('⚠️ LCP > 2.5s:', metrics.lcp);
      }
      if (metrics.fid && metrics.fid > 100) {
        console.warn('⚠️ FID > 100ms:', metrics.fid);
      }
      if (metrics.cls && metrics.cls > 0.1) {
        console.warn('⚠️ CLS > 0.1:', metrics.cls);
      }
    }
  }, [metrics]);

  // Production'da hiçbir şey render etme
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">📊 Web Vitals</h3>
      <div className="space-y-1">
        <div>LCP: {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '...'}</div>
        <div>FID: {metrics.fid ? `${Math.round(metrics.fid)}ms` : '...'}</div>
        <div>CLS: {metrics.cls !== null ? metrics.cls.toFixed(3) : '...'}</div>
        <div>FCP: {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '...'}</div>
        <div>TTFB: {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : '...'}</div>
      </div>
    </div>
  );
}

// Resim optimizasyon yardımcı fonksiyonu
export function optimizeImageProps(src: string, alt: string, priority: boolean = false) {
  return {
    src,
    alt,
    loading: priority ? 'eager' : 'lazy' as const,
    fetchPriority: priority ? 'high' : 'auto' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality: 85,
    placeholder: 'blur' as const,
    blurDataURL: `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1e293b"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#64748b" font-size="14">
          Loading...
        </text>
      </svg>`
    ).toString('base64')}`,
  };
}

// Font optimizasyon yardımcı fonksiyonu
export function optimizeFontLoading() {
  if (typeof window !== 'undefined') {
    // Font display swap
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('/fonts/inter.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);

    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }
}

// Critical CSS inline etme yardımcısı
export function getCriticalCSS() {
  return `
    /* Critical CSS for above-the-fold content */
    body { margin: 0; font-family: Inter, system-ui, sans-serif; }
    .bg-slate-900 { background-color: #0f172a; }
    .text-white { color: #ffffff; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .min-h-screen { min-height: 100vh; }
  `;
}

// Resource hints generator
export function generateResourceHints() {
  const hints = [
    // DNS prefetch for external domains
    '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
    '<link rel="dns-prefetch" href="//www.googletagmanager.com">',

    // Preconnect for critical domains
    '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>',
    '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>',

    // Preload critical resources
    '<link rel="preload" href="/logo.png" as="image">',
    '<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>',
  ];

  return hints.join('\n');
}
