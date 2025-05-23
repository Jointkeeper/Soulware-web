import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatDifficulty } from '@/lib/utils';
import { Test } from '@/types/test';

interface TestCardProps {
  test: Test;
  onStart: (testId: string) => void;
}

export function TestCard({ test, onStart }: TestCardProps) {
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language as keyof typeof test.title;

  const handleStartTest = () => {
    onStart(test.id);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        {test.image && (
          <div className="relative h-40 w-full mb-4">
            <Image
              src={test.image}
              alt={test.title[currentLang] || test.title.ru}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
        )}
        <CardTitle>{test.title[currentLang] || test.title.ru}</CardTitle>
        <p className="text-sm text-gray-500">
          {test.description[currentLang] || test.description.ru}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            {t('testCard.durationLabel')}: {formatDuration(test.duration, i18n.language)}
          </p>
          <p>
            {t('testCard.difficultyLabel')}: {formatDifficulty(test.difficulty, i18n.language)}
          </p>
          <p>
            {t('testCard.accessLabel')}: {test.requiredTier !== 'free' ? t('testCard.premium') : t('testCard.free')}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleStartTest} className="w-full">
          {t('testCard.startTestButton')}
        </Button>
      </CardFooter>
    </Card>
  );
} 