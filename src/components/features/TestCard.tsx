import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatDifficulty } from '@/lib/utils';
import { Test } from '@/types';

interface TestCardProps {
  test: Test;
  onStart: (testId: string) => void;
}

export function TestCard({ test, onStart }: TestCardProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en';

  return (
    <Card>
      <CardHeader>
        <div className="relative h-48 w-full">
          <Image
            src={test.image}
            alt={test.title[currentLang]}
            fill
            className="object-cover rounded-t-lg"
          />
          {test.premium && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-sm">
              Premium
            </div>
          )}
        </div>
        <CardTitle>{test.title[currentLang]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 mb-4">{test.description[currentLang]}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDifficulty(test.difficulty)}</span>
          <span>•</span>
          <span>{formatDuration(test.duration)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onStart(test.id)}
          className="w-full"
        >
          {t('test.start')}
        </Button>
      </CardFooter>
    </Card>
  );
} 