export type SubscriptionTier = 'free' | 'premium' | 'professional';

export interface SubscriptionFeatures {
  aiTestsPerDay: number;
  staticTestsAccess: 'limited' | 'full';
  analytics: 'basic' | 'advanced';
  advertising: boolean;
  support: 'basic' | 'priority';
  apiAccess: boolean;
  customBranding: boolean;
  dataExport: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  features: SubscriptionFeatures;
  validUntil: Date;
  autoRenew: boolean;
  lastAiTestDate: Date;
  aiTestsUsedToday: number;
  createdAt: Date;
  updatedAt: Date;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    aiTestsPerDay: 1,
    staticTestsAccess: 'limited',
    analytics: 'basic',
    advertising: true,
    support: 'basic',
    apiAccess: false,
    customBranding: false,
    dataExport: false,
  },
  premium: {
    aiTestsPerDay: 5,
    staticTestsAccess: 'full',
    analytics: 'advanced',
    advertising: false,
    support: 'priority',
    apiAccess: false,
    customBranding: false,
    dataExport: true,
  },
  professional: {
    aiTestsPerDay: -1, // Unlimited
    staticTestsAccess: 'full',
    analytics: 'advanced',
    advertising: false,
    support: 'priority',
    apiAccess: true,
    customBranding: true,
    dataExport: true,
  },
}; 