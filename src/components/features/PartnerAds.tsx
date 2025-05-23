import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase';
import { Advertising } from './Advertising';
import { useTranslation } from 'next-i18next';
import { logger } from '@/lib/logger';

interface PartnerAdsProps {
  placement: 'sidebar' | 'content' | 'footer';
  limit?: number;
}

export function PartnerAds({ placement, limit = 1 }: PartnerAdsProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en';

  const { data: ads, isLoading } = useQuery(
    ['partner-ads', placement, limit],
    async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('partner_ads')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('priority', { ascending: false })
        .limit(limit);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error fetching partner ads from Supabase', error, { placement, limit });
        }
        throw error;
      }
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      onError: (error: Error) => {
        logger.error('Failed to fetch partner ads (react-query onError)', error, { placement, limit });
      }
    }
  );

  if (isLoading) {
    return null;
  }

  if (!ads?.length) {
    return null;
  }

  return (
    <div className={`partner-ads partner-ads-${placement}`}>
      {ads
        .filter(ad => 
          ad.id && 
          ad.image_url && 
          ad.link && 
          ad.title && (ad.title[currentLang] || ad.title.ru) &&
          ad.description && (ad.description[currentLang] || ad.description.ru)
        )
        .map((ad) => (
          <Advertising
            key={ad.id}
            type="partner"
            partnerData={{
              id: ad.id,
              imageUrl: ad.image_url,
              link: ad.link,
              title: ad.title[currentLang] || ad.title.ru, 
              description: ad.description[currentLang] || ad.description.ru,
            }}
          />
        ))}
    </div>
  );
} 