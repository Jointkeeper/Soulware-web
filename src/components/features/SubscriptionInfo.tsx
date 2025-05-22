import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SUBSCRIPTION_TIERS, type Subscription } from '@/types/subscription';

interface SubscriptionInfoProps {
  subscription: Subscription;
  onUpgrade?: () => void;
}

export function SubscriptionInfo({ subscription, onUpgrade }: SubscriptionInfoProps) {
  const { t } = useTranslation();
  const features = SUBSCRIPTION_TIERS[subscription.tier];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t(`subscription.tier.${subscription.tier}`)}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {t('subscription.validUntil', {
            date: formatDate(new Date(subscription.validUntil)),
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t('subscription.features')}</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="flex-1">
                  {t('subscription.aiTests')}
                </span>
                <span className="font-medium">
                  {features.aiTestsPerDay === -1
                    ? t('subscription.unlimited')
                    : t('subscription.testsPerDay', {
                        count: features.aiTestsPerDay,
                      })}
                </span>
              </li>
              <li className="flex items-center">
                <span className="flex-1">
                  {t('subscription.staticTests')}
                </span>
                <span className="font-medium">
                  {t(`subscription.access.${features.staticTestsAccess}`)}
                </span>
              </li>
              <li className="flex items-center">
                <span className="flex-1">
                  {t('subscription.analytics')}
                </span>
                <span className="font-medium">
                  {t(`subscription.analytics.${features.analytics}`)}
                </span>
              </li>
              {features.advertising && (
                <li className="flex items-center text-gray-500">
                  {t('subscription.advertising')}
                </li>
              )}
              <li className="flex items-center">
                <span className="flex-1">
                  {t('subscription.support')}
                </span>
                <span className="font-medium">
                  {t(`subscription.support.${features.support}`)}
                </span>
              </li>
              {features.apiAccess && (
                <li className="flex items-center text-green-600">
                  {t('subscription.apiAccess')}
                </li>
              )}
              {features.customBranding && (
                <li className="flex items-center text-green-600">
                  {t('subscription.customBranding')}
                </li>
              )}
              {features.dataExport && (
                <li className="flex items-center text-green-600">
                  {t('subscription.dataExport')}
                </li>
              )}
            </ul>
          </div>

          {subscription.tier !== 'professional' && onUpgrade && (
            <Button
              onClick={onUpgrade}
              className="w-full"
            >
              {t('subscription.upgrade')}
            </Button>
          )}

          {subscription.tier === 'free' && (
            <p className="text-sm text-gray-500">
              {t('subscription.upgradeInfo')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 