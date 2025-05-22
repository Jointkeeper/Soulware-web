import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase';
import { Advertising } from './Advertising';

interface PartnerAdsProps {
  placement: 'sidebar' | 'content' | 'footer';
  limit?: number;
}

export function PartnerAds({ placement, limit = 1 }: PartnerAdsProps) {
  const { data: ads, isLoading } = useQuery(
    ['partner-ads', placement],
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

      if (error) throw error;
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  );

  if (isLoading || !ads?.length) {
    return null;
  }

  return (
    <div className={`partner-ads partner-ads-${placement}`}>
      {ads.map((ad) => (
        <Advertising
          key={ad.id}
          type="partner"
          partnerData={{
            id: ad.id,
            imageUrl: ad.image_url,
            link: ad.link,
            title: ad.title.ru,
            description: ad.description.ru,
          }}
        />
      ))}
    </div>
  );
} 