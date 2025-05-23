import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('CRITICAL: Missing env.STRIPE_SECRET_KEY');
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }
    const token = authHeader.split(' ')[1];

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      logger.error('Auth error verifying token in create-checkout-session', authError, { tokenProvided: !!token });
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
    const authenticatedUser = authData.user;
    const authenticatedUserId = authenticatedUser.id;
    const authenticatedUserEmail = authenticatedUser.email;

    if (!authenticatedUserEmail) {
        logger.error('Authenticated user does not have an email in create-checkout-session', null, { userId: authenticatedUserId });
        return res.status(400).json({ error: 'User email is missing.' });
    }

    const { priceId, returnUrl: rawReturnUrl } = req.body;

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appBaseUrl) {
      logger.error('CRITICAL: NEXT_PUBLIC_APP_URL is not set. Cannot validate returnUrl for checkout.');
      return res.status(500).json({ error: 'Internal server configuration error.' });
    }
    let validatedReturnUrl = rawReturnUrl;
    try {
      const parsedReturnUrl = new URL(rawReturnUrl);
      const parsedAppBaseUrl = new URL(appBaseUrl);
      if (parsedReturnUrl.origin !== parsedAppBaseUrl.origin) {
        logger.warn(`Invalid returnUrl origin for checkout. Provided: ${parsedReturnUrl.origin}, Expected: ${parsedAppBaseUrl.origin}, Fallback used.`, { rawReturnUrl, userId: authenticatedUserId, appBaseUrlOrigin: parsedAppBaseUrl.origin });
        validatedReturnUrl = `${appBaseUrl}/profile`; 
      }
    } catch (e: any) {
      logger.warn(`Invalid returnUrl format for checkout: ${rawReturnUrl}. Using fallback.`, { error: e.message, stack: e.stack, rawReturnUrl, userId: authenticatedUserId });
      validatedReturnUrl = `${appBaseUrl}/profile`;
    }

    const email = authenticatedUserEmail;
    const userId = authenticatedUserId; // Use the authenticated user's ID

    // Create or get Stripe customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId: string;

    if (customerError) {
      if (customerError.code !== 'PGRST116') { 
        logger.error('Error fetching Stripe customer from Supabase for checkout', customerError, { userId });
        throw new Error('Failed to retrieve your customer data. Please try again later.');
      }
      logger.info('Stripe customer not found in Supabase (PGRST116), will create new.', { userId });
    }

    if (customer && !customerError) { // Успешно получили существующего клиента
      customerId = customer.stripe_customer_id;
    } else {
      // Создаем нового клиента Stripe, если он не найден (customer is null/undefined или была ошибка PGRST116)
      const newCustomer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      // Save customer ID to database
      const { error: insertError } = await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: newCustomer.id,
      });

      if (insertError) {
        logger.error('Error saving Stripe customer ID to Supabase after creating in Stripe', insertError, { userId, stripeCustomerId: newCustomer.id });
        throw new Error('Failed to save customer mapping. Please try again.');
      }
      logger.info('Successfully created and saved new Stripe customer mapping to Supabase', { userId, stripeCustomerId: newCustomer.id });
      customerId = newCustomer.id;
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
      success_url: `${validatedReturnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: validatedReturnUrl,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    logger.error('Unhandled error in create-checkout-session API handler', error, { body: req.body });
    res.status(500).json({ error: 'Failed to create checkout session. Please try again later or contact support.' });
  }
} 