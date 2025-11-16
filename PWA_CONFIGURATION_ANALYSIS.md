# PlatformPro Dual-App PWA Configuration Analysis

## Executive Summary

The PlatformPro repository implements a sophisticated **dual-app architecture** from a single codebase, deploying two separate applications:
- **Platform Coach** (Paid) - Full-featured platform with authentication
- **Platform Lifter** (Free) - Streamlined no-auth version

Both are Progressive Web Apps (PWAs) built with React, Vite, TypeScript, and Tailwind CSS.

---

## 1. DUAL-APP DEPLOYMENT ARCHITECTURE

### 1.1 How It Works

**Single Codebase → Two Deployments via Environment Variables**

```
GitHub Repository (Single)
        ↓
    Vite Build (npm run build)
        ↓
    Environment Variable: VITE_APP_MODE
        ↓
    ├── Platform Coach (paid) [VITE_APP_MODE=paid]
    │   └── platformcoach.app (Vercel Project 1)
    │       └── Features: Clerk Auth, Blue Branding, Full Features
    │
    └── Platform Lifter (free) [VITE_APP_MODE=free]
        └── platformlifter.app (Vercel Project 2)
            └── Features: No Auth, Orange Branding, Limited Features
```

### 1.2 Environment Configuration Files

**Location**: `/home/user/PlatformPro/`

| File | Purpose | Key Variable |
|------|---------|--------------|
| `.env.example.free` | Template for free version deployment | `VITE_APP_MODE=free` |
| `.env.example.paid` | Template for paid version deployment | `VITE_APP_MODE=paid` |
| `config.ts` | Centralized app configuration | Reads `VITE_APP_MODE` |

#### .env.example.free (Free Version)
```bash
VITE_APP_MODE=free
VITE_UPGRADE_URL=https://platformcoach.app
# NO Clerk key - app runs without authentication
```

#### .env.example.paid (Paid Version)
```bash
VITE_APP_MODE=paid
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXX  # Required for auth
```

### 1.3 Central Configuration Logic

**File**: `/home/user/PlatformPro/config.ts`

```typescript
// Determines app version at build time
export const APP_MODE: AppMode = (import.meta.env.VITE_APP_MODE as AppMode) || 'paid';
export const IS_FREE_VERSION = APP_MODE === 'free';
export const IS_PAID_VERSION = APP_MODE === 'paid';

// Branding based on app mode
export const BRANDING = {
  appName: IS_FREE_VERSION ? 'Platform Lifter' : 'Platform Coach',
  themeColor: IS_FREE_VERSION ? '#f97316' : '#0066ff', // Orange vs Blue
  backgroundGradient: IS_FREE_VERSION 
    ? 'bg-gradient-to-br from-orange-500 to-red-600'
    : 'bg-gradient-to-br from-[#0066FF] to-[#0044AA]',
};

// Feature flags based on app mode
export const FEATURES = {
  competitionPlannerLite: true, // Available in both
  savePlans: IS_PAID_VERSION,   // Paid only
  exportPdf: IS_PAID_VERSION,   // Paid only
  gameDayMode: IS_PAID_VERSION, // Paid only (currently enabled in free)
  techniqueScore: IS_PAID_VERSION,
  workoutTimerAdvanced: IS_PAID_VERSION,
};

// PWA configuration
export const PWA_CONFIG = {
  name: BRANDING.appName,
  shortName: IS_FREE_VERSION ? 'PL' : 'PC',
  description: IS_FREE_VERSION
    ? 'Free powerlifting tools for athletes and coaches'
    : 'The essential toolkit for competitive powerlifters and coaches',
};
```

### 1.4 Deployment Strategy (Vercel)

**Two Vercel Projects from Single GitHub Repo:**

| Project Name | Domain | APP_MODE | Clerk Key | Status |
|--------------|--------|----------|-----------|--------|
| `platform-coach` | platformcoach.app | `paid` | Required | ✓ Active |
| `platform-lifter` | platformlifter.app | `free` | Not needed | ✓ Active |

**Build Process**: Both projects use identical build command but different environment variables to produce app-specific bundles.

---

## 2. PWA CONFIGURATION & MANIFEST

### 2.1 Manifest File Location & Structure

**File**: `/home/user/PlatformPro/public/manifest.json`

Currently configured for **Platform Coach (paid version)**:

```json
{
  "name": "Platform Coach",
  "short_name": "Platform Coach",
  "description": "The essential toolkit for competitive powerlifters and coaches...",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0066ff",
  "theme_color": "#0066ff",
  "icons": [
    {
      "src": "data:image/svg+xml,%3csvg...%3e",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,%3csvg...%3e",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "maskable"
    },
    {
      "src": "data:image/svg+xml,%3csvg...%3e",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,%3csvg...%3e",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "maskable"
    }
  ]
}
```

### 2.2 Icon Configuration

**Current Approach**: Inline SVG Data URIs in manifest.json

- **Icon Format**: SVG (not PNG/ICO files)
- **Encoding**: Base64/URL-encoded directly in manifest
- **Icon Content**: "PC" text on blue background (#0066ff)
- **Sizes**: 192x192px and 512x512px
- **Purposes**: 
  - `any`: Standard app icon for all contexts
  - `maskable`: Adaptive icon for devices with icon masking (Android 12+)

**Icon Data Example** (decoded):
```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'>
  <rect width='192' height='192' fill='#0066ff'/>
  <text x='96' y='130' font-family='Arial' font-size='80' 
        font-weight='bold' fill='white' text-anchor='middle'>PC</text>
</svg>
```

### 2.3 HTML Meta Tags for PWA

**File**: `/home/user/PlatformPro/index.html`

```html
<head>
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Theme Color (hardcoded to blue, needs dynamic update) -->
  <meta name="theme-color" content="#0066ff" id="theme-color-meta" />
  
  <!-- iOS PWA Support -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Platform Coach" />
  
  <!-- Apple Touch Icon (inline SVG) -->
  <link rel="apple-touch-icon" 
        href="data:image/svg+xml,%3csvg ...%3e" />
  
  <!-- Description -->
  <meta name="description" content="The essential toolkit..." />
  <meta name="mobile-web-app-capable" content="yes" />
</head>
```

### 2.4 Vite PWA Plugin Configuration

**File**: `/home/user/PlatformPro/vite.config.ts`

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',  // Uses custom service worker
      srcDir: '',                     // Service worker in root
      filename: 'service-worker.ts',  // Custom service worker
      manifest: false,                // We manage manifest.json manually
      injectRegister: null,           // We register SW manually
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
```

---

## 3. SERVICE WORKER & OFFLINE SUPPORT

### 3.1 Service Worker Registration

**File**: `/home/user/PlatformPro/index.tsx`

```typescript
// Register the service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[PWA] ServiceWorker registration successful');
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          // Handle new worker updates
        });
      })
      .catch(error => {
        console.error('[PWA] ServiceWorker registration failed:', error);
      });
  });
}
```

### 3.2 Service Worker Caching Strategy

**File**: `/home/user/PlatformPro/service-worker.ts`

**Cache Names** (app-agnostic, hardcoded):
```typescript
const CACHE_NAME = 'platform-coach-v1';
const RUNTIME_CACHE = 'platform-coach-runtime-v1';
```

**Caching Strategies**:

| Strategy | Used For | Approach |
|----------|----------|----------|
| **Cache-First** | Static assets (JS, CSS, images) | Check cache first, then network |
| **Network-First** | API calls | Try network first, fallback to cache |
| **Stale-While-Revalidate** | HTML pages | Serve cached, update in background |

**App Shell** (cached on install):
- `/`, `/index.html`
- `/manifest.json`
- External CDN files (Tailwind, React, jsPDF)
- Build output files from manifest

---

## 4. HOW APPS DIFFERENTIATE BETWEEN FREE & PAID

### 4.1 Configuration-Based Differentiation

**Key Files**:
- `config.ts` - Reads `VITE_APP_MODE` environment variable
- `index.tsx` - Conditional Clerk provider wrapping
- `App.tsx` - Conditional UI rendering
- Component files - Check `IS_FREE_VERSION`/`IS_PAID_VERSION` flags

### 4.2 Branding Differentiation

**Colors & Gradients**:

| Aspect | Free (Lifter) | Paid (Coach) |
|--------|---------------|--------------|
| Primary Color | #f97316 (Orange) | #0066ff (Blue) |
| Gradient | orange-500 → red-600 | #0066FF → #0044AA |
| Icon Text | "PL" (short) | "PC" (short) |
| Theme Color | #f97316 | #0066ff |

**Applied In**:
- HTML meta tags (theme-color)
- Tailwind gradient classes
- Component styling
- Modal backgrounds (UpgradeModal uses orange)

### 4.3 Feature Gating Strategy

**Three-Level Approach**:

1. **Config Level** (`config.ts` - FEATURES object):
   ```typescript
   export const FEATURES = {
     savePlans: IS_PAID_VERSION,        // True only for paid
     exportPdf: IS_PAID_VERSION,        // True only for paid
     gameDayMode: IS_PAID_VERSION,      // True only for paid
     techniqueScore: IS_PAID_VERSION,   // True only for paid
     competitionPlannerLite: true,      // Both versions
   };
   ```

2. **Component Level** (conditional rendering):
   ```typescript
   import { IS_FREE_VERSION } from '../config';
   
   if (IS_FREE_VERSION && newMode === 'pro') {
     setShowUpgradeModal(true);
     return; // Don't allow pro mode
   }
   ```

3. **Hook Level** (subscription checks):
   ```typescript
   // File: hooks/useSubscription.ts
   export function useSubscription(): SubscriptionData {
     if (IS_FREE_VERSION) {
       return { tier: 'free', isPro: false, ... };
     }
     // Paid version: check Clerk subscription
   }
   ```

### 4.4 Authentication Flow Differences

**Free Version (Platform Lifter)**:
```
User visits platformlifter.app
    ↓
No Clerk environment variable present
    ↓
Render App directly (no ClerkProvider)
    ↓
Instant access to all free features
    ↓
Pro features show UpgradeModal
```

**Paid Version (Platform Coach)**:
```
User visits platformcoach.app
    ↓
Clerk key in environment: VITE_CLERK_PUBLISHABLE_KEY
    ↓
Wrap App with ClerkProvider
    ↓
User must sign in
    ↓
useSubscription() checks Clerk Billing
    ↓
Show features based on subscription tier
```

---

## 5. UPGRADE FLOW FOR FREE USERS

### 5.1 UpgradeModal Component

**File**: `/home/user/PlatformPro/components/UpgradeModal.tsx`

```typescript
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;           // e.g., "Save Plans"
  featureDescription?: string;   // Additional context
}

const handleUpgrade = () => {
  window.location.href = UPGRADE_URL; // Redirects to platformcoach.app
};
```

**Modal Display**:
- Shows when free user attempts pro feature
- Lists benefits of upgrading
- "Upgrade Now" button → `https://platformcoach.app`
- "Continue with Free Version" to dismiss

**Benefits Listed**:
- Save & load unlimited competition plans
- Export to PDF & CSV
- Game Day Mode for competition
- Advanced VBT tools & analytics
- Full training load calculator

### 5.2 Upgrade URL Configuration

**Config**: `VITE_UPGRADE_URL` environment variable

```typescript
// config.ts
export const UPGRADE_URL = import.meta.env.VITE_UPGRADE_URL || 'https://platformcoach.app';
```

**Used In**:
- UpgradeModal component
- Potentially other upgrade buttons throughout the app

---

## 6. FEATURE COMPARISON & GATING LOGIC

### 6.1 Feature Matrix

| Feature | Free | Paid | Gating Method |
|---------|------|------|---------------|
| **Competition Planner - Lite Mode** | ✓ | ✓ | Always available |
| **Competition Planner - Pro Mode** | ✓* | ✓ | IS_FREE_VERSION check |
| **Save/Load Plans** | ✗ | ✓ | `FEATURES.savePlans` |
| **Export PDF/CSV** | ✗ | ✓ | `FEATURES.exportPdf` |
| **Game Day Mode** | ✓* | ✓ | `FEATURES.gameDayMode` |
| **Workout Timer - Basic** | ✓ | ✓ | Always available |
| **Workout Timer - Presets** | ✗ | ✓ | `FEATURES.workoutTimerAdvanced` |
| **1RM Calculator - Basic** | ✓ | ✓ | Always available |
| **Training Load Calculator** | ✗ | ✓ | `FEATURES.oneRmCalculatorAdvanced` |
| **Velocity Profile Test** | ✓ | ✓ | Always available |
| **Velocity Profile Generate** | ✗ | ✓ | `FEATURES.velocityProfileGenerate` |
| **Technique Score** | ✗ | ✓ | `FEATURES.techniqueScore` |
| **Warm-up Generator** | ✓ | ✓ | Always available |

*Note: Free version shows upgrade modal when attempting these features

### 6.2 Usage Examples in App.tsx

```typescript
// Line 214: Conditional lite mode availability
if (IS_PAID_VERSION && currentView === 'planner' && viewMode === 'lite') {
  // Show lite mode
}

// Line 273: Block pro mode in free version
if (IS_FREE_VERSION && newMode === 'pro') {
  setShowUpgradeModal(true);
  return;
}

// Line 281: Block profile generation in free version
if (IS_FREE_VERSION && newMode === 'generate') {
  setShowUpgradeModal(true);
  return;
}

// Line 707: Conditional button rendering
{IS_PAID_VERSION && (
  // Show Game Day Mode button only in paid version
)}

// Line 1028: Conditional upgrade modal
{IS_FREE_VERSION && (
  <UpgradeModal
    isOpen={showUpgradeModal}
    onClose={() => setShowUpgradeModal(false)}
    featureName="Pro Feature Name"
    featureDescription="Description"
  />
)}
```

---

## 7. BUILD & DEPLOYMENT CONFIGURATION

### 7.1 Build Process

**File**: `/home/user/PlatformPro/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',  // Custom SW injection
      manifest: false,                // Manual manifest handling
      injectRegister: null,           // Manual SW registration
    }),
  ],
})
```

**Build Command**: `npm run build` (same for both versions)

**Build Output**:
- `/dist` directory with:
  - index.html
  - JavaScript bundles (react, app code)
  - CSS bundles
  - service-worker.js
  - manifest.json

### 7.2 Package.json Configuration

**File**: `/home/user/PlatformPro/package.json`

```json
{
  "name": "platform-coach",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.54.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^1.1.0",
    "typescript": "^5.2.2"
  }
}
```

### 7.3 TypeScript & Build Settings

**Files**:
- `tsconfig.json` - TypeScript compilation settings
- `tsconfig.node.json` - Build tool configuration
- `vite-env.d.ts` - Vite environment variable types

### 7.4 Deployment Steps (Vercel)

**For Free Version** (`platform-lifter` project):
1. Connect GitHub repo
2. Set `VITE_APP_MODE=free`
3. Set `VITE_UPGRADE_URL=https://platformcoach.app`
4. Deploy to `platformlifter.app` domain

**For Paid Version** (`platform-coach` project):
1. Same repo connection
2. Set `VITE_APP_MODE=paid`
3. Set `VITE_CLERK_PUBLISHABLE_KEY=pk_...`
4. Deploy to `platformcoach.app` domain

---

## 8. CURRENT PWA ISSUES & CUSTOMIZATION OPPORTUNITIES

### 8.1 Current Limitations

1. **Static Manifest** - Single `manifest.json` doesn't adapt to app mode
   - Currently hardcoded for "Platform Coach"
   - Need separate manifests for free/paid versions

2. **Hardcoded Icons** - Inline SVG icons don't change per app
   - "PC" icon always shown regardless of mode
   - Should show "PL" for free version

3. **Hardcoded Theme Colors** - index.html meta tags aren't dynamic
   - `theme-color` hardcoded to `#0066ff` (blue)
   - Should be orange (#f97316) for free version

4. **Cache Names** - Service worker uses "platform-coach" for both
   - `CACHE_NAME = 'platform-coach-v1'`
   - Should be version-specific

5. **Apple Metadata** - Static in HTML
   - `apple-mobile-web-app-title` always "Platform Coach"
   - Should be "Platform Lifter" for free version

### 8.2 Recommended PWA Customizations

**Priority 1: Separate Manifest Files**

Create:
- `/public/manifest-free.json` for Platform Lifter
- `/public/manifest-paid.json` for Platform Coach

Dynamically serve based on `APP_MODE`.

**Priority 2: Dynamic HTML Meta Tags**

Modify `index.html` to use placeholders:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="__THEME_COLOR__" id="theme-color-meta" />
<meta name="apple-mobile-web-app-title" content="__APP_NAME__" />
```

Then update dynamically in `index.tsx`:
```typescript
document.querySelector('meta[name="theme-color"]')
  ?.setAttribute('content', BRANDING.themeColor);
```

**Priority 3: App-Specific Icons**

Create actual icon files:
- `public/icon-192-free.png` / `icon-192-paid.png`
- `public/icon-512-free.png` / `icon-512-paid.png`

Reference conditionally in manifest.

**Priority 4: Version-Specific Cache Names**

```typescript
// service-worker.ts
const CACHE_NAME = IS_FREE_VERSION 
  ? 'platform-lifter-v1' 
  : 'platform-coach-v1';
```

---

## 9. KEY FILES SUMMARY

### Core Configuration Files
- `/home/user/PlatformPro/config.ts` - Main configuration (APP_MODE, BRANDING, FEATURES)
- `/home/user/PlatformPro/.env.example.free` - Free version env template
- `/home/user/PlatformPro/.env.example.paid` - Paid version env template

### PWA Configuration
- `/home/user/PlatformPro/public/manifest.json` - PWA manifest
- `/home/user/PlatformPro/index.html` - PWA meta tags
- `/home/user/PlatformPro/service-worker.ts` - Service worker
- `/home/user/PlatformPro/vite.config.ts` - Vite PWA plugin

### Authentication & Feature Gating
- `/home/user/PlatformPro/index.tsx` - Conditional Clerk setup
- `/home/user/PlatformPro/hooks/useSubscription.ts` - Subscription checking
- `/home/user/PlatformPro/components/UpgradeModal.tsx` - Upgrade prompts
- `/home/user/PlatformPro/App.tsx` - Conditional rendering logic

### Documentation
- `/home/user/PlatformPro/DUAL_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `/home/user/PlatformPro/FREEMIUM_ARCHITECTURE.md` - Architecture overview
- `/home/user/PlatformPro/README.md` - Complete documentation

---

## 10. DEPLOYMENT CHECKLIST

### Before deploying free version:
- [ ] Update manifest.json for Platform Lifter (or create separate)
- [ ] Change icons from "PC" to "PL"
- [ ] Update background_color from #0066ff to #f97316
- [ ] Update theme_color from #0066ff to #f97316
- [ ] Update description and short_name
- [ ] Test PWA installation on mobile
- [ ] Verify upgrade modals show correct URL
- [ ] Test offline functionality
- [ ] Check browser cache handling

### Before deploying paid version:
- [ ] Ensure manifest.json uses "Platform Coach" name
- [ ] Verify Clerk key is configured in Vercel
- [ ] Test authentication flow
- [ ] Verify subscription gating works
- [ ] Test feature flags
- [ ] Confirm PWA works for signed-in users

---

## Conclusion

The repository successfully implements a **dual-app architecture** using environment-based configuration. Both versions are Progressive Web Apps with offline capability, but diverge in:
- **Branding** (colors, icons, names)
- **Authentication** (Clerk optional vs required)
- **Features** (subset for free, all for paid)

To fully optimize the PWA configuration for dual-app support, the primary improvements needed are:
1. Creating separate manifest files per app mode
2. Dynamically updating HTML meta tags
3. Creating app-specific icons
4. Implementing version-specific cache names in the service worker

