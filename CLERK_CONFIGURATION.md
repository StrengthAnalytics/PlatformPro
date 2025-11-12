# Clerk Configuration for Optimal Signup Flow

To ensure the best user experience with the pricing-first signup flow, configure these settings in your Clerk Dashboard:

## 1. Authentication Settings

Go to **Configure** → **Authentication** in your Clerk Dashboard:

### Sign-up Mode (IMPORTANT)
- Enable **Sign-up** mode to be the default
- This ensures when users click a pricing plan, they see the sign-up form (not sign-in)
- Users who already have accounts can still use the "Already have an account?" link

### Social Sign-up (Optional but Recommended)
- Enable Google, GitHub, or other OAuth providers
- Makes signup even faster (one-click)
- Users can start free trials instantly

## 2. Clerk Billing Configuration

Go to **Monetization** → **Settings**:

### Checkout Flow
- Ensure "Collect email during checkout" is enabled
- Set "Default checkout mode" to "Sign-up" (not "Sign-in")
- Enable "Allow guest checkout" if you want users to checkout before creating account

### After Purchase Redirect
- In Clerk Billing settings, set the success URL to: `https://your-domain.com/`
- This ensures users land on your app home page after completing purchase

## 3. Clerk Application Settings

Go to **Settings** → **Paths**:

### Redirect URLs
- **Sign-up fallback redirect URL**: `/`
- **Sign-in fallback redirect URL**: `/`
- This ensures any sign-up/sign-in process lands users at your app

### Session Management
- Set **Session timeout** to a reasonable value (e.g., 7 days)
- Enable "Multi-session handling" if you want users to stay logged in

## 4. Email Templates (Optional)

Customize email templates to match your brand:
- Welcome email after signup
- Receipt email after purchase
- Trial reminder emails

---

## Expected User Flow After Configuration

1. **User visits site** → sees welcome page
2. **Clicks "Sign Up"** → sees pricing plans
3. **Clicks a plan** → Clerk shows sign-up form (NOT sign-in)
4. **Enters email/password** → creates account
5. **Completes payment** → Stripe checkout
6. **Redirected to app** → automatically at home page with active subscription

## Troubleshooting

**If users still see sign-in instead of sign-up:**
- Check Clerk Dashboard → Configure → Authentication
- Ensure "Sign-up" is the default mode
- In your Clerk application settings, make sure "Sign-up" is not disabled

**If users get stuck on pricing page after checkout:**
- Verify the Clerk Billing success URL is set to your app's home page
- Check that our auto-redirect logic is working (see App.tsx lines 205-213)
- Ensure Clerk is syncing subscription data to `publicMetadata`

**If checkout seems broken:**
- Verify Stripe is properly connected in Clerk Dashboard
- Check that your pricing plans are published (not in draft)
- Ensure test mode cards work if testing

---

## Code Implementation

The app already has the following configured:

1. **ClerkProvider redirects** (index.tsx):
   - `signUpFallbackRedirectUrl="/"` - redirects after signup
   - `signInFallbackRedirectUrl="/"` - redirects after signin

2. **Auto-redirect on subscription** (App.tsx):
   - Watches for subscription changes
   - Automatically shows app when subscription becomes active

3. **Pricing-first flow** (App.tsx):
   - "Sign Up" button shows pricing before credentials
   - Reduces friction by showing value upfront
