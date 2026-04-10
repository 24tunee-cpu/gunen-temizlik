/**
 * @fileoverview Scroll Animation Hook
 * @description IntersectionObserver tabanlı scroll-triggered animation hook.
 * Geriye dönük uyumlu API, modern useRef desteği, ve gelişmiş options.
 *
 * @example
 * // Callback ref pattern (backward compatible)
 * const { ref, isVisible } = useScrollAnimation();
 * return <div ref={ref} className={isVisible ? 'animate-fade-in' : ''}>...</div>
 *
 * @example
 * // useRef pattern (modern)
 * const elementRef = useRef<HTMLDivElement>(null);
 * const isVisible = useScrollAnimation({ ref: elementRef, threshold: 0.2 });
 *
 * @example
 * // With callbacks
 * useScrollAnimation({
 *   onEnter: () => console.log('Entered viewport'),
 *   onExit: () => console.log('Left viewport'),
 *   triggerOnce: false,
 * });
 */

'use client';

import { useEffect, useState, useRef, RefObject, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

/** Hook options */
export interface UseScrollAnimationOptions {
  /** Intersection threshold (0-1) veya threshold array */
  threshold?: number | number[];
  /** Root margin (CSS margin gibi) - "100px 0px" görünmeden 100px önce tetikler */
  rootMargin?: string;
  /** Sadece bir kere mi tetiklenecek */
  triggerOnce?: boolean;
  /** Görünür olduğunda çağrılacak callback */
  onEnter?: () => void;
  /** Görünürlükten çıktığında çağrılacak callback */
  onExit?: () => void;
  /** Dışarıdan ref (useRef pattern) - verilmezse callback ref döner */
  ref?: RefObject<HTMLElement | null>;
  /** Debug modu */
  debug?: boolean;
}

/** Hook return type (callback ref pattern) */
export interface UseScrollAnimationReturn {
  /** Callback ref (elemente atanacak) */
  ref: (node: HTMLElement | null) => void;
  /** Element görünür mü */
  isVisible: boolean;
  /** Intersection ratio (0-1) */
  intersectionRatio: number;
}

/** Hook return type (useRef pattern) - boolean only */
export type UseScrollAnimationBoolean = boolean;

// ============================================
// FALLBACK DETECTION
// ============================================

/** IntersectionObserver desteği var mı */
const hasIntersectionObserver =
  typeof window !== 'undefined' && 'IntersectionObserver' in window;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Scroll animation hook - Callback ref pattern (backward compatible)
 * @param threshold Intersection threshold (0-1)
 * @returns { ref, isVisible, intersectionRatio }
 *
 * @deprecated Use object options signature for new code
 */
export function useScrollAnimation(threshold?: number): UseScrollAnimationReturn;

/**
 * Scroll animation hook - Options pattern (modern)
 * @param options Hook options
 * @returns boolean (eğer external ref verildiyse) veya UseScrollAnimationReturn
 */
export function useScrollAnimation(options: UseScrollAnimationOptions): UseScrollAnimationReturn | boolean;

export function useScrollAnimation(
  arg?: number | UseScrollAnimationOptions
): UseScrollAnimationReturn | boolean {
  // Parse arguments
  const isNumberArg = typeof arg === 'number';
  const options: UseScrollAnimationOptions = isNumberArg
    ? { threshold: arg }
    : arg || {};

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    onEnter,
    onExit,
    ref: externalRef,
    debug = false,
  } = options;

  // Internal ref state (callback ref pattern için)
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  // Internal ref (useRef pattern için)
  const internalRef = useRef<HTMLElement | null>(null);
  const hasTriggered = useRef(false);

  // Hangi ref kullanılacak
  const targetElement = externalRef?.current ?? element;

  // Callback ref (backward compatible)
  const setRef = useCallback((node: HTMLElement | null) => {
    setElement(node);
    internalRef.current = node;
  }, []);

  useEffect(() => {
    // SSR kontrolü
    if (typeof window === 'undefined') return;

    // Fallback: IntersectionObserver yoksa her zaman visible yap
    if (!hasIntersectionObserver) {
      if (debug) console.log('[useScrollAnimation] IntersectionObserver not supported, fallback to visible');
      setIsVisible(true);
      setIntersectionRatio(1);
      onEnter?.();
      return;
    }

    if (!targetElement) {
      if (debug) console.log('[useScrollAnimation] No target element yet');
      return;
    }

    // Zaten trigger edildiyse ve triggerOnce=true ise atla
    if (triggerOnce && hasTriggered.current) {
      if (debug) console.log('[useScrollAnimation] Already triggered, skipping');
      return;
    }

    if (debug) console.log('[useScrollAnimation] Creating observer for', targetElement);

    const observer = new IntersectionObserver(
      ([entry]) => {
        const { isIntersecting, intersectionRatio: ratio } = entry;

        if (debug) {
          console.log('[useScrollAnimation] Intersection change:', {
            isIntersecting,
            ratio,
            triggerOnce,
            hasTriggered: hasTriggered.current,
          });
        }

        setIntersectionRatio(ratio);

        if (isIntersecting) {
          setIsVisible(true);
          onEnter?.();

          if (triggerOnce) {
            hasTriggered.current = true;
            observer.disconnect();
            if (debug) console.log('[useScrollAnimation] Triggered once, disconnecting');
          }
        } else if (!triggerOnce) {
          // triggerOnce=false ise çıkışta da state güncelle
          setIsVisible(false);
          onExit?.();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(targetElement);

    return () => {
      if (debug) console.log('[useScrollAnimation] Cleanup observer');
      observer.disconnect();
    };
  }, [targetElement, threshold, rootMargin, triggerOnce, onEnter, onExit, debug]);

  // External ref verildiyse sadece boolean döndür (breaking change olmaması için)
  if (externalRef) {
    return isVisible;
  }

  // Callback ref pattern (backward compatible)
  return { ref: setRef, isVisible, intersectionRatio };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Basit scroll visibility hook - Sadece boolean döndürür
 * @param threshold Intersection threshold
 * @returns boolean
 */
export function useIsVisible(threshold: number = 0.1): boolean {
  const ref = useRef<HTMLElement>(null);
  return useScrollAnimation({ ref, threshold }) as boolean;
}

/**
 * Scroll progress hook - Elementin viewport'taki pozisyonuna göre 0-1 arası değer
 * @returns { ref, progress }
 */
export function useScrollProgress(): {
  ref: (node: HTMLElement | null) => void;
  progress: number;
} {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    // Bu fonksiyon scroll event listener'da kullanılabilir
    // Şimdilik placeholder
  }, []);

  // Callback ref pattern ile IntersectionObserver kullan
  const result = useScrollAnimation({
    threshold: Array.from({ length: 10 }, (_, i) => i / 10),
    triggerOnce: false,
  }) as UseScrollAnimationReturn;

  // intersectionRatio'yu progress olarak kullan
  return { ref: result.ref, progress: result.intersectionRatio };
}

export default useScrollAnimation;
