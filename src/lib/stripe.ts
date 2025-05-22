import { loadStripe } from '@stripe/stripe-js';
import type { SubscriptionTier } from '@/types/subscription';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

export const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, string> = {
  free: '0',
  premium: 'price_premium', // Replace with actual Stripe price ID
  professional: 'price_professional', // Replace with actual Stripe price ID
};

export async function createCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  returnUrl: string
) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId: SUBSCRIPTION_PRICES[tier],
        returnUrl,
      }),
    });

    const { sessionId } = await response.json();
    const stripeInstance = await stripe;

    if (!stripeInstance) {
      throw new Error('Failed to load Stripe');
    }

    const { error } = await stripeInstance.redirectToCheckout({ sessionId });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl,
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
} 