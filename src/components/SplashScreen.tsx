import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [showLogo, setShowLogo] = useState(true);
  const [showSlogan, setShowSlogan] = useState(false);

  useEffect(() => {
    // Показываем логотип 3 секунды
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
      setShowSlogan(true);
      
      // Показываем слоган 3 секунды
      const sloganTimer = setTimeout(() => {
        setShowSlogan(false);
        onFinished();
      }, 3000);

      return () => clearTimeout(sloganTimer);
    }, 3000);

    return () => clearTimeout(logoTimer);
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