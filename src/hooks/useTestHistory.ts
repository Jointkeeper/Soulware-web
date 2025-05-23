import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '@/lib/supabase';
import type { TestResult, LocalizedString as TestLocalizedString } from '@/types/test';
import { useToasts } from '@/context/ToastContext';
import { useTranslation } from 'next-i18next';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Zod schema for the raw data from Supabase test_results table
const SupabaseTestResultSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  test_id: z.string(),
  created_at: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date string" }),
  scores: z.record(z.number()).nullable().optional(), // Assuming scores are { [key: string]: number }
  ai_analysis: z.object({
    text: z.string().nullable().optional(),
    recommendations: z.array(z.string()).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
  }).nullable().optional(),
  answers: z.record(z.any()).nullable().optional(), // Kept as any for now, as per TODO in TestResult type
  // Optional test details, if joined
  test: z.object({
    title: z.object({ ru: z.string(), en: z.string() }), // Assuming LocalizedString structure
    type: z.enum(['static', 'ai'])
  }).nullable().optional(),
});

// Array schema for multiple results
const SupabaseTestResultsSchema = z.array(SupabaseTestResultSchema);

const GENERATE_AVATAR_API_URL = '/api/generate-avatar';

interface UseTestHistoryOptions {
  userId: string;
  includeTest?: boolean;
}

export function useTestHistory({ userId, includeTest = true }: UseTestHistoryOptions) {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();
  const { t } = useTranslation('common');

  const {
    data: testResults,
    isLoading,
    error,
  } = useQuery(
    ['testResults', userId, includeTest],
    async () => {
      let query = supabase
        .from('test_results')
        .select(`
          id,
          user_id,
          test_id,
          created_at,
          scores,
          ai_analysis,
          answers
          ${includeTest ? ', test:tests(title, type)' : ''}
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching test results from Supabase', error, { userId, includeTest });
        throw error;
      }

      // Validate data with Zod
      const validationResult = SupabaseTestResultsSchema.safeParse(data);
      if (!validationResult.success) {
        logger.error('Zod validation failed for Supabase test results', validationResult.error, { userId, includeTest, rawData: data });
        // Optionally, filter out invalid items or throw, depending on desired strictness
        // For now, let's throw to highlight issues during development
        throw new Error('Data validation failed for test results.'); 
      }
      
      // Use validated data for mapping
      return (validationResult.data as any[]).map(item => ({
        id: item.id,
        userId: item.user_id,
        testId: item.test_id,
        createdAt: new Date(item.created_at),
        aiAnalysis: item.ai_analysis,
        scores: item.scores,
        answers: item.answers,
        // Map test details if present
        test: item.test ? {
            title: item.test.title,
            type: item.test.type,
        } : undefined,
      })) as TestResult[];
    },
    {
      staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
      cacheTime: 15 * 60 * 1000, // Данные хранятся в кеше 15 минут после неактивности
    }
  );

  const generatePersonalityAvatar = useMutation(
    async () => {
      if (!testResults?.length) return null;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        logger.error('Error getting session or access token for avatar generation', sessionError, { userId });
        throw new Error('Failed to get authentication token for avatar generation.');
      }
      const token = session.access_token;

      // Analyze test results to determine personality traits
      const traits = testResults.reduce((acc, result) => {
        if (result.scores) {
          Object.entries(result.scores).forEach(([trait, score]) => {
            if (!acc[trait]) acc[trait] = [];
            acc[trait].push(score as number);
          });
        }
        return acc;
      }, {} as Record<string, number[]>);

      // Calculate average scores
      const averageTraits = Object.entries(traits).reduce((acc, [trait, scores]) => {
        acc[trait] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return acc;
      }, {} as Record<string, number>);

      // Generate image prompt based on traits
      const prompt = generateImagePrompt(averageTraits);

      // Call AI service to generate avatar
      const response = await fetch(GENERATE_AVATAR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          traits: averageTraits,
        }),
      });

      if (!response.ok) {
        let errorDetails = 'Failed to generate avatar';
        let errorForLogger: Error | any = new Error(errorDetails); // Default error
        const contextForLogger: Record<string, any> = { userId, prompt, traits: averageTraits, status: response.status };

        try {
          const parsedErrorData = await response.json();
          errorDetails += `: ${parsedErrorData.message || parsedErrorData.error || JSON.stringify(parsedErrorData)}`;
          // If we successfully parse JSON, use that as the error object for the logger
          errorForLogger = parsedErrorData;
          contextForLogger.parsedError = true;
        } catch (e: any) {
          const responseText = await response.text().catch(() => '[Could not retrieve response text]');
          errorDetails += ` (status: ${response.status}, text: ${responseText})`;
          // If JSON parsing fails, errorForLogger remains the default Error, and we add responseText to context
          contextForLogger.responseText = responseText;
          contextForLogger.jsonParseError = e.message;
          logger.warn('Failed to parse error JSON from generate-avatar API, or non-JSON error response', { 
            originalError: e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e),
            status: response.status, 
            responseText 
          });
        }
        // The message for the logger is the full constructed errorDetails string.
        // The error object passed to logger.error is either the parsed JSON error or a new Error with basic details.
        logger.error(errorDetails, errorForLogger, contextForLogger);
        throw new Error(errorDetails); // react-query will use this error for its onError callback
      }

      const { imageUrl } = await response.json();

      // Update latest test result with new avatar
      if (testResults[0]?.id) {
        const { error: updateError } = await supabase
          .from('test_results')
          .update({
            ai_analysis: {
              ...testResults[0].aiAnalysis,
              imageUrl,
            },
          })
          .eq('id', testResults[0].id);

        if (updateError) {
          logger.error('Error updating test result with avatar URL in DB', updateError, { testResultId: testResults[0].id });
        }
      }

      return imageUrl;
    },
    {
      onSuccess: (imageUrl) => {
        if (imageUrl) {
          queryClient.invalidateQueries(['testResults', userId]);
          addToast(t('avatar.generateSuccess'), 'success');
        }
      },
      onError: (error: Error) => {
        logger.error('Mutation error (generatePersonalityAvatar)', error, { userId });
        addToast(t('avatar.generateError', { message: error.message || 'Unknown error' }), 'error');
      }
    }
  );

  return {
    testResults,
    isLoading,
    error,
    generatePersonalityAvatar,
  };
}

// TODO: Рассмотреть возможность локализации/конфигурации описаний и порогов для черт личности
function generateImagePrompt(traits: Record<string, number>): string {
  // Convert numerical traits into descriptive words
  const descriptors: string[] = [];

  Object.entries(traits).forEach(([trait, score]) => {
    switch (trait.toLowerCase()) {
      case 'openness':
        descriptors.push(score > 0.6 ? 'creative and curious' : 'traditional and practical');
        break;
      case 'conscientiousness':
        descriptors.push(score > 0.6 ? 'organized and responsible' : 'spontaneous and flexible');
        break;
      case 'extraversion':
        descriptors.push(score > 0.6 ? 'outgoing and energetic' : 'reserved and thoughtful');
        break;
      case 'agreeableness':
        descriptors.push(score > 0.6 ? 'friendly and compassionate' : 'analytical and direct');
        break;
      case 'neuroticism':
        descriptors.push(score > 0.6 ? 'sensitive and expressive' : 'calm and composed');
        break;
      // Add more trait mappings as needed
    }
  });

  // Combine descriptors into a cohesive prompt
  return `Create a stylized portrait avatar that reflects a personality that is ${descriptors.join(', ')}. 
    The image should be artistic and symbolic, using colors and elements that represent these traits. 
    Style: digital art, minimalist, professional profile picture.`;
} 