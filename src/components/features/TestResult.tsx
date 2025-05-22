import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { TestResult, Test, StaticTestResult, AiTestResult } from '@/types';

interface TestResultProps {
  result: TestResult;
  test: Test;
}

function isStaticResult(result: TestResult): result is StaticTestResult {
  return 'scores' in result;
}

function isAiResult(result: TestResult): result is AiTestResult {
  return 'aiAnalysis' in result;
}

export function TestResult({ result, test }: TestResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{test.title.ru}</CardTitle>
        <p className="text-sm text-gray-500">
          {formatDate(new Date(result.completedAt))}
        </p>
      </CardHeader>
      <CardContent>
        {isStaticResult(result) && (
          <div className="space-y-2">
            {Object.entries(result.scores).map(([scale, score]) => (
              <div key={scale} className="flex items-center">
                <span className="flex-1">{scale}</span>
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </div>
        )}
        
        {isAiResult(result) && (
          <div className="space-y-4">
            <p className="text-gray-700">
              {result.aiAnalysis.text}
            </p>
            {result.aiAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Рекомендации</h4>
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