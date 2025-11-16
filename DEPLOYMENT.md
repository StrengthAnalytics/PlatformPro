# Deployment Guide

This guide covers deploying **both versions** of the application from a single repository:
- **Platform Coach** (Paid version with authentication)
- **Platform Lifter** (Free version without authentication)

---

## Overview: Dual Deployment Architecture

This repository deploys two separate applications using environment variables to control behavior:

| Application | URL | Environment Mode | Authentication |
|------------|-----|-----------------|----------------|
| **Platform Coach** | platformcoach.app | `VITE_APP_MODE=paid` | Clerk + Stripe |
| **Platform Lifter** | platformlifter.app | `VITE_APP_MODE=free` | None |

Both deployments use **separate Vercel projects** pointing to the **same GitHub repository**.

---

## Platform Lifter (Free Version) Deployment

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Configure the project:
   - **Project Name:** `platform-lifter` (or your choice)
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)

### 2. Set Environment Variables

Add the following environment variables in **Settings** → **Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_APP_MODE` | `free` | Production, Preview, Development |
| `VITE_UPGRADE_URL` | `https://platformcoach.app` | Production, Preview, Development |

**Important:** Do **NOT** add `VITE_CLERK_PUBLISHABLE_KEY` for the free version.

### 3. Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain: `platformlifter.app`
3. Configure DNS records as instructed by Vercel

### 4. Deploy

1. Click **Deploy** to trigger the initial deployment
2. Verify the deployment at your Vercel URL or custom domain

### 5. Testing Checklist

- [ ] Application loads without authentication
- [ ] Header shows "PLATFORM LIFTER"
- [ ] Orange gradient branding is applied
- [ ] Lite planner works with Game Day Mode (blue gradient button)
- [ ] Upgrade modals appear when accessing pro features
- [ ] Upgrade button redirects to `https://platformcoach.app`
- [ ] No Clerk-related errors in console
- [ ] PWA installs correctly
- [ ] Offline functionality works

---

## Platform Coach (Paid Version) Deployment

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Configure the project:
   - **Project Name:** `platform-coach` (or your choice)
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)

### 2. Set Environment Variables

Add the following environment variables in **Settings** → **Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_APP_MODE` | `paid` | Production, Preview, Development |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (from Clerk) | Production |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` (from Clerk) | Preview, Development |

**Note:** Use `pk_live_...` for production and `pk_test_...` for development/preview environments.

### 3. Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain: `platformcoach.app`
3. Configure DNS records as instructed by Vercel

### 4. Clerk Configuration

#### 4.1. Add Allowed Origins

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. Go to **API Keys** (or **Settings** depending on your dashboard version)
2. Navigate to **Allowed Origins** or **CORS**
3. Add your deployment URLs:
   - `https://platformcoach.app`
   - `https://your-project.vercel.app` (Vercel preview URLs)
   - `http://localhost:5173` (local development)

#### 4.2. Enable Billing & Subscriptions

1. Go to **Monetization** → **Billing Settings**
2. **Enable billing**
3. **Connect Stripe:**
   - Development: Use "Clerk development gateway" for testing
   - Production: Connect your production Stripe account
4. Go to **Plans** → Create your subscription plans:
   - Example: "Pro Membership", "Founder Plan", etc.
5. Create a feature called **`premium_access`** (use exact name)
6. Add the `premium_access` feature to all paid plans

This ensures the `has({ feature: 'premium_access' })` check in `useSubscription.ts` works correctly.

#### 4.3. Configure Sign-In/Sign-Up

1. Go to **User & Authentication** → **Email, Phone, Username**
2. Configure your preferred sign-in methods
3. Set up any additional authentication providers (Google, GitHub, etc.)

### 5. Deploy

1. Click **Deploy** to trigger the initial deployment
2. Verify the deployment at your Vercel URL or custom domain

### 6. Testing Checklist

- [ ] Application loads with Clerk authentication
- [ ] Header shows "PLATFORM COACH"
- [ ] Blue gradient branding is applied
- [ ] Sign-in/sign-up flows work correctly
- [ ] Subscription status is detected correctly
- [ ] All pro features are accessible with active subscription
- [ ] PDF/CSV export works
- [ ] Save/load plans functionality works
- [ ] PWA installs correctly
- [ ] Offline functionality works

---

## Local Development

### Testing Free Version

1. Copy the free environment template:
   ```bash
   cp .env.example.free .env
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`

**Alternative:** Run directly without copying `.env`:
```bash
VITE_APP_MODE=free npm run dev
```

### Testing Paid Version

1. Copy the paid environment template:
   ```bash
   cp .env.example.paid .env
   ```

2. Add your Clerk test key:
   ```bash
   VITE_APP_MODE=paid
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`

**Alternative:** Run directly:
```bash
VITE_APP_MODE=paid VITE_CLERK_PUBLISHABLE_KEY=pk_test_... npm run dev
```

### Testing Both Versions Simultaneously

You can run both versions side-by-side in different terminals:

**Terminal 1 (Free):**
```bash
VITE_APP_MODE=free npm run dev -- --port 5173
```

**Terminal 2 (Paid):**
```bash
VITE_APP_MODE=paid VITE_CLERK_PUBLISHABLE_KEY=pk_test_... npm run dev -- --port 5174
```

Then access:
- Free version: `http://localhost:5173`
- Paid version: `http://localhost:5174`

---

## Continuous Deployment

Both Vercel projects are connected to the same GitHub repository. When you push to the main branch:

1. **Both deployments** will automatically trigger
2. Each deployment uses its own environment variables
3. Each builds with its respective `VITE_APP_MODE` setting

### Preview Deployments

Every pull request creates preview deployments for **both projects**:
- Platform Lifter preview: `platform-lifter-git-branch-name.vercel.app`
- Platform Coach preview: `platform-coach-git-branch-name.vercel.app`

Test both previews before merging to ensure the changes work correctly in both modes.

---

## Troubleshooting

### Free Version Issues

#### Blank White Screen
- Verify `VITE_APP_MODE=free` is set in Vercel environment variables
- Check browser console for errors
- Ensure no `VITE_CLERK_PUBLISHABLE_KEY` is set (should be absent)
- Redeploy after changing environment variables

#### Clerk Hook Errors
If you see errors like `useAuth can only be used within <ClerkProvider>`:
- Verify `VITE_APP_MODE` is exactly `free` (case-sensitive)
- Check `config.ts` is imported correctly in components
- Ensure all Clerk components are wrapped in `IS_PAID_VERSION` checks

#### Upgrade Modal Not Working
- Verify `VITE_UPGRADE_URL` is set correctly
- Check that upgrade modal handlers are in place for premium features
- Test clicking "Upgrade Now" redirects to the correct URL

### Paid Version Issues

#### Authentication Not Working
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Check Clerk Dashboard for allowed origins
- Ensure you're using `pk_live_...` in production, `pk_test_...` in dev
- Redeploy after changing environment variables

#### Subscription Detection Not Working
- Verify the `premium_access` feature exists in Clerk Dashboard
- Ensure the feature is added to your subscription plans
- Check user's subscription status in Clerk Dashboard
- Review `useSubscription.ts` logic

#### Build Errors
- Ensure `vite-env.d.ts` exists in project root
- Verify all dependencies are installed: `npm install`
- Check that `package-lock.json` is committed to the repository
- Clear build cache: `rm -rf node_modules dist && npm install`

### Both Versions

#### PWA Not Installing
- Verify `service-worker.ts` is being built correctly
- Check manifest.json is being served
- Test in production (PWA features may not work in development)
- Clear browser cache and try again

#### Environment Variables Not Taking Effect
- Environment variables are embedded at **build time**
- After changing variables in Vercel, you **must redeploy**
- Use Vercel's "Redeploy" button (don't just re-trigger via git push)

---

## Deployment Checklist

Before deploying to production, verify:

### Pre-Deployment
- [ ] All tests pass locally for both modes
- [ ] `.env.example.free` and `.env.example.paid` are up to date
- [ ] No sensitive keys in code (all in environment variables)
- [ ] `package-lock.json` is committed
- [ ] Both versions tested locally

### Platform Lifter (Free)
- [ ] Vercel project created
- [ ] `VITE_APP_MODE=free` environment variable set
- [ ] `VITE_UPGRADE_URL` set to `https://platformcoach.app`
- [ ] Custom domain configured
- [ ] Initial deployment successful
- [ ] All free features work correctly
- [ ] Upgrade modals redirect correctly
- [ ] No Clerk errors in console

### Platform Coach (Paid)
- [ ] Vercel project created
- [ ] `VITE_APP_MODE=paid` environment variable set
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set correctly for each environment
- [ ] Clerk allowed origins configured
- [ ] Clerk billing enabled and Stripe connected
- [ ] `premium_access` feature created and added to plans
- [ ] Custom domain configured
- [ ] Initial deployment successful
- [ ] Authentication flow works
- [ ] Subscription detection works
- [ ] All premium features accessible

### Post-Deployment
- [ ] Both deployments tested in production
- [ ] Analytics/monitoring configured
- [ ] Error tracking enabled (Sentry, LogRocket, etc.)
- [ ] Performance metrics reviewed
- [ ] DNS propagation complete for both domains
- [ ] PWA installation tested on mobile devices

---

## Advanced Configuration

### Custom Build Commands

If you need different build commands for each deployment:

**Platform Lifter:**
```json
{
  "build": "VITE_APP_MODE=free vite build"
}
```

**Platform Coach:**
```json
{
  "build": "VITE_APP_MODE=paid vite build"
}
```

Configure in Vercel → Settings → General → Build & Development Settings.

### Environment-Specific Optimizations

You can add conditional logic in `vite.config.ts` to optimize builds per mode:

```typescript
import { defineConfig } from 'vite';
const isPaidVersion = process.env.VITE_APP_MODE === 'paid';

export default defineConfig({
  build: {
    sourcemap: isPaidVersion, // Only include sourcemaps in paid version
  },
});
```

---

## Additional Resources

- **Dual Deployment Guide:** See `DUAL_DEPLOYMENT_GUIDE.md` for comprehensive setup instructions
- **Clerk Documentation:** https://clerk.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html

---

*This deployment guide is maintained alongside the application and should be updated when deployment procedures change.*
