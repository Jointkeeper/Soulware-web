import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSubscription } from './useSubscription';
import * as supabaseLib from '@/lib/supabase';
import { useToasts } from '@/context/ToastContext';
import { useTranslation } from 'next-i18next';
import { logger } from '@/lib/logger';

// Mocks
vi.mock('@/lib/supabase', () => {
  const mockFromChain = () => ({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  });

  return {
    getUserSubscription: vi.fn(),
    supabase: {
      from: vi.fn(mockFromChain),
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'mock_token' } } }))
      }
    },
  };
});

vi.mock('@/context/ToastContext', () => ({
  useToasts: vi.fn(),
}));

vi.mock('next-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockAddToast = vi.fn();
const mockT = vi.fn((key, params) => params ? `${key}_${JSON.stringify(params)}` : key);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockUserId = 'test-user-sub-id';
const mockSubscriptionBase = {
  id: 'sub_123',
  userId: mockUserId,
  tier: 'premium',
  features: { aiTestsPerDay: 5 },
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  autoRenew: true,
  lastAiTestDate: new Date(),
  aiTestsUsedToday: 0,
};

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToasts as vi.Mock).mockReturnValue({ addToast: mockAddToast });
    (useTranslation as vi.Mock).mockReturnValue({ t: mockT });
    (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValue(mockSubscriptionBase);
    
    // Resetting the implementation of supabase.from to ensure fresh mocks for chained calls in each test
    // This is important because vi.fn(mockFromChain) creates one mockFromChain instance shared across calls to from()
    // if not reset. We want each from() call in a test to start with a fresh set of chainable mocks.
    const freshMockFromChain = () => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
    (supabaseLib.supabase.from as vi.Mock).mockImplementation(freshMockFromChain);
  });

  it('should fetch subscription data on mount if userId is provided', async () => {
    const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(supabaseLib.getUserSubscription).toHaveBeenCalledWith(mockUserId);
    expect(result.current.subscription).toEqual(mockSubscriptionBase);
  });

  it('should not fetch if userId is undefined', () => {
    renderHook(() => useSubscription(undefined), { wrapper: createWrapper() });
    expect(supabaseLib.getUserSubscription).not.toHaveBeenCalled();
  });

  describe('updateSubscription mutation', () => {
    it('should call supabase update and invalidate queries on success', async () => {
      const newTier = 'professional';
      const newValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const mockUpdatedSub = { ...mockSubscriptionBase, tier: newTier, validUntil: newValidUntil }; 
      
      const fromChain = supabaseLib.supabase.from('subscriptions'); // Call from to get the chain
      // The actual chain is: .update({}).eq().select().single()
      // So, fromChain.update().eq().select().single should be mocked
      const singleMock = vi.fn().mockResolvedValueOnce({ data: mockUpdatedSub, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      (fromChain.update as vi.Mock).mockReturnValue({ eq: eqMock });

      const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateSubscription.mutateAsync({ tier: newTier, validUntil: newValidUntil });
      });

      expect(supabaseLib.supabase.from).toHaveBeenCalledWith('subscriptions');
      // Check the arguments of the actual functions that were called on the chain
      expect(fromChain.update).toHaveBeenCalledWith(expect.objectContaining({ tier: newTier, valid_until: newValidUntil.toISOString() }));
      expect((fromChain.update() as any).eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockAddToast).toHaveBeenCalledWith('subscription.updateSuccess', 'success');
    });

    it('should handle error during updateSubscription', async () => {
        const updateError = new Error('DB Update Failed');
        const fromChain = supabaseLib.supabase.from('subscriptions');
        const singleMock = vi.fn().mockResolvedValueOnce({ data: null, error: updateError });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const eqMock = vi.fn().mockReturnValue({ select: selectMock });
        (fromChain.update as vi.Mock).mockReturnValue({ eq: eqMock });
  
        const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
  
        await act(async () => {
          try {
            await result.current.updateSubscription.mutateAsync({ tier: 'premium', validUntil: new Date() });
          } catch (e) {
            // Expected error
          }
        });
        expect(logger.error).toHaveBeenCalledWith('Error updating subscription in DB', updateError, expect.any(Object));
        expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('subscription.updateError'), 'error');
      });
  });

  describe('resetAiTestCounterIfNeeded mutation and effect', () => {
    it('should reset counter if lastAiTestDate is yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({
        ...mockSubscriptionBase,
        lastAiTestDate: yesterday,
        aiTestsUsedToday: 3,
      });
      const fromChain = supabaseLib.supabase.from('subscriptions');
      // Chain is: .update(DATA).eq(CONDITION) - eq is terminal here
      const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
      (fromChain.update as vi.Mock).mockReturnValue({ eq: eqMock });

      const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await waitFor(() => expect(result.current.resetAiTestCounterIfNeeded.isSuccess).toBe(true));
      
      expect(fromChain.update).toHaveBeenCalledWith(expect.objectContaining({ ai_tests_used_today: 0 }));
      expect(mockAddToast).toHaveBeenCalledWith('subscription.aiCounterReset', 'info');
    });

    it('should NOT reset counter if lastAiTestDate is today', async () => {
        (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({
          ...mockSubscriptionBase,
          lastAiTestDate: new Date(),
          aiTestsUsedToday: 1,
        });
        const fromChain = supabaseLib.supabase.from('subscriptions'); // Ensure from is called to track
        
        const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(() => new Promise(resolve => setTimeout(resolve, 50))); 

        expect(result.current.resetAiTestCounterIfNeeded.isIdle).toBe(true);
        expect(fromChain.update).not.toHaveBeenCalledWith(expect.objectContaining({ ai_tests_used_today: 0 }));
      });
  });

  describe('checkAiTestAvailability', () => {
    it('should return true if professional tier (unlimited)', async () => {
      (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({ ...mockSubscriptionBase, features: { aiTestsPerDay: -1 } });
      const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const available = await result.current.checkAiTestAvailability();
      expect(available).toBe(true);
    });

    it('should return true if tests used < tests per day and last test was today', async () => {
        (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({
            ...mockSubscriptionBase,
            features: { aiTestsPerDay: 5 },
            aiTestsUsedToday: 2,
            lastAiTestDate: new Date(),
          });
        const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const available = await result.current.checkAiTestAvailability();
        expect(available).toBe(true);
      });

    it('should return false if tests used >= tests per day and last test was today', async () => {
    (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({
        ...mockSubscriptionBase,
        features: { aiTestsPerDay: 3 },
        aiTestsUsedToday: 3,
        lastAiTestDate: new Date(),
        });
    const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const available = await result.current.checkAiTestAvailability();
    expect(available).toBe(false);
    });

    it('should return false if last test date was not today (counter not yet reset for today)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        (supabaseLib.getUserSubscription as vi.Mock).mockResolvedValueOnce({
          ...mockSubscriptionBase,
          features: { aiTestsPerDay: 5 },
          aiTestsUsedToday: 0, 
          lastAiTestDate: yesterday,
        });
        const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const available = await result.current.checkAiTestAvailability();
        expect(available).toBe(false);
      });
  });

  describe('incrementAiTestUsage mutation', () => {
    it('should call supabase update for incrementing usage', async () => {
        const fromChain = supabaseLib.supabase.from('subscriptions');
        // Chain: .update(DATA).eq().select().single()
        const singleMock = vi.fn().mockResolvedValueOnce({ data: { ...mockSubscriptionBase, aiTestsUsedToday: 1 }, error: null });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const eqMock = vi.fn().mockReturnValue({ select: selectMock });
        (fromChain.update as vi.Mock).mockReturnValue({ eq: eqMock });
    
        const { result } = renderHook(() => useSubscription(mockUserId), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.isLoading).toBe(false)); 
    
        await act(async () => {
          await result.current.incrementAiTestUsage.mutateAsync();
        });
    
        expect(fromChain.update).toHaveBeenCalledWith(expect.objectContaining({ ai_tests_used_today: 1 }));
      });
  });

}); 