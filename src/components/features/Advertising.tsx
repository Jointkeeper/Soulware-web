import { useEffect } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { logger } from '@/lib/logger';

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
  const { t } = useTranslation('common');
  useEffect(() => {
    if (type === 'google' && slot && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        logger.error('Error loading Google Ads', error, { slot });
      }
    }
  }, [type, slot]);

  if (type === 'google' && slot) {
    const adClientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID;
    if (!adClientId) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Google Ads Client ID (NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID) is not set. Google Ad will not be displayed.');
      }
      return null;
    }

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
          data-ad-client={adClientId}
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
            if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
              window.gtag('event', 'partner_ad_click', {
                partner_id: partnerData.id,
                ad_title: partnerData.title,
              });
            }
          } catch (error) {
            logger.error('Error tracking partner ad click', error, { partnerId: partnerData.id });
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
            onError={() => {
              if (process.env.NODE_ENV === 'development') {
                logger.warn(`Failed to load partner ad image: ${partnerData.imageUrl}`, { partnerId: partnerData.id });
              }
            }}
          />
          <div className="absolute top-2 right-2 text-xs bg-gray-900/75 text-white px-2 py-1 rounded">
            {t('ads.partnerMaterial')}
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