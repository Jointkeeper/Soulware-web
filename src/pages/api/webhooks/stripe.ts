import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';
import { logger } from '@/lib/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('CRITICAL: Missing env.STRIPE_SECRET_KEY for Stripe webhook.');
  throw new Error('Missing env.STRIPE_SECRET_KEY');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  logger.error('CRITICAL: Missing env.STRIPE_WEBHOOK_SECRET for Stripe webhook.');
  throw new Error('Missing env.STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Disable body parsing (use raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateSubscription(
  userId: string,
  tier: keyof typeof SUBSCRIPTION_TIERS,
  validUntil: Date | null
) {
  const features = SUBSCRIPTION_TIERS[tier];

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier,
      features,
      valid_until: validUntil ? validUntil.toISOString() : null,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    logger.error(`Error upserting subscription for user ${userId} to tier ${tier} in Stripe webhook`, error, { userId, tier, validUntil: validUntil?.toISOString() });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      logger.error('Stripe webhook error: No signature found in headers.', { headers: req.headers });
      throw new Error('No signature found');
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) {
          logger.error('Stripe webhook: User ID missing in subscription metadata.', { subscriptionId: subscription.id, eventType: event.type });
          break;
        }
        const priceId = subscription.items.data[0].price.id;

        // Map price ID to subscription tier
        let tier: keyof typeof SUBSCRIPTION_TIERS;
        
        // Stripe Price IDs - должны быть установлены в переменных окружения
        // Используем серверные переменные (без NEXT_PUBLIC_)
        if (!process.env.STRIPE_PREMIUM_PRICE_ID) {
          logger.error('CRITICAL: STRIPE_PREMIUM_PRICE_ID is not set in environment variables for Stripe webhook.');
          res.status(500).json({ error: 'Server configuration error: Missing Stripe Premium Price ID.' });
          return;
        }
        if (!process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
          logger.error('CRITICAL: STRIPE_PROFESSIONAL_PRICE_ID is not set in environment variables for Stripe webhook.');
          res.status(500).json({ error: 'Server configuration error: Missing Stripe Professional Price ID.' });
          return;
        }

        const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;
        const PROFESSIONAL_PRICE_ID = process.env.STRIPE_PROFESSIONAL_PRICE_ID;

        switch (priceId) {
          case PREMIUM_PRICE_ID:
            tier = 'premium';
            break;
          case PROFESSIONAL_PRICE_ID:
            tier = 'professional';
            break;
          default:
            logger.warn(`Stripe webhook: Unknown Price ID received. Defaulting to free.`, { priceId, userId, subscriptionId: subscription.id });
            tier = 'free';
        }

        await updateSubscription(
          userId,
          tier,
          new Date(subscription.current_period_end * 1000)
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) {
          logger.error('Stripe webhook: User ID missing in subscription metadata (for deletion).', { subscriptionId: subscription.id, eventType: event.type });
          break;
        }

        // Downgrade to free tier
        await updateSubscription(
          userId,
          'free',
          null // Устанавливаем null для validUntil, что может означать "бессрочно"
        );
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error handling Stripe webhook', error, { rawBodyProvided: !!(req as any).rawBody, signatureProvided: !!req.headers['stripe-signature']});
    res.status(400).json({ error: 'Webhook error. Check signature or request body.' });
  }
} 