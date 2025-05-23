import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUserSubscription, supabase } from '@/lib/supabase';
import type { Subscription, SubscriptionTier } from '@/types/subscription';
import { logger } from '@/lib/logger';
import { useToasts } from '@/context/ToastContext';
import { useTranslation } from 'next-i18next';

export function useSubscription(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { addToast } = useToasts();
  const { t } = useTranslation('common');

  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery(
    ['subscription', userId],
    async () => {
      if (!userId) return null;
      return getUserSubscription(userId);
    },
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

      if (error) {
        logger.error('Error updating subscription in DB', error, { userId, tier, validUntil: validUntil.toISOString() });
        throw error;
      }
      return data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['subscription', userId]);
        if (data) {
            addToast(t('subscription.updateSuccess'), 'success');
        }
      },
      onError: (error: Error) => {
        logger.error('Mutation error (updateSubscription)', error, { userId });
        addToast(t('subscription.updateError', { message: error.message || 'Unknown error' }), 'error');
      }
    }
  );

  // TODO: Нужна отдельная функция/мутация для сброса счетчика тестов при наступлении нового дня.
  // Эту функцию нужно вызывать в подходящий момент (например, при загрузке данных пользователя или перед первой проверкой доступности).
  const resetAiTestCounterIfNeeded = useMutation(
    async () => {
      if (!userId || !subscription) throw new Error('User ID or subscription not available for reset');

      const today = new Date();
      const lastTestDate = subscription.lastAiTestDate ? new Date(subscription.lastAiTestDate) : null;

      if (!lastTestDate || lastTestDate.toDateString() !== today.toDateString()) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            ai_tests_used_today: 0,
            last_ai_test_date: today.toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          logger.error('Error resetting AI test counter in DB', error, { userId });
          throw error;
        }
        logger.info('AI test counter reset successfully', { userId });
        return true;
      }
      return false;
    },
    {
      onSuccess: (didReset) => {
        if (didReset) {
          queryClient.invalidateQueries(['subscription', userId]);
          addToast(t('subscription.aiCounterReset'), 'info');
        }
      },
      onError: (error: Error) => {
        logger.error('Mutation error (resetAiTestCounterIfNeeded)', error, { userId });
        addToast(t('subscription.aiCounterResetError', { message: error.message || 'Unknown error' }), 'error');
      }
    }
  );

  // Эффект для автоматического сброса счетчика AI тестов при необходимости
  useEffect(() => {
    if (userId && subscription && !resetAiTestCounterIfNeeded.isLoading) {
      const today = new Date();
      const lastTestDate = subscription.lastAiTestDate ? new Date(subscription.lastAiTestDate) : null;

      if (!lastTestDate || lastTestDate.toDateString() !== today.toDateString()) {
        // Вызываем мутацию, если дата последнего теста не сегодня или отсутствует
        resetAiTestCounterIfNeeded.mutate();
      }
    }
  }, [userId, subscription, resetAiTestCounterIfNeeded]); // Зависимости включают мутацию, чтобы получить актуальную isLoading

  const checkAiTestAvailability = async () => {
    if (!subscription) return false;

    // Unlimited for professional tier
    if (subscription.features.aiTestsPerDay === -1) return true;

    // Проверку и сброс теперь делает resetAiTestCounterIfNeeded
    // Здесь мы просто читаем текущие значения
    // Важно: resetAiTestCounterIfNeeded должен быть вызван до этой проверки, если есть шанс, что наступил новый день

    const today = new Date();
    const lastTestDate = subscription.lastAiTestDate ? new Date(subscription.lastAiTestDate) : null;

    // Если дата последнего теста не сегодня, то доступных тестов 0 (пока не сбросится счетчик)
    // Это побудит вызвать resetAiTestCounterIfNeeded
    if (lastTestDate && lastTestDate.toDateString() !== today.toDateString()) {
        // Если счетчик еще не сброшен на сегодня, то тесты недоступны
        // Это состояние должно быть временным, пока не отработает resetAiTestCounterIfNeeded
        return false; 
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

      if (error) {
        logger.error('Error incrementing AI test usage in DB', error, { userId });
        throw error;
      }
      return data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['subscription', userId]);
      },
      onError: (error: Error) => {
        logger.error('Mutation error (incrementAiTestUsage)', error, { userId });
        addToast(t('subscription.aiUsageIncrementError', { message: error.message || 'Unknown error' }), 'error');
      }
    }
  );

  return {
    subscription,
    isLoading,
    error,
    updateSubscription,
    checkAiTestAvailability,
    incrementAiTestUsage,
    resetAiTestCounterIfNeeded,
  };
} 