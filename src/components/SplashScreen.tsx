import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const LOGO_DISPLAY_DURATION = 3000;
const SLOGAN_DISPLAY_DURATION = 3000;

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(true);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Показываем логотип
    const logoTimer = setTimeout(() => {
      if (isMounted) {
        setShowLogo(false);
        setShowSlogan(true);
      }
      
      // Показываем слоган
      const sloganTimer = setTimeout(() => {
        if (isMounted) {
          setShowSlogan(false);
          onFinished();
        }
      }, SLOGAN_DISPLAY_DURATION);

      return () => clearTimeout(sloganTimer);
    }, LOGO_DISPLAY_DURATION);

    return () => {
      isMounted = false;
      clearTimeout(logoTimer);
    };
  }, [onFinished]);

  if (!showLogo && !showSlogan) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50">
      {showLogo && (
        <div className="animate-fade-in">
          <Image
            src="/logo.png"
            alt="Soulware Logo"
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>
      )}
      
      {showSlogan && (
        <div className="text-center text-white text-2xl font-bold animate-fade-in">
          <p className="mb-2">Я кем-то был</p>
          <p className="mb-2">Я некто</p>
          <p>Я кем-то стану</p>
        </div>
      )}
    </div>
  );
} 