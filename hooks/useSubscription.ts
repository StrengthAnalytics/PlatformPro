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

  // DEBUG: Log what Clerk is actually giving us
  console.log('=== CLERK USER DATA ===');
  console.log('Full publicMetadata:', user.publicMetadata);
  console.log('Full privateMetadata:', user.unsafeMetadata);
  console.log('User ID:', user.id);
  console.log('=======================');

  // Clerk Billing stores subscription info in publicMetadata
  // Check for subscription status
  const subscriptionStatus = user.publicMetadata?.subscriptionStatus as string | undefined;
  const subscriptionTier = user.publicMetadata?.subscriptionTier as string | undefined;

  // Determine if subscription is active
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  // Determine the tier (defaults to 'free' if no subscription)
  const tier: SubscriptionTier = (subscriptionTier as SubscriptionTier) || 'free';

  console.log('Parsed subscription:', { tier, isActive, subscriptionStatus, subscriptionTier });

  return {
    tier,
    isActive,
    isPro: tier === 'pro' && isActive,
    isEnterprise: tier === 'enterprise' && isActive,
    isFree: tier === 'free' || !isActive,
    isLoading: false,
  };
}
