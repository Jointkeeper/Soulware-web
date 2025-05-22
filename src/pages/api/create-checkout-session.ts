import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing env.STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, priceId, returnUrl } = req.body;

    // Verify user exists and get their email
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user || !user.user) {
      throw new Error('User not found');
    }
    const email = user.user.email;

    // Create or get Stripe customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId: string;

    if (customerError || !customer) {
      // Create new Stripe customer
      const newCustomer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      // Save customer ID to database
      await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: newCustomer.id,
      });

      customerId = newCustomer.id;
    } else {
      customerId = customer.stripe_customer_id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
} 