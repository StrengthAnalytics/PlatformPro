# Freemium Implementation Guide

## Quick Start: What You Need to Know

**Bottom Line:** Platform Coach is perfectly positioned for a freemium model because:
1. 95% of business logic is tier-agnostic (calculator.ts, exportHandler.ts)
2. Competition Planner already has Lite/Pro modes (pattern exists)
3. SubscriptionGate component already exists but unused
4. PWA works offline (perfect for free tier)
5. Single repo is strongly recommended

**Effort Estimate:** 2-3 developer sprints for MVP freemium

---

## Architecture Decision: Single Repo vs. Two Repos

### Recommendation: SINGLE REPO (100% confidence)

**Why:**
```
Shared Code Analysis:
- calculator.ts (598 lines) - NO AUTH LOGIC NEEDED ✓
- exportHandler.ts (904 lines) - NO AUTH LOGIC NEEDED ✓
- constants.ts (1,500 lines) - NO AUTH LOGIC NEEDED ✓
- 41 components total
  - 5 need gating (SaveLoadSection, GameDayMode, VBT tools, etc.)
  - 36 work as-is (no changes needed)

Result: Only 5 components need conditional rendering
        Everything else works exactly the same
        Maintenance is 100% easier with one codebase
```

**Cost of Separate Repos (Not Recommended):**
- Duplicate calculator.ts, exportHandler.ts, constants.ts
- Separate builds, separate deployments
- Risk of divergence (bug in one doesn't fix other)
- User migration path unclear
- No clear winner for when to use which repo

---

## Phase 1: Auth Refactoring (Make Clerk Optional)

### Goal
Allow users to try free features WITHOUT signing into Clerk initially.

### Implementation

**Step 1: Modify index.tsx**

```typescript
// index.tsx - CURRENT
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

```typescript
// index.tsx - NEW (Conditional Clerk)
import { ClerkProvider } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppWrapper() {
  const [useClerk, setUseClerk] = useState(false);

  useEffect(() => {
    // Check if user has previously signed in or needs features requiring auth
    const hasSignedInBefore = localStorage.getItem('plp_hasSignedIn');
    const needsAuth = localStorage.getItem('plp_needsAuth');
    
    if (hasSignedInBefore || needsAuth) {
      setUseClerk(true);
    }
  }, []);

  if (!PUBLISHABLE_KEY && useClerk) {
    // Error handling for missing key
    return <div>Configuration Error: Missing Clerk key</div>;
  }

  return useClerk ? (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  ) : (
    <App /> // App works without Clerk!
  );
}

root.render(<AppWrapper />);
```

**Step 2: Update App.tsx to handle missing Clerk**

```typescript
// App.tsx
import { useAuth, useUser, SignedOut, SignedIn } from '@clerk/clerk-react';
import { useSubscription } from './hooks/useSubscription';

const App: React.FC = () => {
  const subscription = useSubscription();
  
  // Check if Clerk is available
  const clerkAvailable = (() => {
    try {
      // If we get here without error, Clerk is initialized
      useAuth(); // This will throw if not in ClerkProvider
      return true;
    } catch {
      return false;
    }
  })();

  // Rest of your component...
};
```

**Better approach: Create AuthContext**

```typescript
// AuthContext.tsx - NEW
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  subscription: SubscriptionData;
  user: any;
  clerkAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [clerkAvailable, setClerkAvailable] = useState(true);
  
  let auth, user, subscription;
  
  try {
    auth = useAuth();
    user = useUser();
    subscription = useSubscription();
  } catch {
    // Clerk not available, set defaults
    setClerkAvailable(false);
    auth = { isLoaded: true, isSignedIn: false };
    user = { user: null };
    subscription = { isFree: true, isPro: false, isLoading: false };
  }

  const value = {
    isSignedIn: auth?.isSignedIn ?? false,
    isLoading: auth?.isLoaded === false,
    subscription: subscription || { isFree: true, isPro: false },
    user: user?.user,
    clerkAvailable,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
```

---

## Phase 2: Define Permissions System

### Goal
Create a clean API for checking what user can access.

### Implementation

**Step 1: Extend useSubscription.ts**

```typescript
// hooks/useSubscription.ts - UPDATED
import { useAuth, useUser } from '@clerk/clerk-react';

export type SubscriptionTier = 'free_unauth' | 'free' | 'pro' | 'enterprise' | null;

interface SubscriptionData {
  tier: SubscriptionTier;
  isActive: boolean;
  isPro: boolean;
  isFree: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  
  // NEW: Permission flags (use these in components!)
  canSavePlans: boolean;
  canExportPDF: boolean;
  canExportCSV: boolean;
  canAccessGameDay: boolean;
  canAccessVBT: boolean;
  canAccessTechniqueScore: boolean;
  canAccessAdvancedTimer: boolean;
  canAccessTrainingLoad: boolean;
  canAccessProPlanner: boolean;
  maxSavedPlans: number; // free tier: 3, pro: unlimited
}

export function useSubscription(): SubscriptionData {
  const { has, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Determine tier
  let tier: SubscriptionTier;
  if (!isLoaded) {
    return {
      tier: null,
      isActive: false,
      isPro: false,
      isFree: false,
      isLoading: true,
      isSignedIn: false,
      // All permissions false during loading
      canSavePlans: false,
      canExportPDF: false,
      // ... rest false
    };
  }

  // Check if user signed in
  const userSignedIn = isSignedIn ?? false;

  // Check subscription status
  const hasManualFreeAccess = user?.publicMetadata?.freeAccess === true;
  const hasPremiumAccess = has ? has({ feature: 'premium_access' }) : false;
  const hasFreePlan = has ? has({ plan: 'free_plan' }) : false;
  const hasPaidPlan = hasPremiumAccess || 
                      (has ? has({ plan: 'standard_coaching_membership' }) : false) ||
                      (has ? has({ plan: 'free_trial_founder_price' }) : false);

  // Determine tier
  if (!userSignedIn) {
    tier = 'free_unauth'; // Unauthenticated free user
  } else if (hasPaidPlan || hasManualFreeAccess) {
    tier = 'pro'; // Signed in with paid plan
  } else if (hasFreePlan) {
    tier = 'free'; // Signed in with free plan
  } else {
    tier = 'free'; // Signed in but no explicit plan (default free)
  }

  // Define permissions based on tier
  const permissions = {
    free_unauth: {
      canSavePlans: false,
      canExportPDF: false,
      canExportCSV: false,
      canAccessGameDay: false,
      canAccessVBT: false,
      canAccessTechniqueScore: false,
      canAccessAdvancedTimer: false,
      canAccessTrainingLoad: false,
      canAccessProPlanner: false,
      maxSavedPlans: 0,
    },
    free: {
      canSavePlans: true,
      canExportPDF: true, // Once per session
      canExportCSV: false,
      canAccessGameDay: false,
      canAccessVBT: false,
      canAccessTechniqueScore: false,
      canAccessAdvancedTimer: false,
      canAccessTrainingLoad: false,
      canAccessProPlanner: false,
      maxSavedPlans: 3,
    },
    pro: {
      canSavePlans: true,
      canExportPDF: true,
      canExportCSV: true,
      canAccessGameDay: true,
      canAccessVBT: true,
      canAccessTechniqueScore: true,
      canAccessAdvancedTimer: true,
      canAccessTrainingLoad: true,
      canAccessProPlanner: true,
      maxSavedPlans: Infinity,
    },
  };

  const perms = permissions[tier as keyof typeof permissions] || permissions.free_unauth;

  return {
    tier,
    isActive: tier === 'pro',
    isPro: tier === 'pro',
    isFree: tier === 'free' || tier === 'free_unauth',
    isLoading: false,
    isSignedIn: userSignedIn,
    ...perms,
  };
}
```

**Step 2: Use permissions in components**

```typescript
// Example in SaveLoadSection.tsx
import { useSubscription } from '../hooks/useSubscription';

function SaveLoadSection() {
  const subscription = useSubscription();
  
  return (
    <>
      {subscription.canSavePlans ? (
        <>
          <button onClick={handleSave}>Save Plan</button>
          <button onClick={handleSaveAs}>Save As...</button>
        </>
      ) : (
        <SubscriptionGate 
          requiredTier="pro"
          onUpgrade={() => {
            localStorage.setItem('plp_needsAuth', 'true');
            // Redirect to sign-up or pricing
          }}
        >
          <button disabled>Save Plan (Pro Feature)</button>
        </SubscriptionGate>
      )}
    </>
  );
}
```

---

## Phase 3: Gate Key Components

### Components Needing Gating

**Must Gate:**
1. `SaveLoadSection.tsx` - Save/Load functionality
2. `GameDayMode.tsx` - High-contrast competition mode
3. `VelocityProfileGenerator.tsx` - VBT tools
4. `TechniqueScoreCalculator.tsx` - Tech score
5. Export buttons in various components

**Pattern to Use:**

```typescript
// Pattern: Conditional with SubscriptionGate overlay
{subscription.canAccessGameDay ? (
  <button onClick={() => setIsGameDayModeActive(true)}>
    Launch Game Day Mode
  </button>
) : (
  <SubscriptionGate 
    requiredTier="pro"
    onUpgrade={handleUpgradeClick}
  >
    <button disabled>
      Launch Game Day Mode
    </button>
  </SubscriptionGate>
)}
```

**OR Pattern: Inline message (less disruptive)**

```typescript
{!subscription.canAccessGameDay && (
  <div className="bg-blue-50 p-4 rounded-lg mb-4">
    <p className="text-sm text-blue-900">
      Game Day Mode is a Pro feature. 
      <button onClick={handleUpgrade} className="font-semibold underline ml-1">
        Upgrade now
      </button>
    </p>
  </div>
)}
```

### Lite Mode Features (Free Tier Versions)

**Competition Planner Lite** (ALREADY EXISTS)
- Quick plan generator
- No saving required
- Already in `/components/LiteModeView.tsx`
- Keep as-is!

**1RM Calculator Lite** (NEW)
```typescript
// OneRepMaxCalculator.tsx - Add lite mode toggle
import { useSubscription } from '../hooks/useSubscription';

const OneRepMaxCalculator = () => {
  const subscription = useSubscription();
  const [useLiteMode, setUseLiteMode] = useState(!subscription.isPro);
  
  const formulas = subscription.isPro 
    ? ['epley', 'brzycki', 'strength_analytics', 'lombardi']
    : ['strength_analytics']; // Free tier: single formula only
  
  // Rest of component uses formulas array
};
```

**Workout Timer Lite** (NEW)
```typescript
// WorkoutTimer.tsx - Restrict to basic modes for free
const modes = subscription.isPro 
  ? ['interval', 'rolling', 'manual'] 
  : ['rolling', 'manual']; // Free: no custom intervals

// Don't show "Create Custom" button for free users
{subscription.isPro && <button>Create Custom Preset</button>}
```

---

## Phase 4: Clerk Dashboard Setup

### Step-by-Step Clerk Configuration

1. **Go to Clerk Dashboard** → Your Application

2. **Enable Billing:**
   - Navigate to `Monetization` → `Billing`
   - Click "Enable Billing"
   - Connection Stripe (test or production)

3. **Create Plans:**
   - Go to `Monetization` → `Plans`
   - Create: `free_plan`
   - Create: `pro_plan` 
   - Create: `enterprise_plan` (optional, for future)

4. **Create Feature:**
   - Go to `Monetization` → `Features`
   - Create: `premium_access`
   - Add to `pro_plan` and `enterprise_plan`
   - Do NOT add to `free_plan`

5. **Add to Organizations (if applicable):**
   - Some setups require adding plans to org settings
   - Follow Clerk docs for your specific version

6. **Set Allowed Origins:**
   - Go to `Settings` → `URLs`
   - Add your Vercel deployment URL
   - Add localhost for testing

### Verification Query

```typescript
// Test in browser console
import { useAuth } from '@clerk/clerk-react';

const { has } = useAuth();
console.log('Premium access?', has({ feature: 'premium_access' }));
console.log('Free plan?', has({ plan: 'free_plan' }));
console.log('Pro plan?', has({ plan: 'pro_plan' }));
```

---

## Phase 5: Testing Checklist

### Free Tier (Unauthenticated)
- [ ] App loads without Clerk
- [ ] Competition Planner Lite works
- [ ] Workout Timer (basic modes) works
- [ ] Warm-up Generator works
- [ ] 1RM Calculator (single formula) works
- [ ] Can't see Save Plan button
- [ ] Can't export PDF
- [ ] Offline works (PWA)
- [ ] Upgrade CTAs visible

### Free Tier (Signed In)
- [ ] User can sign in
- [ ] Free plan auto-created
- [ ] Can save 3 plans (count increases)
- [ ] 4th save shows upgrade CTA
- [ ] Can export 1 PDF
- [ ] 2nd PDF export shows upgrade CTA
- [ ] Can't see Pro-only features

### Pro Tier
- [ ] User can upgrade to pro plan
- [ ] Subscription check works
- [ ] All features unlock
- [ ] Game Day Mode available
- [ ] VBT tools available
- [ ] Can save unlimited plans
- [ ] Can export unlimited PDFs/CSVs

### Migration
- [ ] Existing users (v1) get Pro access automatically
- [ ] Their localStorage plans still work
- [ ] No data loss
- [ ] No forced re-authentication

---

## Key Files Modified Summary

### Files That Change
```
index.tsx                  - Make Clerk conditional
App.tsx                    - Use new permission system
hooks/useSubscription.ts   - Add permission flags
components/SaveLoadSection.tsx     - Gate save buttons
components/GameDayMode.tsx         - Gate entire component
components/OneRepMaxCalculator.tsx - Lite version for free
components/WorkoutTimer.tsx        - Gate advanced modes
components/VelocityProfileGenerator.tsx  - Gate entirely
components/TechniqueScoreCalculator.tsx  - Gate entirely
```

### Files That Don't Change
```
calculator.ts    - No changes needed (tier-agnostic)
exportHandler.ts - No changes needed (gated at call site)
constants.ts     - No changes needed (tier-agnostic)
36+ other components - No changes needed
```

**Total Impact: ~6 modified files, ~5 new permission checks, ~200 lines of new code**

---

## Deployment

### Environment Variables (No New Ones Needed)
```
VITE_CLERK_PUBLISHABLE_KEY  # Already exists
```

### Vercel Deployment
1. No changes needed (same single deployment)
2. Rebuild after Clerk plans created
3. Test in staging first

### Monitoring
- Track free vs. pro signups
- Track upgrade conversion rate
- Monitor offline functionality
- Check localStorage usage

---

## Future Enhancements (Post-MVP)

**Phase 6: Cloud Sync (Optional)**
- Add backend API for plan storage
- Sync plans across devices for signed-in users
- Fallback to localStorage if offline

**Phase 7: Advanced Free Tier Limits**
- Time-based trial (e.g., 14-day free trial)
- Usage limits (e.g., 5 exports per month)
- Feature trials before upgrade

**Phase 8: Upsell & Analytics**
- Track when users hit limits
- Show upgrade prompts at key moments
- Analytics on conversion funnel

---

## Quick Reference: Permission Mapping

| Feature | Free (Unauth) | Free (Auth) | Pro |
|---------|---------------|------------|-----|
| canSavePlans | false | true | true |
| canExportPDF | false | true (1x) | true |
| canExportCSV | false | false | true |
| canAccessGameDay | false | false | true |
| canAccessVBT | false | false | true |
| canAccessTechniqueScore | false | false | true |
| canAccessAdvancedTimer | false | false | true |
| canAccessTrainingLoad | false | false | true |
| canAccessProPlanner | false | false | true |
| maxSavedPlans | 0 | 3 | unlimited |

---

## Support & Troubleshooting

**"User can access Pro features without paying"**
- Check useSubscription.ts permission flags
- Verify Clerk plan is assigned in dashboard
- Test with incognito window (clear cache)

**"Offline doesn't work"**
- Service worker needs reregistration
- Clear cache, reload
- Check manifest.json PWA config

**"Clerk is undefined"**
- Verify ClerkProvider wraps component
- Check VITE_CLERK_PUBLISHABLE_KEY exists
- Use try/catch in custom hooks

**"Existing users lost access"**
- Manually set publicMetadata.freeAccess = true
- Or assign them to pro_plan in Clerk
- Migration script can do this in bulk

---

## Success Metrics

Track these after launch:
1. **Free signup rate** vs. paid signup rate
2. **Conversion rate** (free → pro)
3. **Feature adoption** by tier (which tools are used most?)
4. **Offline usage** percentage (PWA advantage)
5. **Payment success rate** (no declined cards)
6. **Support ticket volume** (expect increase)

