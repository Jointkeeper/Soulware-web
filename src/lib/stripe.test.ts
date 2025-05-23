import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { stripe, createCheckoutSession, createPortalSession, SUBSCRIPTION_PRICES } from './stripe';
import { logger } from '@/lib/logger';

// Mock Stripe.js first, as its artifacts might be used by other mocks if imports are tricky
const mockRedirectToCheckout = vi.fn();
const mockStripeInstance = {
  redirectToCheckout: mockRedirectToCheckout,
};
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripeInstance)),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock window.location.href
const originalWindowLocation = window.location;
beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { href: '', assign: vi.fn(), replace: vi.fn() };
});

afterAll(() => {
  window.location = originalWindowLocation;
});


describe('Stripe Library', () => {
  const mockAccessToken = 'mock-access-token';
  const mockReturnUrl = 'https://soulware.com/profile';

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    window.location.href = ''; // Reset href
    (window.location.assign as vi.Mock).mockClear();
    (window.location.replace as vi.Mock).mockClear();
  });

  describe('createCheckoutSession', () => {
    it('should throw an error if Supabase session fails', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: new Error('Session error'), data: { session: null } });
      await expect(createCheckoutSession('premium', mockReturnUrl)).rejects.toThrow('Authentication token not found for checkout.');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting session'), expect.any(Error));
    });

    it('should throw an error if Supabase session has no token', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: null } } });
      await expect(createCheckoutSession('premium', mockReturnUrl)).rejects.toThrow('Authentication token not found for checkout.');
    });
    
    it('should throw an error for a tier with no price ID (e.g., free)', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
      await expect(createCheckoutSession('free', mockReturnUrl)).rejects.toThrow('Cannot create checkout session for tier "free".');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('has no price ID'), expect.any(Object));
    });

    it('should call fetch with correct parameters and redirect to Stripe checkout', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'sess_123' }),
      });
      mockRedirectToCheckout.mockResolvedValueOnce({ error: null });

      await createCheckoutSession('premium', mockReturnUrl);

      expect(fetch).toHaveBeenCalledWith('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({
          priceId: SUBSCRIPTION_PRICES.premium,
          returnUrl: mockReturnUrl,
        }),
      });
      expect(mockRedirectToCheckout).toHaveBeenCalledWith({ sessionId: 'sess_123' });
    });

    it('should throw error if fetch to create-checkout-session fails', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } }});
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'API Error' }),
      });

      await expect(createCheckoutSession('premium', mockReturnUrl)).rejects.toThrow(); // Error comes from response.json() if not ok
      // More specific error check can be added if the function re-throws a specific message
    });
    
    it('should throw error if Stripe.js fails to load', async () => {
        (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
        (fetch as vi.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ sessionId: 'sess_123' }),
        });
        // @ts-ignore
        (await stripe).redirectToCheckout = undefined; // Simulate stripe instance without redirectToCheckout

        await expect(createCheckoutSession('premium', mockReturnUrl)).rejects.toThrow('Failed to load Stripe');
         // Restore stripe instance for other tests
        // @ts-ignore
        (await stripe).redirectToCheckout = mockRedirectToCheckout;
    });

    it('should throw error if redirectToCheckout fails', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'sess_123' }),
      });
      const stripeError = new Error('Stripe redirect error');
      mockRedirectToCheckout.mockResolvedValueOnce({ error: stripeError });

      await expect(createCheckoutSession('premium', mockReturnUrl)).rejects.toThrow(stripeError);
      expect(logger.error).toHaveBeenCalledWith('Stripe redirectToCheckout failed', stripeError, { sessionId: 'sess_123' });
    });
  });

  describe('createPortalSession', () => {
    it('should throw an error if Supabase session fails for portal', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: new Error('Session error'), data: { session: null } });
      await expect(createPortalSession(mockReturnUrl)).rejects.toThrow('Authentication token not found for portal session.');
    });

    it('should call fetch for portal session and redirect to Stripe portal URL', async () => {
      const portalUrl = 'https://stripe.com/portal/123';
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: portalUrl }),
      });

      await createPortalSession(mockReturnUrl);

      expect(fetch).toHaveBeenCalledWith('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAccessToken}`,
        },
        body: JSON.stringify({ returnUrl: mockReturnUrl }),
      });
      expect(window.location.href).toBe(portalUrl);
    });

    it('should throw error if fetch to create-portal-session is not ok', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } }});
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
        text: () => Promise.resolve('Forbidden text'),
      });
      
      await expect(createPortalSession(mockReturnUrl)).rejects.toThrow(expect.stringContaining('API request to /api/create-portal-session failed with status 403: Forbidden'));
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('API request to /api/create-portal-session failed with status 403: Forbidden'), expect.any(Error), expect.any(Object));
    });

    it('should throw error if portal URL is missing in API response', async () => {
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ error: null, data: { session: { access_token: mockAccessToken } } });
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: null }), // No URL
      });

      await expect(createPortalSession(mockReturnUrl)).rejects.toThrow('Portal URL missing in response.');
      expect(logger.error).toHaveBeenCalledWith('Error creating portal session: Portal URL missing in API response.');
    });
  });
}); 