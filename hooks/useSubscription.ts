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
  // Check for all possible plan names
  const hasFounderPlan = has ? has({ plan: 'free_trial_founder_price' }) : false;
  const hasStandardPlan = has ? has({ plan: 'standard_coaching_membership' }) : false;

  const hasAnyPlan = hasFounderPlan || hasStandardPlan;

  // Debug: Log what has() returns
  console.log('=== SUBSCRIPTION CHECK ===');
  console.log('Has founder plan:', hasFounderPlan);
  console.log('Has standard plan:', hasStandardPlan);
  console.log('Has any plan:', hasAnyPlan);
  console.log('==========================');

  if (hasAnyPlan) {
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
