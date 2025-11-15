# Dual Deployment Guide: Platform Lifter (Free) + Platform Coach (Paid)

This guide explains how to deploy two versions of the application from a single repository:
- **Platform Lifter** (free version, no authentication)
- **Platform Coach** (paid version, full authentication & features)

## Architecture Overview

```
Single GitHub Repository
│
├─ Vercel Project 1: "platform-lifter" → PlatformLifter.app
│  └─ ENV: VITE_APP_MODE=free
│     ├─ No Clerk authentication
│     ├─ Orange gradient background
│     ├─ Free features enabled
│     └─ Pro features show upgrade modals
│
└─ Vercel Project 2: "platform-coach" → YourDomain.com
   └─ ENV: VITE_APP_MODE=paid
      ├─ Clerk authentication required
      ├─ Blue gradient background (existing)
      ├─ Full subscription gating
      └─ All features unlocked for paid users
```

## Prerequisites

1. **GitHub Repository**: Your existing Platform Coach repository
2. **Vercel Account**: Single account can host both projects
3. **Clerk Account**: Only needed for paid version
4. **Domain Names**:
   - PlatformLifter.app (free version)
   - Your existing domain (paid version)

---

## Part 1: Deploy Free Version (Platform Lifter)

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your existing GitHub repository
4. **Important**: Give it a different name: `platform-lifter`

### Step 2: Configure Build Settings

**Framework Preset**: Vite
**Root Directory**: `./` (leave as root)
**Build Command**: `npm run build` (default)
**Output Directory**: `dist` (default)

### Step 3: Set Environment Variables

Click "Environment Variables" and add:

```
VITE_APP_MODE=free
VITE_UPGRADE_URL=https://yourdomain.com/pricing
```

**Important**: Do NOT add `VITE_CLERK_PUBLISHABLE_KEY` for the free version.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test the deployed URL (will be something like `platform-lifter.vercel.app`)

### Step 5: Add Custom Domain

1. In Vercel project settings, go to "Domains"
2. Add your domain: `platformlifter.app`
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

### Step 6: Test Free Version

Visit `platformlifter.app` and verify:
- ✅ App loads without authentication
- ✅ Orange gradient background appears
- ✅ Page title shows "Platform Lifter"
- ✅ Free features work (Comp Planner Lite, Timer, Warmup Gen, 1RM Calc)
- ✅ Pro features show "Upgrade" modals (when clicking save, export, etc.)
- ✅ "Upgrade" button redirects to Platform Coach pricing page

---

## Part 2: Update Paid Version (Platform Coach)

### Step 1: Update Existing Vercel Project

1. Go to your existing Vercel project (Platform Coach)
2. Navigate to "Settings" → "Environment Variables"

### Step 2: Add Environment Variable

Add the following variable:

```
VITE_APP_MODE=paid
```

Your existing `VITE_CLERK_PUBLISHABLE_KEY` should remain as-is.

### Step 3: Redeploy

1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" is UNCHECKED (to ensure new env var is picked up)
5. Click "Redeploy"

### Step 4: Test Paid Version

Visit your paid site and verify:
- ✅ App requires sign-in (existing behavior)
- ✅ Blue gradient background appears
- ✅ Page title shows "Platform Coach"
- ✅ Subscription gating works as before
- ✅ All features unlock for paid users

---

## Part 3: Ongoing Maintenance

### Making Code Changes

1. **Develop on main branch** (or feature branches)
2. **Push to GitHub**: Both Vercel projects auto-deploy from the same repo
3. **Both sites update automatically**: They run the same code, just different environment variables

### Different Behavior Per Site

The `VITE_APP_MODE` environment variable controls:
- Which authentication flow to use (Clerk vs none)
- Which branding to show (orange vs blue)
- Which features to gate (upgrade modals vs subscription checks)

All logic is in these files:
- `config.ts` - Centralized configuration
- `index.tsx` - Conditional Clerk loading
- `App.tsx` - Conditional rendering of auth flows
- `components/UpgradeModal.tsx` - Free version upgrade prompts

### Testing Locally

**To test free version locally:**
```bash
# Create .env.local file
echo "VITE_APP_MODE=free" > .env.local
echo "VITE_UPGRADE_URL=http://localhost:3001/pricing" >> .env.local

npm run dev
```

**To test paid version locally:**
```bash
# Create .env.local file
echo "VITE_APP_MODE=paid" > .env.local
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY" >> .env.local

npm run dev
```

---

## Part 4: Feature Gating Strategy

### Free Version Features

These features work without authentication:
- ✅ Competition Planner Lite
- ✅ Workout Timer (basic modes)
- ✅ Warm-up Generator
- ✅ 1RM Calculator (basic formulas)
- ✅ Velocity Profile Test
- ✅ PWA offline capability

### Pro Features (Require Upgrade)

These features show "Upgrade" modals in free version:
- 🔒 Save plans
- 🔒 Export to PDF/CSV
- 🔒 Game Day Mode
- 🔒 Competition Planner Pro
- 🔒 1RM Calculator (Training Load)
- 🔒 Velocity Profile Generate
- 🔒 Technique Score Calculator
- 🔒 Custom timer presets

### Implementing Feature Gates

**For free version**, wrap pro features with upgrade modals:

```tsx
import { IS_FREE_VERSION } from '../config';
import UpgradeModal from './UpgradeModal';

function ProFeature() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleClick = () => {
    if (IS_FREE_VERSION) {
      setShowUpgrade(true);
      return;
    }
    // Normal pro feature logic
  };

  return (
    <>
      <button onClick={handleClick}>
        Pro Feature {IS_FREE_VERSION && '🔒'}
      </button>

      {IS_FREE_VERSION && (
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          featureName="Pro Feature Name"
          featureDescription="Description of what this unlocks"
        />
      )}
    </>
  );
}
```

**For paid version**, use existing subscription gating:

```tsx
const { isPro } = useSubscription();

if (!isPro) {
  return <SubscriptionGate featureName="Pro Feature" />;
}
```

---

## Part 5: Vercel Configuration Reference

### Free Version (PlatformLifter.app)

**Project Name**: `platform-lifter`
**Git Branch**: `main` (or your default branch)
**Environment Variables**:
```
VITE_APP_MODE=free
VITE_UPGRADE_URL=https://platformcoach.com/pricing
```
**Domains**: `platformlifter.app`

### Paid Version (Platform Coach)

**Project Name**: `platform-coach` (or your existing project name)
**Git Branch**: `main` (or your default branch)
**Environment Variables**:
```
VITE_APP_MODE=paid
VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
```
**Domains**: Your existing domain(s)

---

## Part 6: Troubleshooting

### Issue: Free version still shows sign-in

**Cause**: `VITE_APP_MODE` not set correctly
**Fix**:
1. Check Vercel environment variables
2. Ensure value is exactly `free` (lowercase, no quotes)
3. Redeploy without build cache

### Issue: Paid version doesn't require authentication

**Cause**: `VITE_APP_MODE` set to `free` instead of `paid`
**Fix**:
1. Update environment variable to `paid`
2. Redeploy without build cache

### Issue: Wrong colors/branding

**Cause**: Environment variable not picked up during build
**Fix**:
1. Clear build cache in Vercel
2. Redeploy
3. Check browser cache (hard refresh: Ctrl+Shift+R)

### Issue: Changes not reflecting

**Cause**: Build cache or CDN cache
**Fix**:
1. Redeploy without build cache
2. Wait a few minutes for CDN propagation
3. Hard refresh browser

### Issue: Upgrade modal not showing

**Cause**: `UpgradeModal` component not imported/used
**Fix**:
1. Import `UpgradeModal` in your component
2. Add state: `const [showUpgrade, setShowUpgrade] = useState(false)`
3. Render modal conditionally: `{IS_FREE_VERSION && <UpgradeModal ... />}`

---

## Part 7: Testing Checklist

### Before Launch: Free Version

- [ ] App loads without requiring sign-in
- [ ] Orange gradient background displays
- [ ] Title shows "Platform Lifter"
- [ ] Theme color is orange (#f97316)
- [ ] Competition Planner Lite works
- [ ] Workout Timer works
- [ ] Warm-up Generator works
- [ ] 1RM Calculator works (basic)
- [ ] Velocity Profile Test works
- [ ] Save button shows upgrade modal
- [ ] Export PDF shows upgrade modal
- [ ] Game Day Mode shows upgrade modal
- [ ] Upgrade button redirects to Platform Coach
- [ ] PWA installation works
- [ ] Offline mode works
- [ ] Mobile responsive

### Before Launch: Paid Version

- [ ] Sign-in required for access
- [ ] Blue gradient background displays
- [ ] Title shows "Platform Coach"
- [ ] Theme color is blue (#0066ff)
- [ ] Subscription check works
- [ ] Free users see pricing page
- [ ] Pro users see full app
- [ ] All features unlock for pro users
- [ ] Save/load plans works
- [ ] PDF/CSV export works
- [ ] Game Day Mode works
- [ ] VBT tools work
- [ ] Billing integration works
- [ ] Existing users keep access
- [ ] PWA installation works
- [ ] Mobile responsive

---

## Part 8: Monitoring & Analytics

### Key Metrics to Track

**Free Version (PlatformLifter.app)**:
- Daily active users
- Upgrade button clicks
- Most used features
- Bounce rate
- Time on site

**Paid Version (Platform Coach)**:
- New signups
- Subscription conversions
- Churn rate
- Feature adoption
- Monthly Recurring Revenue (MRR)

### Recommended Tools

- **Vercel Analytics**: Built-in, track both deployments
- **Google Analytics**: Add GA4 to both sites with different property IDs
- **PostHog** or **Mixpanel**: Track feature usage and funnels
- **Clerk Dashboard**: Monitor auth and subscription metrics (paid version only)

---

## Part 9: Future Enhancements

### Separate Manifest Files

Currently both versions share `manifest.json`. For better branding:

1. Create `public/manifest-free.json` for Platform Lifter
2. Create `public/manifest-paid.json` for Platform Coach
3. Dynamically serve based on APP_MODE in Vite config

### Feature Flag System

For more granular control:

```typescript
// config.ts
export const FEATURE_FLAGS = {
  savePlans: IS_PAID_VERSION,
  exportPdf: IS_PAID_VERSION,
  gameDayMode: IS_PAID_VERSION,
  // ... etc
};
```

### A/B Testing

Test different upgrade messaging:

```typescript
const upgradeMessages = [
  'Unlock all features',
  'Save your plans',
  'Export to PDF'
];
```

---

## Part 10: Support & Resources

### Documentation
- This guide: `DUAL_DEPLOYMENT_GUIDE.md`
- Architecture docs: `FREEMIUM_ARCHITECTURE.md`
- Implementation guide: `FREEMIUM_IMPLEMENTATION_GUIDE.md`

### Key Files
- `config.ts` - Environment configuration
- `index.tsx` - Conditional Clerk loading
- `App.tsx` - Conditional auth flows
- `components/UpgradeModal.tsx` - Upgrade prompts

### External Resources
- [Vercel Docs](https://vercel.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Summary

You now have:
- ✅ Single codebase deploying to two different sites
- ✅ Free version (Platform Lifter) with no auth, orange branding
- ✅ Paid version (Platform Coach) with Clerk auth, blue branding
- ✅ Easy maintenance (fix bugs once, both sites benefit)
- ✅ Clear upgrade path from free to paid
- ✅ Separate domains for brand differentiation

**Next Steps**:
1. Deploy free version to Vercel
2. Configure custom domain (PlatformLifter.app)
3. Update paid version with APP_MODE env var
4. Test both sites thoroughly
5. Monitor metrics and iterate

Good luck with your launch! 🚀
