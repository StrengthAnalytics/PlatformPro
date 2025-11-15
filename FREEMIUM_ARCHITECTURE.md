# Platform Coach - Freemium Architecture Analysis

## EXECUTIVE SUMMARY

Platform Coach is a **client-side React PWA** (Progressive Web App) built with Vite, TypeScript, and Clerk authentication. The current architecture has existing subscription gating implemented using Clerk Billing. To implement a freemium model with a free version accessible without authentication, you have **two viable approaches**: (1) Single repo with conditional feature gating (recommended), or (2) Separate repos for free and paid versions.

---

## 1. CURRENT ARCHITECTURE

### 1.1 Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 (not Next.js)
- **Styling**: Tailwind CSS (via CDN)
- **Authentication**: Clerk (Email/Social)
- **Subscription Billing**: Clerk Billing with Stripe integration
- **PWA**: Service Worker for offline capability
- **PDF/Export**: jsPDF + jspdf-autotable
- **Hosting**: Vercel deployment-ready
- **State Management**: React hooks (centralized in App.tsx)
- **Data Persistence**: localStorage (no backend database)

### 1.2 Project Structure

```
/PlatformPro
├── index.tsx              # Clerk setup & PWA registration
├── index.html             # Tailwind config via CDN
├── App.tsx                # Root component (977 lines) - all state & routing
├── types.ts               # TypeScript interfaces
├── state.ts               # Initial state defaults
├── constants.ts           # Business logic constants (attempt strategies, warmups)
├── /components            # 41 React components
│   ├── Homescreen.tsx
│   ├── LiteModeView.tsx   # Lite mode for Competition Planner
│   ├── LiteModePlanDisplay.tsx
│   ├── OneRepMaxCalculator.tsx
│   ├── WorkoutTimer.tsx
│   ├── WarmupGenerator.tsx
│   ├── VelocityProfileGenerator.tsx
│   ├── TechniqueScoreCalculator.tsx
│   ├── SubscriptionGate.tsx       # Feature gating component
│   ├── EmailGate.tsx              # Old email-based access (Kajabi integration)
│   ├── PricingPage.tsx            # Clerk PricingTable
│   ├── GameDayMode.tsx
│   ├── SaveLoadSection.tsx
│   ├── BrandingSection.tsx
│   └── ...more components
├── /hooks
│   └── useSubscription.ts # Clerk subscription checking hook
├── /utils
│   ├── calculator.ts      # Business logic (attempts, warmups, scoring)
│   ├── exportHandler.ts   # PDF, CSV, file export logic
│   └── migration.ts       # localStorage state versioning
├── /public
│   ├── manifest.json      # PWA configuration
│   └── service-worker.ts  # Offline caching
├── vite.config.ts         # Vite + PWA plugin config
├── package.json           # Clerk, jsPDF, Vite dependencies
├── DEPLOYMENT.md          # Vercel & Clerk setup guide
└── README.md              # Comprehensive documentation
```

### 1.3 Authentication Flow (Current)

```
User lands on app
  ↓
ClerkProvider wraps entire app
  ↓
Checks VITE_CLERK_PUBLISHABLE_KEY environment variable
  ↓
If signed out → Shows welcome page with Sign In/Sign Up
  ↓
If signed in → Shows homescreen with all tools
  ↓
useSubscription hook checks:
  - Clerk Billing (has({ feature: 'premium_access' }))
  - Specific plans (free_plan, standard_coaching_membership, etc.)
  - Manual free access (publicMetadata.freeAccess = true)
  ↓
All signed-in users currently get access to ALL features
```

---

## 2. FEATURES & TOOLS BREAKDOWN

### 2.1 Competition Planner (Pro & Lite modes)

**Pro Mode Features:**
- Save/Load multiple plans (localStorage)
- Import/Export plans (.plp files)
- Full competition details (lifter name, event, date, weight class, etc.)
- Equipment settings per lift (rack heights, etc.)
- Branding customization (logo, colors for PDF)
- Attempt strategy selection (Aggressive, Stepped, Conservative)
- Automatic warm-up generation (Default or Dynamic)
- Game Day Mode (high-contrast, full-screen)
- PDF export (desktop & mobile optimized)
- CSV export
- Personal bests tracking
- Coaching notes

**Lite Mode Features:**
- Quick plan generator (seconds to complete)
- Only requires: lifter name + 3rd attempt for each lift
- Auto-calculates openers & warm-ups (always aggressive strategy)
- Generates simplified unbranded PDF
- No save functionality

**Files:**
- `/components/LiftSection.tsx` (20KB) - Pro mode lift input
- `/components/LiteModeView.tsx` (6.7KB) - Lite mode entry
- `/components/LiteModePlanDisplay.tsx` (5.5KB) - Lite results display
- `/components/GameDayMode.tsx` (16.9KB) - High-contrast mode

### 2.2 Workout Timer

**Capabilities:**
- Rolling Rest mode (auto-countdown for sets)
- Manual Rest mode (user-started timer)
- Customizable alert timings (10s, 3s, 2s, 1s beeps)
- Mobile-friendly tumbler picker UI
- Save timer presets to localStorage
- Export/Import presets (.sctt files)
- Audio playback with configurable volume

**Files:**
- `/components/WorkoutTimer.tsx` (87KB) - Feature-rich timer with multiple modes

### 2.3 1RM Calculator & Training Load

**1RM Features:**
- Blended formula (combines Epley, Brzycki, etc.) called "Strength Analytics Formula"
- Outputs 1RM estimate
- Full training zone table (reps 1-15 at various intensities)
- PDF export
- CSV export

**Training Load Features:**
- Calculates recommended training weight
- Based on estimated 1RM, sets, reps, intensity (RIR/RPE)
- Fatigue accumulation modeling

**Files:**
- `/components/OneRepMaxCalculator.tsx` (38.6KB) - Combined 1RM + Training Load

### 2.4 Warm-up Generator (Standalone)

**Features:**
- Generates warm-up progression for any target weight
- Default warm-up tables (pre-tested)
- Dynamic warm-up (custom sets, start weight, final percentage)
- Plate breakdown calculation (what weights to load)
- Supports kg/lbs
- Collar inclusion option
- PDF export

**Files:**
- `/components/WarmupGenerator.tsx` (15.4KB)
- `/components/WarmupResultDisplay.tsx` (5.5KB)

### 2.5 Velocity Profile Generator

**Two modes for VBT coaching:**

1. **Generate Profile (Coach):** Create full RIR-based velocity profile from test data
   - Input lifter info, test data, actual velocities
   - Can import athlete's .vbt test file
   - Outputs RIR-based velocity profile
   - PDF export

2. **Complete Test (Athlete):** Guided VBT testing walkthrough
   - Athlete enters exercise and estimated 1RM
   - App generates recommended warm-up
   - Perform heavy single, record velocity
   - Perform 4 back-off sets (AMRAP), record velocities
   - Export as .vbt file for coach

**Files:**
- `/components/VelocityProfileGenerator.tsx` (31.9KB)

### 2.6 Technique Score Calculator

**Features:**
- Calculates Coefficient of Variation (CV%) from velocities of 3-5 heavy singles
- Quantifies technical consistency under load
- Outputs: CV%, qualitative rating (Excellent/Good/Needs Improvement), training implications
- PDF export

**Files:**
- `/components/TechniqueScoreCalculator.tsx` (16.8KB)

---

## 3. CURRENT SUBSCRIPTION GATING

### 3.1 Clerk Setup

**Files Involved:**
- `/hooks/useSubscription.ts` (68 lines) - Main subscription checking hook
- `/components/SubscriptionGate.tsx` (59 lines) - Feature gating UI component
- `/index.tsx` - ClerkProvider initialization

### 3.2 Subscription Checking Logic

```typescript
// From /hooks/useSubscription.ts
export function useSubscription(): SubscriptionData {
  const { has, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return { tier: null, isActive: false, isPro: false, ... };

  // Check manual free access via publicMetadata
  const hasManualFreeAccess = user?.publicMetadata?.freeAccess === true;

  // Check Clerk Billing feature
  const hasPremiumAccess = has({ feature: 'premium_access' });

  // Fallback: Check specific plans
  const hasFounderPlan = has({ plan: 'free_trial_founder_price' });
  const hasStandardPlan = has({ plan: 'standard_coaching_membership' });
  const hasFreePlan = has({ plan: 'free_plan' });

  const hasAccess = hasPremiumAccess || hasFounderPlan || hasStandardPlan || hasFreePlan || hasManualFreeAccess;

  return {
    tier: hasAccess ? 'pro' : 'free',
    isActive: hasAccess,
    isPro: hasAccess,
    isEnterprise: false,
    isFree: !hasAccess,
    isLoading: false,
  };
}
```

### 3.3 Current Authentication & Authorization

**In App.tsx:**

```typescript
<SignedOut>
  {/* Welcome page with Sign In/Sign Up buttons */}
  {/* Currently shows unauthenticated landing page */}
</SignedOut>

<SignedIn>
  {/* All tools and features */}
  {subscription.isPro && <button>Show Pro Badge</button>}
</SignedIn>
```

**Current Status:**
- All signed-in users have access to ALL features
- SubscriptionGate component exists but is NOT currently used anywhere
- EmailGate component exists (old Kajabi integration, deprecated)

---

## 4. DATA & STATE MANAGEMENT

### 4.1 State Structure

```typescript
// From /state.ts
export const initialAppState: AppState = {
  version: 1,
  details: {
    lifterName, eventName, weightClass, competitionDate, weighInTime,
    bodyWeight, gender, scoringFormula: 'ipfgl', unit: 'kg', attemptStrategy: 'aggressive'
  },
  equipment: {
    squatRackHeight, squatStands, benchRackHeight, handOut, benchSafetyHeight
  },
  branding: {
    logo: '', // base64 encoded image
    primaryColor: '#111827', // slate-900
    secondaryColor: '#1e293b', // slate-800
  },
  lifts: {
    squat: { attempts: {...}, warmups: [...], cues: [...], ... },
    bench: { ... },
    deadlift: { ... }
  },
  personalBests: { squat, bench, deadlift },
  gameDayState: { ... } // Game Day Mode local state
};
```

### 4.2 Persistence

**localStorage Keys:**
- `plp_allPlans` - All saved competition plans (object)
- `plp_details`, `plp_equipment`, `plp_branding` - Last-used settings
- `plp_personalBests` - Lifter personal records
- `plp_theme` - Light/dark mode preference
- `plp_planInLbs` - Units preference
- `plp_coachingMode` - Coaching mode toggle
- `plp_autoGenerateWarmups` - Auto-generate preference
- `workout_timers` - Saved timer presets
- Plus internal state for UI preferences (mobile summary, etc.)

**No backend database** - Everything stored client-side in localStorage and browser data.

### 4.3 File-Based Data

Users can export/import:
- `.plp` files (plans) - JSON format, complete plan data
- `.sctt` files (timers) - JSON format, timer presets
- `.vbt` files (VBT test data) - JSON format, velocity data

---

## 5. BUSINESS LOGIC (Calculator Utilities)

### 5.1 Key Utilities (calculator.ts - 598 lines)

**Attempt Calculations:**
- `calculateAttempts()` - Generates 2nd and 3rd attempts from opener OR generates opener/2nd from goal 3rd
- Three strategies: Aggressive, Stepped, Conservative
- Enforces: strictly increasing attempts, jump rule (jump1 >= jump2)
- Rounds to nearest 2.5kg

**Warm-up Generation:**
- `generateWarmups()` - Uses pre-tested warm-up tables (SQUAT_WARMUPS, etc.)
- `generateCustomWarmups()` - Dynamic warm-up with custom parameters
- Calculates plate breakdowns (what plates to load)

**Scoring:**
- `calculateScore()` - IPF GL, Wilks, or DOTS formulas
- Supports male/female, all weight classes
- Used for competition predictions

**Conversions:**
- `kgToLbs()`, `lbsToKg()` - Unit conversions with rounding
- `getPlateBreakdown()` - Shows exact plates needed for any weight

### 5.2 Export Logic (exportHandler.ts - 904 lines)

Handles all file creation:
- **PDF Export:** Desktop & mobile optimized using jsPDF + jspdf-autotable
- **CSV Export:** All plan data in spreadsheet format
- **Plan Export:** .plp files (JSON)
- **VBT Export:** .vbt files for velocity data
- **Branding Integration:** Custom logos, colors in PDFs

---

## 6. DEPLOYMENT & ENVIRONMENT

### 6.1 Current Deployment

**Platform:** Vercel
**Environment Variables:**
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key

**Build:**
- `npm run build` - TypeScript + Vite build
- Output: Static files in `/dist` folder
- No server-side code required

**PWA Configuration:**
- Service worker caches application assets
- Works fully offline after first load
- Checks for updates every hour

### 6.2 Clerk Setup Required

In Clerk Dashboard:
1. Create application
2. Enable Clerk Billing
3. Connect Stripe (development or production)
4. Create subscription plans
5. Create `premium_access` feature
6. Add feature to all paid plans
7. Add Vercel deployment URL to allowed origins

---

## 7. ANALYSIS: FREE VERSION STRATEGY

### 7.1 Current Pain Points for Freemium

1. **All authentication is tied to Clerk** - No way to use app without signing up
2. **No feature-level gating** - SubscriptionGate exists but isn't used
3. **All data in localStorage** - No user accounts or cloud sync
4. **No free plan defined** - Users must authenticate to access anything
5. **PWA offline capability underutilized** - Perfect for free tier

### 7.2 Feature Gating Options

**Option A: Lite Versions for Free Tier**
- Competition Planner Lite (already exists!) - generate quick plans, no save
- 1RM Calculator basic - single formula, no training load
- Warm-up Generator - full featured
- Workout Timer - full featured
- No Game Day Mode, no PDF export, no saving

**Option B: Full Features with Usage Limits**
- Allow all tools in free tier
- Limit: can't save plans (localStorage disabled in free mode)
- Limit: can't export to PDF/CSV
- Limit: up to 3 saved plans

**Option C: Tool Availability Tiers**
- Free: Competition Planner Lite, Workout Timer, Warm-up Generator
- Pro: Everything + Game Day Mode + PDF/CSV exports + Plan saving
- Enterprise: Custom coaching features + API access

**Recommended: Hybrid Approach (A + B)**
- Free tier gets: Lite Planner, Timer, Warm-up Gen, Basic 1RM
- Can use without authentication
- Can export PDF/CSV once, but no saving
- Pro tier gets: Full Planner, Training Load, VBT tools, Technique Score, saving, Game Day

---

## 8. SINGLE REPO VS. SEPARATE REPOS

### 8.1 RECOMMENDATION: Single Repo with Feature Gating

**Why:**
1. **Shared business logic** - calculator.ts, exportHandler.ts don't care about authentication
2. **Minimal code duplication** - Only UI differs based on tier
3. **Easier maintenance** - One deployment, one codebase
4. **Existing pattern** - Already have Lite/Pro modes in Competition Planner
5. **PWA works offline** - Free tier can work without authentication for initial experience
6. **Single build** - No need to build/deploy two versions

**How to implement:**
```
App.tsx
  ├─ No Clerk required on first load
  ├─ Detect if localStorage has free tier access
  ├─ Route based on:
  │   ├─ isSignedOut + firstTime = free tier tools only
  │   ├─ isSignedOut + localStorage allowFree = free tier + some features
  │   ├─ isSignedIn + isFree = limited free plan features
  │   └─ isSignedIn + isPro = all features
  └─ Each tool respects permission level
```

### 8.2 SEPARATE REPOS (Not Recommended)

**Why not:**
- Would need to maintain two copies of calculator.ts, exportHandler.ts
- Doubles build/test effort
- Risk of divergence (bug fixes need applying twice)
- Separate deployments
- User migration path is unclear

**When it might be necessary:**
- If free tier is truly different product (e.g., web vs. mobile app)
- If free tier has different design/branding
- If you need different analytics/tracking per tier

---

## 9. RECOMMENDED FREEMIUM ARCHITECTURE

### 9.1 Access Model

```
ROUTE 1: Unauthenticated Free User
  ├─ Lands on app
  ├─ No Clerk sign-in required
  ├─ Access localStorage (browser-based)
  ├─ Can access:
  │   ├─ Competition Planner LITE (quick 10-second plans)
  │   ├─ Workout Timer (basic modes only)
  │   ├─ Warm-up Generator (limited warmup strategies)
  │   └─ 1RM Calculator (single formula)
  ├─ Cannot:
  │   ├─ Save plans (localStorage disabled)
  │   ├─ Export to PDF/CSV
  │   ├─ Use Game Day Mode
  │   └─ Access VBT tools, Technique Score
  └─ CTA: "Sign Up for Full Access"

ROUTE 2: Signed In, Free Plan
  ├─ User authenticated via Clerk
  ├─ Cloud sync could be added later
  ├─ Access same as unauth + ability to:
  │   ├─ Save plans (linkedto user account)
  │   ├─ Basic PDF export
  │   └─ Up to 3 saved plans
  └─ CTA: "Upgrade to Pro for Unlimited"

ROUTE 3: Signed In, Pro Plan
  ├─ Full access to all features
  ├─ Unlimited saved plans
  ├─ Advanced export options (mobile PDF, CSV)
  ├─ Game Day Mode
  ├─ VBT tools
  ├─ Technique Score Calculator
  └─ Priority support

ROUTE 4: Signed In, Enterprise
  ├─ Everything in Pro
  ├─ Potential: Custom integrations, API access
  └─ Potential: Multiple athletes management
```

### 9.2 Implementation Steps (Single Repo)

**Phase 1: Auth Refactoring**
1. Make Clerk optional on initial app load
2. Create `AuthContext` to wrap subscription state
3. Add `isAuthRequired` flag to components
4. Create free tier access system (no auth needed)

**Phase 2: Feature Gating**
1. Create permission system (canSave, canExport, canAccessVBT, etc.)
2. Gate each tool based on subscription tier
3. Implement SubscriptionGate overlays on premium features
4. Show upgrade CTAs in free features

**Phase 3: Lite Versions**
1. Competition Planner Lite already exists - keep as-is
2. Create Workout Timer Lite (remove custom intervals)
3. Create 1RM Calculator Lite (single formula)
4. Warm-up Generator stays full-featured (free educational tool)

**Phase 4: Clerk Integration**
1. User signup/login saves to Clerk
2. Free plan created automatically on signup
3. Pro plan available through Clerk Billing
4. Manual free access via publicMetadata (for beta users, etc.)

**Phase 5: Data Sync (Optional Future)**
1. Keep localStorage as primary store
2. Add cloud sync (fetch/sync plans from backend)
3. Sync across devices for signed-in users
4. Offline fallback still works

---

## 10. COMPARISON TABLE

| Feature | Free Tier | Pro Tier | Enterprise |
|---------|-----------|----------|------------|
| Competition Planner | Lite mode only | Pro + Lite | Pro + Lite + Custom |
| Save Plans | No | Yes (unlimited) | Yes (unlimited) |
| PDF Export | No | Yes (standard) | Yes (custom branding) |
| CSV Export | No | Yes | Yes |
| Workout Timer | Basic modes | All modes | All modes + custom |
| 1RM Calculator | Basic formula | All formulas + Training Load | + VBT Integration |
| Warm-up Generator | Full (educational) | Full | Full + Custom warmups |
| VBT Tools | No | Yes | Yes + API |
| Technique Score | No | Yes | Yes |
| Game Day Mode | No | Yes | Yes |
| Authentication | Optional | Required | Required |

---

## 11. KEY CONSIDERATIONS

### 11.1 PWA Offline Advantage

**Current asset:** Service worker caches entire app
**Free tier advantage:** Works completely offline (perfect for gym use)
**Could differentiate:** "Free tier = offline-first, always available"

### 11.2 Data Privacy

**Current:** All data in browser localStorage
**Free tier:** No cloud storage = maximum privacy
**Pro tier:** Could offer optional cloud sync for convenience
**Note:** No user identification needed for free tier

### 11.3 Browser Storage Limits

**localStorage limit:** ~10MB per domain
**Affects:** Competition Planner Lite (no saving = no issue)
**Long-term:** Might add IndexedDB for cloud sync in pro tier

### 11.4 Code Reuse

**Good news:** 95% of business logic is tier-agnostic
**calculator.ts, exportHandler.ts** - No changes needed
**Changes needed:** 
- App.tsx routing logic
- Component permission checks
- UI overlay components (SubscriptionGate)

### 11.5 Deployment Impact

**Current:** Single Vercel deployment
**Freemium:** Same deployment, no change
**Environment variables:** Just `VITE_CLERK_PUBLISHABLE_KEY` (unchanged)

---

## 12. MIGRATION PATH

**Day 1 (Existing Users):**
- All current Clerk users automatically get Pro tier
- Their plans remain in localStorage
- No data loss

**Day 1 (New Users - Option A - Unauthenticated):**
- Can try free features without signing in
- Can then sign in to upgrade/save
- Free localStorage data persists

**Day 1 (New Users - Option B - Required Auth):**
- Still require sign-in for any features
- But offer free plan tier in Clerk
- Simpler implementation

**Recommended: Option A (no auth required initially)**
- Lower friction for new users
- Aligns with PWA philosophy
- Can still convert to paid users later

---

## 13. NEXT STEPS RECOMMENDATIONS

1. **Confirm freemium strategy** with stakeholders
2. **Define paid feature list** (especially for VBT and Technique Score)
3. **Decide on Auth requirement** (optional vs. required for free tier)
4. **Plan data sync strategy** (optional - localStorage is sufficient for MVP)
5. **Create Clerk plans** in dashboard (free_plan, pro_plan, enterprise_plan)
6. **Build SubscriptionGate integration** (use existing component)
7. **Implement permission system** in App.tsx
8. **Add feature gating UI** (CTAs, upgrade prompts)
9. **Test offline experience** thoroughly (PWA strength)
10. **Plan analytics** (track free vs. paid conversions)

---

## 14. FILE REFERENCE SUMMARY

**Core Files for Freemium Implementation:**
- `App.tsx` (977 lines) - MAIN ROUTING & STATE
- `hooks/useSubscription.ts` (68 lines) - SUBSCRIPTION CHECKING
- `components/SubscriptionGate.tsx` (59 lines) - FEATURE GATING UI
- `index.tsx` (110 lines) - AUTH INITIALIZATION
- `types.ts` (164 lines) - TYPE DEFINITIONS (extend with free/pro tier types)
- `state.ts` (48 lines) - INITIAL STATE (add tier info)
- `utils/calculator.ts` (598 lines) - BUSINESS LOGIC (no changes needed)
- `utils/exportHandler.ts` (904 lines) - EXPORT LOGIC (gate PDF/CSV)

**Additional Components Needing Gating:**
- `GameDayMode.tsx` - Pro only
- `VelocityProfileGenerator.tsx` - Pro only
- `TechniqueScoreCalculator.tsx` - Pro only
- `SaveLoadSection.tsx` - Gate save functionality
- `LiteModeView.tsx` - Free tier, keep as-is
- `OneRepMaxCalculator.tsx` - Limit in free tier (basic formula only)

---

## SUMMARY

**Architecture:** Single-page React app with optional Clerk auth
**Recommendation:** Single repo with feature-gated components
**Free Tier:** Lite planner + Timer + Warm-up Gen (no save, no PDF)
**Pro Tier:** Everything + Game Day + VBT + Technique + Save + Export
**Auth:** Make optional (free tier works offline without sign-up)
**Implementation Effort:** 2-3 sprints for a well-structured freemium model
**Data Loss Risk:** None (all backward compatible)
**Deployment:** Single Vercel deployment (no change)

