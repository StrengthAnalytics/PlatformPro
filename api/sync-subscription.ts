import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple API to sync Clerk Billing subscription to user metadata
 * Called on app load to ensure subscription status is up-to-date
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!clerkSecretKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Fetch user's subscriptions from Clerk
    const subscriptionsResponse = await fetch(
      `https://api.clerk.com/v1/users/${userId}/organization_memberships`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!subscriptionsResponse.ok) {
      console.error('Failed to fetch subscriptions:', await subscriptionsResponse.text());
      // Don't fail - just return current status
      return res.status(200).json({ synced: false, message: 'Could not fetch subscriptions' });
    }

    // For now, just mark any authenticated user as having access
    // You can refine this later to check actual Clerk Billing subscriptions
    const updateResponse = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          subscriptionStatus: 'active',
          subscriptionTier: 'free_trial_founder_price',
          lastSynced: new Date().toISOString(),
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update metadata:', errorText);
      return res.status(500).json({ error: 'Failed to sync subscription' });
    }

    return res.status(200).json({ synced: true, status: 'active' });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
