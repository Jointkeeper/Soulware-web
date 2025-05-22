import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing env.STRIPE_SECRET_KEY');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
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
  validUntil: Date
) {
  const features = SUBSCRIPTION_TIERS[tier];

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier,
      features,
      valid_until: validUntil.toISOString(),
      updated_at: new Date().toISOString(),
    });
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
        const userId = subscription.metadata.userId;
        const priceId = subscription.items.data[0].price.id;

        // Map price ID to subscription tier
        let tier: keyof typeof SUBSCRIPTION_TIERS;
        switch (priceId) {
          case 'price_premium':
            tier = 'premium';
            break;
          case 'price_professional':
            tier = 'professional';
            break;
          default:
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
        const userId = subscription.metadata.userId;

        // Downgrade to free tier
        await updateSubscription(
          userId,
          'free',
          new Date()
        );
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
} 