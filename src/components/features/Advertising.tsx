import { useEffect } from 'react';
import Script from 'next/script';
import Image from 'next/image';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdvertisingProps {
  type: 'google' | 'partner';
  slot?: string;
  partnerData?: {
    id: string;
    imageUrl: string;
    link: string;
    title: string;
    description: string;
  };
}

export function Advertising({ type, slot, partnerData }: AdvertisingProps) {
  useEffect(() => {
    if (type === 'google' && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.error('Error loading Google Ads:', error);
      }
    }
  }, [type]);

  if (type === 'google' && slot) {
    return (
      <>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </>
    );
  }

  if (type === 'partner' && partnerData) {
    return (
      <a
        href={partnerData.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
        onClick={() => {
          // Track partner ad click
          try {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'partner_ad_click', {
                partner_id: partnerData.id,
                ad_title: partnerData.title,
              });
            }
          } catch (error) {
            console.error('Error tracking ad click:', error);
          }
        }}
      >
        <div className="relative aspect-video">
          <Image
            src={partnerData.imageUrl}
            alt={partnerData.title}
            fill
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
          <div className="absolute top-2 right-2 text-xs bg-gray-900/75 text-white px-2 py-1 rounded">
            Партнерский материал
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium mb-2">{partnerData.title}</h3>
          <p className="text-sm text-gray-600">{partnerData.description}</p>
        </div>
      </a>
    );
  }

  return null;
} 