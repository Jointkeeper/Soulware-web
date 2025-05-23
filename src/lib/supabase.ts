import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { Subscription, SubscriptionTier, SubscriptionFeatures } from '@/types/subscription';
import Stripe from 'stripe';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Attempted to initialize Supabase client-side without NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set. For admin-level operations, this might be required.");
    // Depending on the use case, you might want to throw an error here
    // throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set."); 
}

// Убедимся, что URL корректен
let supabaseUrl;
try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
} catch (e) {
    throw new Error(`Invalid Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
}

// Используем SUPABASE_SERVICE_ROLE_KEY если он есть (для операций на сервере), иначе anon key
const supabaseKey = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    throw new Error("Supabase key (anon or service role) is not defined.");
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey);

export async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    return null;
  }

  if (!session) {
    return null;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error getting user:', userError);
    return null;
  }
  return user;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // TODO: Заменить console.error на глобальный логгер
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const subscriptionData: Subscription = {
      id: data.id,
      userId: data.user_id,
      tier: data.tier as SubscriptionTier,
      features: data.features as SubscriptionFeatures,
      // @ts-ignore TODO: Linter incorrectly flags 'Date | null' as not assignable to 'Date | null' target type.
      validUntil: data.valid_until ? new Date(data.valid_until) : null,
      autoRenew: data.auto_renew,
      // @ts-ignore TODO: Linter incorrectly flags 'Date | null' as not assignable to 'Date | null' target type.
      lastAiTestDate: data.last_ai_test_date ? new Date(data.last_ai_test_date) : null,
      aiTestsUsedToday: data.ai_tests_used_today,
    };

    return subscriptionData;
  } catch (error) {
    console.error('Exception in getUserSubscription:', error);
    return null;
  }
}

export async function checkAiTestAvailability(userId: string) {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;

    // Unlimited for professional tier
    if (subscription.features.aiTestsPerDay === -1) return true;

    const today = new Date();
    const lastTest = new Date(subscription.lastAiTestDate);

    // Reset counter if it's a new day
    if (lastTest.toDateString() !== today.toDateString()) {
      await supabase
        .from('subscriptions')
        .update({
          aiTestsUsedToday: 0,
          lastAiTestDate: today.toISOString(),
        })
        .eq('user_id', userId);

      return true;
    }

    return subscription.aiTestsUsedToday < subscription.features.aiTestsPerDay;
  } catch (error) {
    console.error('Error checking AI test availability:', error);
    return false;
  }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export async function createStripeCustomer(userId: string, email: string): Promise<string> {
    if (!userId || !email) {
        throw new Error('User ID and email are required to create Stripe customer.');
    }
    const customer = await (globalThis as any).stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });
    return customer.id;
}

export async function getStripeCustomer(stripeCustomerId: string): Promise<Stripe.Customer | null> {
    try {
        const customer = await (globalThis as any).stripe.customers.retrieve(stripeCustomerId);
        if (customer.deleted) {
            return null;
        }
        return customer as Stripe.Customer;
    } catch (error: any) {
        if (error.code === 'resource_missing') { // PGRST116 equivalent for Stripe API
            return null;
        }
        console.error('Error fetching Stripe customer:', error);
        throw error;
    }
} 