# Platform Coach & Platform Lifter

This document provides a comprehensive overview of the Platform Coach ecosystem, detailing its dual deployment architecture, features, technical implementation, and core logic. It is intended to be a living document, updated with each functional change to the application.

## 1. Project Overview

This repository powers **two distinct applications** deployed from a single codebase:

### Platform Coach (Paid Version)
The complete, premium powerlifting toolkit with full authentication, data persistence, and advanced features. Includes Clerk authentication and Stripe billing integration for subscription management.

**URL**: platformcoach.app (PWA)
**Target Users**: Serious powerlifters, competitive athletes, and coaches who need the full suite of professional tools.

### Platform Lifter (Free Version)
A streamlined, no-auth version offering essential powerlifting tools as a lead magnet. Provides instant access to core features without requiring sign-up, designed to introduce users to the platform before upgrading to Platform Coach.

**URL**: platformlifter.app
**Target Users**: Casual lifters, beginners, and athletes exploring powerlifting tools before committing to a paid subscription.

Both applications are Progressive Web Apps (PWAs) built to work offline, ensuring reliability on competition day where internet connectivity may be unstable.

---

## 2. Dual Deployment Architecture

### 2.1. Single Codebase, Two Deployments

The project uses **environment-based configuration** to control which version of the app is deployed:

```typescript
// config.ts
export type AppMode = 'free' | 'paid';
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'paid';
export const IS_FREE_VERSION = APP_MODE === 'free';
export const IS_PAID_VERSION = APP_MODE === 'paid';
```

Key configuration files:
- **`.env.example.free`**: Environment variables for Platform Lifter deployment
- **`.env.example.paid`**: Environment variables for Platform Coach deployment
- **`config.ts`**: Centralized configuration for branding, features, and behavior

### 2.2. Deployment Strategy

**Two Vercel Projects** pointing to the same GitHub repository:

| Project | Environment Variable | Domain | Authentication |
|---------|---------------------|--------|----------------|
| Platform Coach | `VITE_APP_MODE=paid` | platformcoach.app | Clerk + Stripe |
| Platform Lifter | `VITE_APP_MODE=free` | platformlifter.app | None (instant access) |

See `DUAL_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

### 2.3. Feature Comparison

| Feature | Platform Lifter (Free) | Platform Coach (Paid) |
|---------|----------------------|----------------------|
| **Branding** | Orange gradient | Blue gradient |
| **Authentication** | None | Clerk (email, social) |
| **Competition Planner - Lite Mode** | ✅ Full access | ✅ Full access |
| **Competition Planner - Pro Mode** | ❌ Upgrade required | ✅ Full access |
| **Workout Timer** | ✅ Basic | ✅ Advanced + Custom Presets |
| **Warm-up Generator** | ✅ Full access | ✅ Full access |
| **1RM Calculator** | ✅ Basic only | ✅ + Training Load Calculator |
| **Velocity Profile Test** | ✅ Test mode only | ✅ + Generate Profile |
| **Technique Score Calculator** | ❌ Upgrade required | ✅ Full access |
| **Game Day Mode** | ✅ Full access (Lite planner) | ✅ Full access (All planners) |
| **Save/Load Plans** | ❌ Upgrade required | ✅ Unlimited |
| **Export PDF/CSV** | ❌ Upgrade required | ✅ Full access |
| **Data Persistence** | localStorage only | localStorage + Cloud |

### 2.4. Upgrade Flow

When free users attempt to access premium features, an `UpgradeModal` component displays:
- Feature name and description
- List of premium benefits
- "Upgrade Now" button → redirects to `https://platformcoach.app`
- "Continue with Free Version" option

---

## 3. Core Features & Functionality

The application is organized into several distinct tools, accessible from a central homescreen.

### 3.1. Competition Planner

The flagship tool for creating detailed, strategic powerlifting meet plans. It operates in two modes: **Pro** and **Lite**.

#### Pro Mode (Full-Featured) - Platform Coach Only

-   **Plan Management**:
    -   **Save/Load**: Plans are saved to the browser's `localStorage`, allowing users to create and manage multiple plans.
    -   **Import/Export (.plp)**: Users can export the complete plan data as a `.plp` (Powerlifting Plan) JSON file. This allows for easy sharing between an athlete and coach, or for backing up plans.
-   **Data Input**:
    -   **Lifter & Competition Details**: Core information for the plan, including name, event, date, weight class, and body weight. Gender and body weight are used for score calculation.
    -   **Equipment Settings**: A section to note down specific rack heights and settings for each lift, which is included in the PDF export for quick reference.
-   **Attempt Strategy & Calculation**:
    -   **Logic**: The core of the attempt planner requires the user to input either their **Opener (1st attempt)** or their goal **3rd Attempt**. The `calculateAttempts` utility then populates the other two attempts.
    -   **Strategies**:
        -   `Aggressive`: Maximizes jumps to aim for the highest possible 3rd attempt.
        -   `Stepped`: Uses equal, predictable jumps between all three attempts.
        -   `Conservative`: Uses smaller, safer jumps to prioritize securing a total.
    -   **Units**: A global setting allows users to *plan* their attempts in LBS. The values are converted to KG in the background, as KG is the standard for competition.
-   **Warm-up Generation**:
    -   **Logic**: Triggered automatically when an opener is entered or calculated (if "Auto-Generate" is enabled), or manually via a button. The `generateWarmups` utility is used.
    -   **Strategies**:
        -   `Default (Recommended)`: Uses a comprehensive set of pre-defined, battle-tested warm-up tables (`SQUAT_WARMUPS`, etc.) based on the opener.
        -   `Dynamic`: Allows for a custom warm-up progression based on the number of sets, a starting weight, and the percentage of the opener for the final warm-up.
    -   **Units**: A global setting allows warm-up weights to be displayed in either KG or LBS.
-   **Game Day Mode**:
    -   A simplified, high-contrast, full-screen UI designed for use during a competition.
    -   Allows users to check off completed warm-ups.
    -   Allows users to mark each of the three competition attempts as "completed", "missed", or "pending".
    -   Features an "on-the-fly" attempt editor and calculates the current total in real-time.
-   **Exporting**:
    -   **PDF (Desktop/Mobile)**: Generates a printable, interactive PDF with checkboxes using `jsPDF` and `jspdf-autotable`. The mobile version features larger fonts and a layout optimized for phone screens.
    -   **CSV**: Exports all plan data into a CSV file for analysis in spreadsheet software.

#### Lite Mode (Quick Plan) - Available in Both Versions

-   **Purpose**: To generate a complete, strategic competition plan in seconds.
-   **Logic**: The user inputs their name and goal 3rd attempts for all three lifts. The app uses the `aggressive` attempt strategy to calculate openers and second attempts, then automatically generates a full `default` warm-up plan for each lift.
-   **Output**: The generated plan is displayed and can be edited.
-   **Free Version**: Game Day Mode is available with blue gradient branding.
-   **Paid Version**: Full export options (PDF/CSV) and ability to save plans.

### 3.2. Workout Timer

A versatile timer for various training scenarios.

-   **Modes**:
    -   `Rolling Rest`: Automatically runs a countdown for rest periods between a specified number of sets. Includes an optional "lead-in" time before the first set.
    -   `Manual Rest`: A simple timer that is manually started by the user after completing a set.
-   **UI**: On desktop, uses standard number inputs. On mobile, it features a custom, touch-friendly "tumbler" picker component for a more intuitive UX.
-   **Alerts**: Plays audio beeps at user-configurable countdown intervals (e.g., 10s, 3s, 2s, 1s).
-   **Persistence**:
    -   **Free Version**: Basic timer functionality only
    -   **Paid Version**: Users can save configurations as named presets to `localStorage` and export/import as `.sctt` files.

### 3.3. 1RM & Training Load Calculator

A dual-function tool for estimating strength and prescribing training weights.

-   **1RM Calculator** (Available in both versions):
    -   **Logic**: Uses a proprietary blended model ("Strength Analytics Formula") that combines the strengths of multiple academic formulas (Epley, Brzycki, etc.) across different rep ranges for a more accurate prediction than any single formula.
    -   **Output**: Provides the 1RM estimate and a full "Training Zone" table showing the corresponding weight for reps 1 through 15.
-   **Training Load Calculator** (Platform Coach only):
    -   **Logic**: Calculates a recommended training weight based on the user's estimated 1RM, the number of sets and reps, and the desired intensity (measured in RIR or RPE).
-   **Exporting** (Platform Coach only): The 1RM results can be exported as a branded PDF or a CSV file.

### 3.4. Other Tools

-   **Warm-up Generator** (Available in both versions): A standalone version of the planner's warm-up logic.
-   **Velocity Profile Generator** (Limited in free version):
    -   *Generate Profile* (Platform Coach only): A coach can input an athlete's test data (or import a `.vbt` file) to create a full RIR-based velocity profile.
    -   *Complete Test* (Available in both versions): A guided walkthrough for an athlete to perform a VBT test. Free version can complete test but not save or export results.
-   **Technique Score Calculator** (Platform Coach only):
    -   **Logic**: Calculates the Coefficient of Variation (CV%) from the velocities of 3-5 heavy singles. This score quantifies technical consistency under load.
    -   **Output**: Provides the CV%, a qualitative category ("Excellent", "Good", "Needs Improvement"), and the associated training implications. Results can be exported to PDF.

---

## 4. Technical Architecture & Design

### 4.1. Frontend Stack

-   **Framework**: React 18 with TypeScript.
-   **Styling**: Tailwind CSS (via CDN) for utility-first styling. The configuration is defined in a `<script>` tag in `index.html`.
-   **Dependencies**: Key libraries like `react`, `react-dom`, and `jspdf` are loaded via an `importmap` from a CDN, simplifying the build process.

### 4.2. Environment-Based Configuration

The `config.ts` file serves as the single source of truth for all environment-based differences:

```typescript
// Branding configuration based on app mode
export const BRANDING = {
  appName: IS_FREE_VERSION ? 'Platform Lifter' : 'Platform Coach',
  appTitle: IS_FREE_VERSION ? 'Platform Lifter - Free Powerlifting Tools' : 'Platform Coach',
  backgroundGradient: IS_FREE_VERSION
    ? 'bg-gradient-to-br from-orange-500 to-red-600'
    : 'bg-gradient-to-br from-[#0066FF] to-[#0044AA]',
  themeColor: IS_FREE_VERSION ? '#f97316' : '#0066ff',
};

// Feature flags for free vs paid versions
export const FEATURES = {
  // Always available features
  competitionPlannerLite: true,
  workoutTimerBasic: true,
  warmupGenerator: true,
  oneRmCalculatorBasic: true,
  velocityProfileTest: true,

  // Paid-only features (requires authentication)
  savePlans: IS_PAID_VERSION,
  exportPdf: IS_PAID_VERSION,
  exportCsv: IS_PAID_VERSION,
  gameDayMode: IS_PAID_VERSION, // Available for Lite planner in free version
  competitionPlannerPro: IS_PAID_VERSION,
  oneRmCalculatorAdvanced: IS_PAID_VERSION,
  velocityProfileGenerate: IS_PAID_VERSION,
  techniqueScore: IS_PAID_VERSION,
  workoutTimerAdvanced: IS_PAID_VERSION,
};
```

### 4.3. Authentication & Subscription Management (Platform Coach Only)

-   **Clerk Integration**: Email and social authentication
-   **Subscription Hook**: `useSubscription()` checks user's subscription status
    -   Free version: Returns `{ tier: 'free', isActive: false }` immediately
    -   Paid version: Uses Clerk's `has()` method to check for `premium_access` feature flag
-   **Conditional Rendering**: All Clerk components wrapped in `IS_PAID_VERSION` checks to prevent errors in free deployment

```typescript
// hooks/useSubscription.ts
export function useSubscription(): SubscriptionData {
  // Free version: No authentication, return free tier by default
  if (IS_FREE_VERSION) {
    return {
      tier: 'free',
      isActive: false,
      isPro: false,
      isEnterprise: false,
      isFree: true,
      isLoading: false,
    };
  }

  // Paid version: Use Clerk hooks
  const { has, isLoaded } = useAuth();
  const { user } = useUser();
  // ... subscription logic
}
```

### 4.4. State Management

-   The application uses a centralized state model managed within the main `App.tsx` component.
-   The entire application state is held in a single `appState` object using the `useState` hook.
-   State updates are handled by passing callback functions down to child components, ensuring a unidirectional data flow.

### 4.5. Data Persistence

-   **Local Storage**: The primary mechanism for data persistence.
    -   `plp_allPlans`: Stores an object containing all saved competition plans (paid version only).
    -   `plp_details`, `plp_equipment`, `plp_branding`: Caches the last-used settings for these sections.
    -   `workout_timers`: Stores saved timer presets (paid version only).
    -   Other keys are used for user preferences like theme, units, etc.
-   **File-based**: Users can export plans (`.plp`), timer presets (`.sctt`), and VBT test data (`.vbt`) as JSON files for backup and sharing (paid version only).

### 4.6. Offline Capability (PWA)

-   A **Service Worker** (`service-worker.ts`) is registered to cache core application assets.
-   This allows the app to load and function reliably without an internet connection, which is critical for use in gyms or at competitions.
-   Both free and paid versions support offline functionality.

### 4.7. Code Structure

-   `/components`: Contains all reusable React components.
    -   `UpgradeModal.tsx`: Modal shown to free users when accessing premium features
-   `/hooks`: Custom React hooks
    -   `useSubscription.ts`: Manages subscription state with conditional Clerk integration
-   `/utils`: Contains core business logic, calculations, and utility functions.
    -   `calculator.ts`: The brain of the application. Contains all mathematical logic for attempt calculation, warm-up generation, scoring, and plate breakdowns.
    -   `exportHandler.ts`: Manages the creation of all downloadable files (PDF, CSV, `.plp`).
    -   `migration.ts`: Handles state versioning, ensuring that data stored in `localStorage` from older versions of the app can be safely upgraded to the latest structure.
-   `config.ts`: Centralized environment-based configuration for features, branding, and behavior.
-   `App.tsx`: The root component that manages state and orchestrates the entire application.
-   `state.ts`: Defines the initial shape and default values for the application state.

---

## 5. Development & Deployment

### 5.1. Local Development

The project is set up using Vite. To run the development server:

1.  Install dependencies: `npm install`
2.  Copy the appropriate environment file:
    -   For free version: `cp .env.example.free .env`
    -   For paid version: `cp .env.example.paid .env`
3.  Add your Clerk key (paid version only): Edit `.env` and add your `VITE_CLERK_PUBLISHABLE_KEY`
4.  Start the server: `npm run dev`

### 5.2. Testing Both Versions Locally

To test both versions without constantly swapping `.env` files:

```bash
# Test free version
VITE_APP_MODE=free npm run dev

# Test paid version (in a different terminal)
VITE_APP_MODE=paid npm run dev
```

### 5.3. Dependency Management & Reproducible Builds

-   **`package-lock.json`**: This file is critical for ensuring the stability and reproducibility of the application. It records the exact version of every dependency installed.
-   **Commitment to Repository**: The `package-lock.json` file **must be committed** to the version control repository. This guarantees that every developer and every build environment (like GitHub Actions or Vercel) uses the exact same dependency versions, preventing "it works on my machine" issues and ensuring consistent builds.

### 5.4. Deployment

The application uses **two separate Vercel projects** deployed from the same GitHub repository:

#### Platform Coach (Paid)
- **Project Name**: platform-coach
- **Domain**: platformcoach.app
- **Environment Variables**:
  ```
  VITE_APP_MODE=paid
  VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
  ```

#### Platform Lifter (Free)
- **Project Name**: platform-lifter
- **Domain**: platformlifter.app
- **Environment Variables**:
  ```
  VITE_APP_MODE=free
  VITE_UPGRADE_URL=https://platformcoach.app
  ```

**Detailed deployment instructions** can be found in `DUAL_DEPLOYMENT_GUIDE.md`.

### 5.5. Git Workflow

Development happens on feature branches following this naming convention:
- `claude/feature-name-sessionID` for AI-assisted development
- Feature branches are merged to main via pull requests
- Both Vercel deployments automatically rebuild on main branch updates

---

## 6. Architecture Decisions

### 6.1. Why Single Repo?

**Advantages**:
- ✅ Single source of truth for all business logic
- ✅ Bug fixes and feature updates apply to both versions automatically
- ✅ Easier maintenance and testing
- ✅ Reduced code duplication
- ✅ Shared component library

**Alternative Considered**: Separate repos for each version was rejected due to maintenance overhead and increased risk of divergence.

### 6.2. Why Environment Variables Over Build Flags?

Using runtime environment variables (`import.meta.env.VITE_APP_MODE`) instead of build-time flags allows:
- Same build process for both versions
- Easier debugging (can test both modes locally)
- Simpler CI/CD configuration
- More explicit configuration in Vercel dashboard

### 6.3. Why Conditional Hook Calling?

The `useSubscription` hook uses early returns to prevent Clerk hooks from being called in the free version:
```typescript
if (IS_FREE_VERSION) {
  return { tier: 'free', ... };
}
const { has } = useAuth(); // Only called in paid version
```

This prevents runtime errors where Clerk hooks are called outside of `<ClerkProvider>`.

---

## 7. Future Considerations

### 7.1. Potential Enhancements
- Cloud sync for paid users (currently localStorage only)
- Mobile native apps (React Native)
- Coach dashboard for managing multiple athletes
- Integration with federation databases (IPF, USAPL, etc.)

### 7.2. Scaling the Freemium Model
- A/B testing different upgrade modal copy
- Analytics to track conversion from free to paid
- Limited-time trials of premium features
- Referral program from free users

---

*This README is automatically updated with significant changes to the application's functionality or architecture.*
