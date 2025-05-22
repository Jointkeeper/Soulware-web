import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '@/lib/supabase';
import type { TestResult } from '@/types/test';

interface UseTestHistoryOptions {
  userId: string;
  includeTest?: boolean;
}

export function useTestHistory({ userId, includeTest = true }: UseTestHistoryOptions) {
  const queryClient = useQueryClient();

  const {
    data: testResults,
    isLoading,
    error,
  } = useQuery(
    ['testResults', userId],
    async () => {
      const query = supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as TestResult[];
    },
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  );

  const generatePersonalityAvatar = useMutation(
    async () => {
      if (!testResults?.length) return null;

      // Analyze test results to determine personality traits
      const traits = testResults.reduce((acc, result) => {
        if (result.scores) {
          Object.entries(result.scores as Record<string, number>).forEach(([trait, score]) => {
            if (!acc[trait]) acc[trait] = [];
            acc[trait].push(score);
          });
        }
        return acc;
      }, {} as Record<string, number[]>);

      // Calculate average scores
      const averageTraits = Object.entries(traits).reduce((acc, [trait, scores]) => {
        acc[trait] = (scores as number[]).reduce((sum: number, score: number) => sum + score, 0) / (scores as number[]).length;
        return acc;
      }, {} as Record<string, number>);

      // Generate image prompt based on traits
      const prompt = generateImagePrompt(averageTraits);

      // Call AI service to generate avatar
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          prompt,
          traits: averageTraits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate avatar');
      }

      const { imageUrl } = await response.json();

      // Update latest test result with new avatar
      if (testResults[0]?.id) {
        const { error } = await supabase
          .from('test_results')
          .update({
            ai_analysis: {
              ...testResults[0].aiAnalysis,
              imageUrl,
            },
          })
          .eq('id', testResults[0].id);

        if (error) throw error;
      }

      return imageUrl;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['testResults', userId]);
      },
    }
  );

  return {
    testResults,
    isLoading,
    error,
    generatePersonalityAvatar,
  };
}

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