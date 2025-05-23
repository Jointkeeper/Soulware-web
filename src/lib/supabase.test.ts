import { vi } from 'vitest';
import { supabase, getUserSubscription } from './supabase'; // Import the actual supabase client for mocking its methods

// Mock the global supabase client that is imported by the functions we are testing
vi.mock('./supabase', async (importOriginal) => {
  const original = await importOriginal<typeof import('./supabase')>();
  return {
    ...original, // Spread original module to keep other exports like signIn, signUp intact
    supabase: {
      // Mock only the parts of supabase client that getUserSubscription uses
      from: vi.fn().mockReturnThis(), // Mocks from().select()... chain
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(), // This will be specialized per test case
      auth: {
        // Add auth mocks if other functions in this file are tested that need them
        getSession: vi.fn(),
        getUser: vi.fn(),
        // ... other auth methods if needed
      },
    },
  };
});

describe('getUserSubscription', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks(); 
    // Default single mock for cases not specifically testing it, or reset it in specific tests
    (supabase.from('subscriptions').select('*').eq('user_id', 'test-user-id').single as vi.Mock).mockResolvedValue({ data: null, error: null });
  });

  it('should return null if userId is not provided', async () => {
    const subscription = await getUserSubscription('');
    expect(subscription).toBeNull();
  });

  it('should return null if Supabase returns an error', async () => {
    const mockError = { message: 'Supabase error', details: '', hint: '', code: '' };
    (supabase.from('subscriptions').select('*').eq('user_id', 'test-user-id').single as vi.Mock)
      .mockResolvedValueOnce({ data: null, error: mockError });

    const subscription = await getUserSubscription('test-user-id');
    expect(subscription).toBeNull();
    // Optionally, check if console.error was called (requires spyOn console)
  });

  it('should return null if Supabase returns no data', async () => {
    (supabase.from('subscriptions').select('*').eq('user_id', 'test-user-id').single as vi.Mock)
      .mockResolvedValueOnce({ data: null, error: null });

    const subscription = await getUserSubscription('test-user-id');
    expect(subscription).toBeNull();
  });

  it('should correctly map data when valid_until is a valid date string', async () => {
    const mockDate = new Date();
    const mockDbData = {
      id: 'sub_123',
      user_id: 'test-user-id',
      tier: 'premium',
      features: { aiTestsPerDay: 5 },
      valid_until: mockDate.toISOString(),
      auto_renew: true,
      last_ai_test_date: null,
      ai_tests_used_today: 0,
    };
    (supabase.from('subscriptions').select('*').eq('user_id', 'test-user-id').single as vi.Mock)
      .mockResolvedValueOnce({ data: mockDbData, error: null });

    const subscription = await getUserSubscription('test-user-id');
    expect(subscription).toEqual({
      id: 'sub_123',
      userId: 'test-user-id',
      tier: 'premium',
      features: { aiTestsPerDay: 5 },
      validUntil: mockDate, // Expect a Date object
      autoRenew: true,
      lastAiTestDate: null,
      aiTestsUsedToday: 0,
    });
  });

  it('should correctly map data and set validUntil to null when valid_until is null in DB', async () => {
    const mockDbData = {
      id: 'sub_456',
      user_id: 'test-user-id-null-date',
      tier: 'free',
      features: { aiTestsPerDay: 1 },
      valid_until: null, // Key part of this test
      auto_renew: false,
      last_ai_test_date: new Date().toISOString(),
      ai_tests_used_today: 1,
    };
    (supabase.from('subscriptions').select('*').eq('user_id', 'test-user-id-null-date').single as vi.Mock)
      .mockResolvedValueOnce({ data: mockDbData, error: null });

    const subscription = await getUserSubscription('test-user-id-null-date');
    expect(subscription).toBeDefined();
    expect(subscription?.validUntil).toBeNull();
    expect(subscription?.tier).toBe('free');
  });

   it('should correctly map last_ai_test_date when it is a valid date string or null', async () => {
    const mockDate = new Date();
    const mockUserId = 'test-user-for-last-ai-date'; // Use a distinct user ID for this test
    const mockDbDataWithDate = {
      id: 'sub_789', user_id: mockUserId, tier: 'premium', features: {}, valid_until: null, auto_renew: true, 
      last_ai_test_date: mockDate.toISOString(), ai_tests_used_today: 0
    };
    const mockDbDataNullDate = {
      id: 'sub_101', user_id: mockUserId, tier: 'free', features: {}, valid_until: null, auto_renew: false, 
      last_ai_test_date: null, ai_tests_used_today: 0
    };

    (supabase.from('subscriptions').select('*').eq('user_id', mockUserId).single as vi.Mock)
        .mockResolvedValueOnce({ data: mockDbDataWithDate, error: null });
    let sub = await getUserSubscription(mockUserId);
    expect(sub?.lastAiTestDate).toEqual(mockDate);

    (supabase.from('subscriptions').select('*').eq('user_id', mockUserId).single as vi.Mock)
        .mockResolvedValueOnce({ data: mockDbDataNullDate, error: null });
    sub = await getUserSubscription(mockUserId);
    expect(sub?.lastAiTestDate).toBeNull();
  });
}); 