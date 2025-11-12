import { useUser } from '@clerk/clerk-react';

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
 * Hook to check the current user's subscription status
 * Clerk Billing stores subscription data in publicMetadata
 */
export function useSubscription(): SubscriptionData {
  const { user, isLoaded } = useUser();

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

  if (!user) {
    return {
      tier: null,
      isActive: false,
      isPro: false,
      isEnterprise: false,
      isFree: false,
      isLoading: false,
    };
  }

  // DEBUG: Log the metadata
  console.log('=== SUBSCRIPTION CHECK ===');
  console.log('publicMetadata:', user.publicMetadata);
  console.log('=========================');

  // Check publicMetadata for subscription info
  const subscriptionStatus = user.publicMetadata?.subscriptionStatus as string | undefined;
  const subscriptionTier = user.publicMetadata?.subscriptionTier as string | undefined;

  // Determine if subscription is active
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  // Determine the tier (defaults to 'free' if no subscription)
  const tier: SubscriptionTier = (subscriptionTier as SubscriptionTier) || 'free';

  console.log('Subscription result:', { tier, isActive, subscriptionStatus, subscriptionTier });

  return {
    tier,
    isActive,
    isPro: isActive && tier !== 'free',  // Any active paid subscription counts as "pro"
    isEnterprise: tier === 'enterprise' && isActive,
    isFree: tier === 'free' || !isActive,
    isLoading: false,
  };
}
