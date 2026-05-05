/**
 * Mobile-First Optimizasyon Sistemi
 * Click-to-call, WhatsApp, mobil kullanıcı deneyimi iyileştirmeleri
 * Mevcut sistemi bozmadan yeni özellikler ekler
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, Clock, MapPin } from 'lucide-react';

// Mobil cihaz tespiti
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}

// Click-to-call komponenti
interface ClickToCallProps {
  phone: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function ClickToCall({ 
  phone, 
  className = '', 
  showIcon = true,
  variant = 'primary',
  size = 'md'
}: ClickToCallProps) {
  const { isMobile } = useMobileDetection();
  
  const handleClick = () => {
    if (isMobile) {
      window.location.href = `tel:${phone}`;
    } else {
      // Desktop'ta phone modal'ı göster
      alert(`Aramak için: ${phone}`);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200';
  const variantClasses = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={`Ara: ${phone}`}
    >
      {showIcon && <Phone size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="mr-2" />}
      {isMobile ? 'Hemen Ara' : phone}
    </button>
  );
}

// WhatsApp butonu komponenti
interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  position?: 'fixed' | 'inline';
}

export function WhatsAppButton({ 
  phone, 
  message = 'Merhaba, temizlik hizmeti hakkında bilgi almak istiyorum.',
  className = '',
  showIcon = true,
  variant = 'primary',
  size = 'md',
  position = 'inline'
}: WhatsAppButtonProps) {
  const { isMobile } = useMobileDetection();
  
  const handleClick = () => {
    const formattedPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/90${formattedPhone}?text=${encodedMessage}`;
    
    if (isMobile) {
      window.open(whatsappUrl, '_blank');
    } else {
      window.open(whatsappUrl, '_blank', 'width=600,height=600');
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200';
  const variantClasses = {
    primary: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    outline: 'border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 right-6 z-50 shadow-2xl' 
    : '';

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${positionClasses} ${className}`}
      aria-label="WhatsApp ile iletişime geç"
    >
      {showIcon && <MessageCircle size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="mr-2" />}
      {isMobile ? 'WhatsApp' : 'WhatsApp ile Yaz'}
    </button>
  );
}

// Mobil floating action bar
export function MobileFloatingActionBar({ phone }: { phone: string }) {
  const { isMobile } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  if (!isMobile || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 z-50">
      <div className="flex gap-3 max-w-md mx-auto">
        <ClickToCall 
          phone={phone} 
          variant="primary" 
          size="sm" 
          className="flex-1"
        />
        <WhatsAppButton 
          phone={phone} 
          variant="secondary" 
          size="sm" 
          className="flex-1"
        />
      </div>
    </div>
  );
}

// Mobil hızlı erişim kartları
interface MobileQuickActionsProps {
  phone: string;
  whatsappPhone: string;
  className?: string;
}

export function MobileQuickActions({ 
  phone, 
  whatsappPhone, 
  className = '' 
}: MobileQuickActionsProps) {
  const { isMobile } = useMobileDetection();

  if (!isMobile) return null;

  return (
    <div className={`bg-slate-800 rounded-xl p-4 ${className}`}>
      <h3 className="text-white font-semibold mb-3 flex items-center">
        <Clock size={20} className="mr-2" />
        Hızlı Erişim
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <ClickToCall 
          phone={phone} 
          variant="primary" 
          size="sm" 
          className="w-full"
        />
        <WhatsAppButton 
          phone={whatsappPhone} 
          variant="secondary" 
          size="sm" 
          className="w-full"
        />
      </div>
      <div className="mt-3 text-xs text-slate-400 text-center">
        7/24 Hızlı Destek
      </div>
    </div>
  );
}

// Mobil optimizasyonlu iletişim bilgileri
interface MobileContactCardProps {
  phone: string;
  whatsappPhone: string;
  address?: string;
  workingHours?: string;
  className?: string;
}

export function MobileContactCard({
  phone,
  whatsappPhone,
  address,
  workingHours = 'Pazartesi - Pazar: 08:00 - 22:00',
  className = ''
}: MobileContactCardProps) {
  const { isMobile } = useMobileDetection();

  return (
    <div className={`bg-slate-800 rounded-xl p-6 ${className}`}>
      <h3 className="text-white font-semibold text-lg mb-4">İletişim Bilgileri</h3>
      
      <div className="space-y-4">
        {/* Telefon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-slate-300">
            <Phone size={20} className="mr-3 text-emerald-400" />
            <span>{phone}</span>
          </div>
          <ClickToCall 
            phone={phone} 
            variant="outline" 
            size="sm"
          />
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-slate-300">
            <MessageCircle size={20} className="mr-3 text-green-400" />
            <span>WhatsApp Destek</span>
          </div>
          <WhatsAppButton 
            phone={whatsappPhone} 
            variant="outline" 
            size="sm"
          />
        </div>

        {/* Adres */}
        {address && (
          <div className="flex items-start text-slate-300">
            <MapPin size={20} className="mr-3 text-blue-400 mt-1 flex-shrink-0" />
            <span className="text-sm">{address}</span>
          </div>
        )}

        {/* Çalışma Saatleri */}
        <div className="flex items-center text-slate-300">
          <Clock size={20} className="mr-3 text-yellow-400" />
          <div>
            <div className="text-sm font-medium">Çalışma Saatleri</div>
            <div className="text-xs text-slate-400">{workingHours}</div>
          </div>
        </div>
      </div>

      {/* Mobil için hızlı butonlar */}
      {isMobile && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ClickToCall 
            phone={phone} 
            variant="primary" 
            size="sm" 
            className="w-full"
          />
          <WhatsAppButton 
            phone={whatsappPhone} 
            variant="secondary" 
            size="sm" 
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

// Mobil için sticky header iletişim butonları
interface MobileStickyHeaderProps {
  phone: string;
  whatsappPhone: string;
  showOnScroll?: boolean;
}

export function MobileStickyHeader({ 
  phone, 
  whatsappPhone, 
  showOnScroll = true 
}: MobileStickyHeaderProps) {
  const { isMobile } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(!showOnScroll);

  useEffect(() => {
    if (!isMobile || !showOnScroll) return;

    let lastScrollY = 0;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, showOnScroll]);

  if (!isMobile) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 z-40 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="flex items-center justify-between p-4">
        <div className="text-white font-semibold">Günen Temizlik</div>
        <div className="flex gap-2">
          <ClickToCall 
            phone={phone} 
            variant="secondary" 
            size="sm"
            className="px-3"
          />
          <WhatsAppButton 
            phone={whatsappPhone} 
            variant="secondary" 
            size="sm"
            className="px-3"
          />
        </div>
      </div>
    </div>
  );
}

// Mobil kullanıcı deneyimi hook'u
export function useMobileUX() {
  const { isMobile, isTablet } = useMobileDetection();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouchDevice,
    shouldShowMobileOptimizations: isMobile || isTouchDevice,
    shouldShowTabletOptimizations: isTablet
  };
}

// Mobil için responsive helper
export function getResponsiveValue<T>(mobile: T, tablet: T, desktop: T): T {
  const { isMobile, isTablet } = useMobileDetection();
  
  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
}
