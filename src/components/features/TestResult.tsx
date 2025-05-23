import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { TestResult, Test } from '@/types/test';
import { useTranslation } from 'next-i18next';

interface TestResultProps {
  result: TestResult;
  test: Test;
}

export function TestResult({ result, test }: TestResultProps) {
  const { i18n, t } = useTranslation('common');
  const currentLang = i18n.language as keyof typeof test.title;

  // Используем test.type как дискриминатор для определения типа результата
  const showStaticResult = test.type === 'static' && result.scores !== undefined;
  const showAiResult = test.type === 'ai' && result.aiAnalysis !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{test.title[currentLang] || test.title.ru}</CardTitle>
        <p className="text-sm text-gray-500">
          {formatDate(new Date(result.createdAt), i18n.language)}
        </p>
      </CardHeader>
      <CardContent>
        {showStaticResult && result.scores && (
          <div className="space-y-2">
            {Object.keys(result.scores).length > 0 ? (
              Object.entries(result.scores).map(([scale, score]) => (
                <div key={scale} className="flex items-center">
                  <span className="flex-1">{scale}</span>
                  <span className="font-medium">{score}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">{t('testResult.noScores')}</p>
            )}
          </div>
        )}
        
        {showAiResult && result.aiAnalysis && (
          <div className="space-y-4">
            {result.aiAnalysis.text ? (
              <p className="text-gray-700">
                {result.aiAnalysis.text}
              </p>
            ) : (
              <p className="text-sm text-gray-500">{t('testResult.noAiAnalysis')}</p>
            )}
            {result.aiAnalysis.recommendations && result.aiAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">{t('testResult.recommendations')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.aiAnalysis.recommendations.map((rec: string, index: number) => (
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
  );
} 