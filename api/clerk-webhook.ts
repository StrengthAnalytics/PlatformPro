import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';

/**
 * Clerk Webhook Handler for Subscription Events
 *
 * This endpoint handles webhook events from Clerk to sync subscription status
 * to user publicMetadata for real-time subscription checking in the app.
 *
 * Webhook events handled:
 * - subscription.created
 * - subscription.updated
 * - subscription.deleted
 */

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    user_id: string;
    status: string;
    plan: {
      name: string;
      id: string;
    };
    [key: string]: any;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  console.log('CLERK_WEBHOOK_SECRET exists:', !!webhookSecret);
  console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  // If there are no headers, return error
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Get the raw body as a string
  const body = JSON.stringify(req.body);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;

  // Verify the webhook signature
  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the webhook event
  const eventType = event.type;
  const eventData = event.data;

  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Event Type:', eventType);
  console.log('Full Event Data:', JSON.stringify(eventData, null, 2));
  console.log('=============================');

  // Handle subscription events
  if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
    const subscriptionData = eventData;
    const userId = subscriptionData.user_id;
    const status = subscriptionData.status; // 'active', 'trialing', 'canceled', etc.
    const planName = subscriptionData.plan?.name?.toLowerCase() || 'pro';

    // Determine the tier based on plan name
    let tier = 'free';
    if (planName.includes('enterprise')) {
      tier = 'enterprise';
    } else if (planName.includes('pro') || status === 'active' || status === 'trialing') {
      tier = 'pro';
    }

    console.log(`Updating user ${userId}: status=${status}, tier=${tier}`);

    // Update user metadata in Clerk
    try {
      const clerkApiKey = process.env.CLERK_SECRET_KEY;

      if (!clerkApiKey) {
        console.error('CLERK_SECRET_KEY is not set');
        return res.status(500).json({ error: 'Clerk API key not configured' });
      }

      const response = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${clerkApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            subscriptionStatus: status,
            subscriptionTier: tier,
            lastUpdated: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== CLERK API ERROR ===');
        console.error('Status:', response.status);
        console.error('Response:', errorText);
        console.error('User ID:', userId);
        console.error('API Key (first 10 chars):', clerkApiKey.substring(0, 10));
        return res.status(500).json({
          error: 'Failed to update user metadata',
          clerkError: errorText,
          status: response.status
        });
      }

      console.log(`Successfully updated metadata for user ${userId}`);
      return res.status(200).json({ success: true, userId, status, tier });

    } catch (error) {
      console.error('Error updating user metadata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle subscription deletion/cancellation
  if (eventType === 'subscription.deleted') {
    const userId = eventData.user_id;

    console.log(`Removing subscription for user ${userId}`);

    try {
      const clerkApiKey = process.env.CLERK_SECRET_KEY;

      if (!clerkApiKey) {
        console.error('CLERK_SECRET_KEY is not set');
        return res.status(500).json({ error: 'Clerk API key not configured' });
      }

      const response = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${clerkApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            subscriptionStatus: 'canceled',
            subscriptionTier: 'free',
            lastUpdated: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update user metadata:', errorText);
        return res.status(500).json({ error: 'Failed to update user metadata' });
      }

      console.log(`Successfully removed subscription for user ${userId}`);
      return res.status(200).json({ success: true, userId });

    } catch (error) {
      console.error('Error updating user metadata:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Return success for other event types we don't handle
  return res.status(200).json({ received: true, eventType });
}
