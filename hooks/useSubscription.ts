import { useAuth } from '@clerk/clerk-react';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | null;

interface SubscriptionData {
  tier: SubscriptionTier;
  isActive: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  isLoading: boolean;
}

/**
 * Hook to check the current user's subscription status using Clerk's built-in has() method
 * This directly checks Clerk Billing subscriptions - no webhook needed!
 */
export function useSubscription(): SubscriptionData {
  const { has, isLoaded } = useAuth();

  if (!isLoaded) {
    return {
      tier: null,
      isActive: false,
      isPro: false,
      isEnterprise: false,
      isFree: false,
      isLoading: true,
    };
  }

  // Use Clerk's built-in has() method to check for active subscription
  const hasFounderPlan = has ? has({ plan: 'free_trial_founder_price' }) : false;

  // Debug: Log what has() returns
  console.log('=== SUBSCRIPTION CHECK ===');
  console.log('Checking plan "free_trial_founder_price":', hasFounderPlan);
  console.log('has function exists:', !!has);
  console.log('==========================');

  if (hasFounderPlan) {
    return {
      tier: 'pro',
      isActive: true,
      isPro: true,
      isEnterprise: false,
      isFree: false,
      isLoading: false,
    };
  }

  // No active subscription
  return {
    tier: 'free',
    isActive: false,
    isPro: false,
    isEnterprise: false,
    isFree: true,
    isLoading: false,
  };
}
