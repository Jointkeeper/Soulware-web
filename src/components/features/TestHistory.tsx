import { useTranslation } from 'next-i18next';
import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TestResult } from '@/types/test';
import Image from 'next/image';

interface TestHistoryProps {
  userId: string;
}

export function TestHistory({ userId }: TestHistoryProps) {
  const { t } = useTranslation();

  const { data: testResults, isLoading } = useQuery(
    ['testResults', userId],
    async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          test:tests(
            title,
            type,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (TestResult & {
        test: {
          title: { ru: string; en: string };
          type: 'static' | 'ai';
          description: { ru: string; en: string };
        };
      })[];
    }
  );

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ru', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!testResults?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          {t('testHistory.empty')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative w-24 h-24">
          {testResults[0]?.aiAnalysis?.imageUrl ? (
            <Image
              src={testResults[0].aiAnalysis.imageUrl}
              alt={t('testHistory.personalityAvatar')}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">
            {t('testHistory.personalityProfile')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('testHistory.testsCompleted', {
              count: testResults.length,
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {testResults.map((result) => (
          <Card key={result.id}>
            <CardHeader>
              <CardTitle>
                {result.test.title.ru}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {formatDate(result.createdAt.toString())}
              </p>
            </CardHeader>
            <CardContent>
              {result.test.type === 'static' && result.scores && (
                <div className="space-y-2">
                  {Object.entries(result.scores).map(([scale, score]) => (
                    <div key={scale} className="flex items-center">
                      <span className="flex-1">{scale}</span>
                      <span className="font-medium">{score}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {result.test.type === 'ai' && result.aiAnalysis && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {result.aiAnalysis.text}
                  </p>
                  {result.aiAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">
                        {t('testHistory.recommendations')}
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.aiAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-gray-700">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 