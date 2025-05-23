import { useTranslation } from 'next-i18next';
import { useQuery } from 'react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TestResult as ImportedTestResult } from '@/types/test';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';

// Определим более точный тип для результата запроса
interface FetchedTestResult extends ImportedTestResult {
  test: {
    title: { ru: string; en?: string }; // en может быть опциональным
    type: 'static' | 'ai';
    description: { ru: string; en?: string }; // en может быть опциональным
  };
}

interface TestHistoryProps {
  userId: string;
}

export function TestHistory({ userId }: TestHistoryProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as keyof FetchedTestResult['test']['title'];

  const { data: testResults, isLoading } = useQuery(
    ['testResults', userId],
    async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          id,
          user_id,
          test_id,
          created_at,
          scores,
          ai_analysis,
          answers,
          test:tests (
            title,
            type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching test results:', error);
        }
        throw error;
      }
      // TODO: Рассмотреть использование Zod или другой библиотеки для валидации данных API
      // Теперь нужно убедиться, что имена полей совпадают с FetchedTestResult или смапить их
      return (data as any[]).map(item => ({
        ...item, // Берем все поля как есть
        userId: item.user_id,
        testId: item.test_id,
        createdAt: item.created_at,
        aiAnalysis: item.ai_analysis
        // поле test уже должно быть в правильном формате
        // поле scores уже должно быть в правильном формате
        // поле answers уже должно быть в правильном формате
      })) as FetchedTestResult[];
    },
    {
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch test results (react-query onError):', error);
        }
      }
    }
  );

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
                {result.test.title[currentLang] ?? result.test.title.ru}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {formatDateTime(new Date(result.createdAt), i18n.language)}
              </p>
            </CardHeader>
            <CardContent>
              {result.test.type === 'static' && result.scores && typeof result.scores === 'object' && (
                <div className="space-y-2">
                  {Object.keys(result.scores).length > 0 ? (
                    Object.entries(result.scores).map(([scale, score]) => (
                      <div key={scale} className="flex items-center">
                        <span className="flex-1">{scale}</span>
                        <span className="font-medium">{score as number}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t('testHistory.noScores')}</p>
                  )}
                </div>
              )}
              
              {result.test.type === 'ai' && result.aiAnalysis && (
                <div className="space-y-4">
                  {result.aiAnalysis.text ? (
                    <p className="text-gray-700">
                      {result.aiAnalysis.text}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">{t('testHistory.noAiText')}</p>
                  )}
                  {result.aiAnalysis.recommendations && result.aiAnalysis.recommendations.length > 0 && (
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