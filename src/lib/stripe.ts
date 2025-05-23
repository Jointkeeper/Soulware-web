import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { SubscriptionTier } from '@/types/subscription';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useToasts } from '@/context/ToastContext';
import { i18n } from 'next-i18next';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  logger.error('CRITICAL: Missing env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  throw new Error('Missing env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

let stripePromise: Promise<Stripe | null> | null = null;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Stripe Price IDs - должны быть установлены в переменных окружения
if (!process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
  logger.error('CRITICAL: Missing env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID');
  throw new Error('Missing env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID');
}
if (!process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID) {
  logger.error('CRITICAL: Missing env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID');
  throw new Error('Missing env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID');
}

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, string | null> = {
  free: null, // У бесплатного тарифа нет Price ID для checkout
  premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
  professional: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID,
};

export async function createCheckoutSession(
  tier: SubscriptionTier,
  returnUrl: string
) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      logger.error('Error getting session or access token for checkout operation', sessionError);
      throw new Error('Authentication token not found for checkout.');
    }
    const token = session.access_token;

    const priceIdForCheckout = SUBSCRIPTION_PRICES[tier];
    if (!priceIdForCheckout) {
      logger.error(`Attempted to create checkout session for tier "${tier}" which has no price ID.`, { tier });
      throw new Error(`Cannot create checkout session for tier "${tier}".`);
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        priceId: priceIdForCheckout,
        returnUrl,
      }),
    });

    const { sessionId } = await response.json();
    const stripeInstance = await getStripe();

    if (!stripeInstance) {
      throw new Error('Failed to load Stripe');
    }

    const { error } = await stripeInstance.redirectToCheckout({ sessionId });

    if (error) {
      logger.error('Stripe redirectToCheckout failed', error, { sessionId });
      throw error;
    }
  } catch (error) {
    logger.error('Error in createCheckoutSession client-side function', error, { tier, returnUrl });
    throw error;
  }
}

export async function createPortalSession(
  returnUrl: string
) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      logger.error('Error getting session or access token for portal session operation', sessionError);
      throw new Error('Authentication token not found for portal session.');
    }
    const token = session.access_token;

    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        returnUrl,
      }),
    });

    if (!response.ok) {
      let errorDetails = `API request to /api/create-portal-session failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetails += `: ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
      } catch (e: any) {
        const textError = await response.text().catch(() => "Invalid error response from API");
        errorDetails += `. Response: ${textError}`;
        logger.warn('Failed to parse JSON error from /api/create-portal-session, or non-JSON error', { 
          originalError: e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e),
          status: response.status, 
          responseText: textError 
        });
      }
      logger.error(errorDetails, new Error(errorDetails), { status: response.status });
      throw new Error(errorDetails);
    }

    const { url } = await response.json();
    if (!url) {
        logger.error('Error creating portal session: Portal URL missing in API response.');
        throw new Error('Portal URL missing in response.');
    }
    window.location.href = url;
  } catch (error) {
    logger.error('Error in createPortalSession client-side function', error, { returnUrl });
    throw error;
  }
} 