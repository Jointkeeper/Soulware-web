import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('CRITICAL: Missing env.STRIPE_SECRET_KEY for Stripe portal session.');
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
    logger.warn('Method not allowed for /api/create-portal-session', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let authenticatedUserId: string | undefined;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Unauthorized: Missing or invalid Authorization header for portal session.', { authHeaderProvided: !!authHeader });
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }
    const token = authHeader.split(' ')[1];

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      logger.error('Auth error verifying token in create-portal-session', authError, { tokenProvided: !!token });
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
    authenticatedUserId = authData.user.id;

    const { returnUrl: rawReturnUrl } = req.body;

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appBaseUrl) {
      logger.error('CRITICAL: NEXT_PUBLIC_APP_URL is not set. Cannot validate returnUrl for portal session.');
      return res.status(500).json({ error: 'Internal server configuration error.' });
    }
    let validatedReturnUrl = rawReturnUrl;
    try {
      const parsedReturnUrl = new URL(rawReturnUrl);
      const parsedAppBaseUrl = new URL(appBaseUrl);
      if (parsedReturnUrl.origin !== parsedAppBaseUrl.origin) {
        logger.warn(`Invalid returnUrl origin for portal. Provided: ${parsedReturnUrl.origin}, Expected: ${parsedAppBaseUrl.origin}, Fallback used.`, { rawReturnUrl, userId: authenticatedUserId, appBaseUrlOrigin: parsedAppBaseUrl.origin });
        validatedReturnUrl = `${appBaseUrl}/profile`; 
      }
    } catch (e: any) {
      logger.warn(`Invalid returnUrl format for portal: ${rawReturnUrl}. Using fallback.`, { error: e.message, rawReturnUrl, userId: authenticatedUserId });
      validatedReturnUrl = `${appBaseUrl}/profile`;
    }

    // Fetch the Stripe Customer ID from your database
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', authenticatedUserId)
      .single();

    if (customerError || !customerData?.stripe_customer_id) {
      logger.error('Failed to retrieve Stripe customer ID for portal session', customerError, { userId: authenticatedUserId });
      return res.status(404).json({ error: 'Stripe customer not found for this user. Please subscribe first or contact support.' });
    }
    const stripeCustomerId = customerData.stripe_customer_id;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: validatedReturnUrl,
    });

    logger.info('Stripe portal session created successfully', { userId: authenticatedUserId, stripeCustomerId });
    res.status(200).json({ url: portalSession.url });

  } catch (error: any) {
    logger.error('Error creating Stripe portal session', error, { userId: authenticatedUserId, body: req.body });
    res.status(500).json({ error: error.message || 'Failed to create portal session.' });
  }
} 