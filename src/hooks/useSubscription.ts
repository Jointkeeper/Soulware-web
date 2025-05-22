import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUserSubscription, supabase } from '@/lib/supabase';
import type { Subscription, SubscriptionTier } from '@/types/subscription';

export function useSubscription(userId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery(
    ['subscription', userId],
    () => getUserSubscription(userId!),
    {
      enabled: !!userId,
    }
  );

  const updateSubscription = useMutation(
    async ({
      tier,
      validUntil,
    }: {
      tier: SubscriptionTier;
      validUntil: Date;
    }) => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          tier,
          valid_until: validUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subscription', userId]);
      },
    }
  );

  const checkAiTestAvailability = async () => {
    if (!subscription) return false;

    // Unlimited for professional tier
    if (subscription.features.aiTestsPerDay === -1) return true;

    const today = new Date();
    const lastTest = new Date(subscription.lastAiTestDate);

    // Reset counter if it's a new day
    if (lastTest.toDateString() !== today.toDateString()) {
      await supabase
        .from('subscriptions')
        .update({
          ai_tests_used_today: 0,
          last_ai_test_date: today.toISOString(),
        })
        .eq('user_id', userId);

      queryClient.invalidateQueries(['subscription', userId]);
      return true;
    }

    return subscription.aiTestsUsedToday < subscription.features.aiTestsPerDay;
  };

  const incrementAiTestUsage = useMutation(
    async () => {
      if (!userId || !subscription) throw new Error('No subscription found');

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ai_tests_used_today: subscription.aiTestsUsedToday + 1,
          last_ai_test_date: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subscription', userId]);
      },
    }
  );

  return {
    subscription,
    isLoading,
    error,
    updateSubscription,
    checkAiTestAvailability,
    incrementAiTestUsage,
  };
} 