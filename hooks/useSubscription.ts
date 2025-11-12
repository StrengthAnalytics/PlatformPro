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

  // DEBUG: Let's see EVERYTHING Clerk gives us
  console.log('=== FULL USER OBJECT ===');
  console.log('User:', user);
  console.log('User keys:', Object.keys(user));

  // Check for different possible subscription properties
  console.log('Checking for subscription properties:');
  console.log('user.subscriptions:', (user as any).subscriptions);
  console.log('user.subscription:', (user as any).subscription);
  console.log('user.organizationMemberships:', user.organizationMemberships);
  console.log('user.publicMetadata:', user.publicMetadata);
  console.log('user.privateMetadata:', (user as any).privateMetadata);
  console.log('user.unsafeMetadata:', user.unsafeMetadata);
  console.log('=======================');

  // For now, return free tier since we can't find subscription data
  return {
    tier: 'free',
    isActive: false,
    isPro: false,
    isEnterprise: false,
    isFree: true,
    isLoading: false,
  };
}
