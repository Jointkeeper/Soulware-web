import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
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