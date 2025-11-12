# Webhook Setup Guide

This guide explains how to configure Clerk webhooks to automatically update user subscription status after payment.

## The Problem

After a user completes payment through Clerk Billing, they remain on the "One More Step" screen because the app doesn't know their subscription is active yet. The subscription status needs to be synced to the user's metadata.

## The Solution

Set up a webhook that listens for Clerk subscription events and automatically updates the user's `publicMetadata` with their subscription status.

---

## Part 1: Deploy to Vercel (if not already deployed)

1. Push your changes to GitHub:
   ```bash
   git push origin claude/add-subscription-gating-011CV3t3GLubgx5ZyqYpZnET
   ```

2. Deploy to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will automatically detect the `/api` folder and deploy the webhook as a serverless function

3. Note your deployment URL (e.g., `https://your-app.vercel.app`)

---

## Part 2: Add Environment Variables to Vercel

You need to add **two** new environment variables to Vercel:

### 1. Get your Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** in the left sidebar
4. Copy your **Secret Key** (starts with `sk_...`)

### 2. Get your Clerk Webhook Secret

You'll create this in the next section, but prepare to add it.

### 3. Add to Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Note |
|--------------|-------|------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | *(already added)* |
| `CLERK_SECRET_KEY` | `sk_test_...` or `sk_live_...` | New - from Clerk API Keys |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` | New - from next section |

**Important:** Add these to **all environments** (Production, Preview, Development)

---

## Part 3: Configure Clerk Webhooks

### 1. Go to Clerk Webhook Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the left sidebar (under "Configure")
4. Click **+ Add Endpoint**

### 2. Create the Webhook Endpoint

**Endpoint URL:**
```
https://your-app.vercel.app/api/clerk-webhook
```
*(Replace `your-app` with your actual Vercel domain)*

**Description:**
```
Sync subscription status to user metadata
```

### 3. Subscribe to Events

Check **only** these events:
- ✅ `subscription.created`
- ✅ `subscription.updated`
- ✅ `subscription.deleted`

*(Uncheck all other events)*

### 4. Save and Get the Signing Secret

1. Click **Create**
2. Copy the **Signing Secret** (starts with `whsec_...`)
3. Go back to **Vercel** → **Settings** → **Environment Variables**
4. Add `CLERK_WEBHOOK_SECRET` with the signing secret value
5. **Redeploy** your app in Vercel for the new environment variable to take effect

---

## Part 4: Configure Clerk Billing Success URL

1. In Clerk Dashboard, go to **Monetization** → **Settings**
2. Set **Success URL** to:
   ```
   https://your-app.vercel.app/
   ```
3. Set **Cancel URL** to:
   ```
   https://your-app.vercel.app/
   ```
4. Click **Save**

---

## Part 5: Test the Flow

### Test in Development Mode (Clerk Test Mode)

1. Go to your deployed app
2. Click **Sign Up**
3. Create a test account
4. You should see the "One More Step" screen with pricing
5. Click a plan (use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC)
6. Complete the checkout
7. **Wait 2-3 seconds** for the webhook to process
8. The page should automatically redirect to the app homescreen

### Check if Webhook is Working

1. In Clerk Dashboard, go to **Webhooks**
2. Click on your webhook endpoint
3. Check **Recent Deliveries** - you should see successful `200` responses
4. If you see errors, check the Vercel Function Logs:
   - Go to Vercel → Your Project → **Logs**
   - Filter by `/api/clerk-webhook`
   - Check for error messages

---

## Part 6: Verify User Metadata

To confirm the webhook is updating user data correctly:

1. In Clerk Dashboard, go to **Users**
2. Find the test user you created
3. Click on the user
4. Scroll to **Public Metadata**
5. You should see:
   ```json
   {
     "subscriptionStatus": "active",
     "subscriptionTier": "pro",
     "lastUpdated": "2024-..."
   }
   ```

---

## Troubleshooting

### User stays on "One More Step" screen after payment

**Possible causes:**

1. **Webhook not configured** - Check Part 3 above
2. **Environment variables missing** - Check Part 2 above, then redeploy
3. **Webhook failing** - Check Clerk Dashboard → Webhooks → Recent Deliveries for errors
4. **Page not refreshing** - The app checks subscription status on load. Try refreshing the page manually after payment

### Check Webhook Logs

**In Clerk Dashboard:**
1. Go to **Webhooks**
2. Click your endpoint
3. View **Recent Deliveries**
4. Click a delivery to see the request/response

**In Vercel:**
1. Go to your project
2. Click **Logs** or **Functions**
3. Filter by `/api/clerk-webhook`
4. Check for any error messages

### Common Errors

| Error | Solution |
|-------|----------|
| "Webhook secret not configured" | Add `CLERK_WEBHOOK_SECRET` to Vercel environment variables and redeploy |
| "Invalid signature" | The webhook secret in Vercel doesn't match the one in Clerk. Copy it again from Clerk and update in Vercel |
| "Failed to update user metadata" | Add `CLERK_SECRET_KEY` to Vercel environment variables and redeploy |
| 404 on webhook URL | Make sure you've deployed the code with the `/api` folder to Vercel |

---

## Alternative: Manual Refresh Solution (Temporary)

If webhooks are taking time to set up, you can add a manual refresh button as a temporary solution:

The app already auto-checks subscription status when:
- The page loads
- The user signs in
- React state updates

If a user completes payment and doesn't see the redirect, they can simply **refresh the page** (F5 or Cmd+R) and the subscription will be detected.

---

## Summary

**Where to configure:**

1. ✅ **Vercel** - Add environment variables (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`)
2. ✅ **Clerk Dashboard** - Configure webhook endpoint and events
3. ✅ **Clerk Dashboard** - Set success/cancel URLs in Monetization settings

**After setup, the flow is:**
1. User signs up → Authenticated
2. User sees pricing → Selects plan
3. User completes Stripe checkout
4. **Webhook fires** → Updates user metadata
5. **App detects subscription** → Auto-redirects to homescreen

**Total setup time:** ~5-10 minutes

Need help? Check webhook logs in both Clerk and Vercel to diagnose issues.
