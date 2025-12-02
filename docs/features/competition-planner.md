# Feature: Competition Planner

## Overview
The Competition Planner is the core feature of Platform Coach, allowing powerlifters and coaches to create comprehensive meet-day plans including attempts, warmups, equipment settings, and personal records.

## User Stories

- As a **powerlifter**, I want to plan my competition attempts so that I have a strategic approach on meet day
- As a **powerlifter**, I want to generate warmup progressions so that I'm properly prepared for my opener
- As a **coach**, I want to save multiple athlete plans so that I can manage several lifters at one competition
- As a **powerlifter**, I want to export my plan to PDF so that I can reference it during competition
- As a **powerlifter**, I want to track my personal bests so that I can see my progress over time
- As a **powerlifter**, I want to compare my planned attempts against records so that I know if I'm close to breaking one

## Acceptance Criteria

- [ ] User can enter lifter details (name, weight class, body weight, etc.)
- [ ] User can enter equipment settings (rack heights, hand-out preferences)
- [ ] User can calculate attempts using three different strategies (aggressive, stepped, conservative)
- [ ] User can generate warmups using default or dynamic strategy
- [ ] User can save multiple plans locally
- [ ] User can export plans to .plp format for sharing
- [ ] User can export plans to PDF (desktop and mobile optimized)
- [ ] User can export plans to CSV for spreadsheet analysis
- [ ] User can track personal bests with dates
- [ ] User can compare planned attempts against official records
- [ ] Plans persist in browser localStorage
- [ ] Safari mobile file downloads work correctly
- [ ] .plp file imports work on all browsers

## UI/UX Details

### Layout

**Pro Mode (Desktop):**
- Left column: Main form with collapsible sections
- Right sidebar: Summary showing total and predicted score
- Bottom: Export options

**Pro Mode (Mobile):**
- Vertical scroll layout
- Floating bottom bar with total/score summary
- Slide-up sheet for detailed summary

**Lite Mode:**
- Simplified single-page layout
- Quick plan builder (just name + three 3rd attempts)
- Instant calculation and export

### User Flow

**Creating a New Plan:**
1. Enter lifter name
2. Fill in competition details (optional but recommended)
3. Fill in equipment settings (optional)
4. For each lift (Squat, Bench, Deadlift):
   - Enter either opener OR third attempt
   - Click "Calculate" to fill in missing attempts
   - Warmups auto-generate (if enabled) or click "Generate Warmups"
   - Review and manually adjust if needed
5. Optionally add personal bests
6. Optionally compare to records
7. Save plan with "Save As..."
8. Export to PDF for meet day

**Loading an Existing Plan:**
1. Select plan from dropdown
2. Edit as needed
3. Save changes with "Save Changes" button

**Importing a Plan:**
1. Click "Import Plan..."
2. Select .plp file from file system
3. Plan loads into editor
4. Save with "Save As..." to keep it

### Validation & Error States

- **Lifter Name**: No validation, but exports use "Lifter" if empty
- **Body Weight**: Required for score calculation
  - Error state: Score shows "Enter BW" if missing
- **Gender**: Required for score calculation
  - Error state: Score shows "Select Gender" if missing
- **Weight Class**: Required for record comparison
  - Error state: Records section disabled
- **Attempts**: Must be parseable as numbers
  - Error state: Red border on invalid input
- **Warmups**: Must have valid weight/reps if populated
  - No strict validation, empty fields allowed

## Technical Implementation

### Current Implementation (React)

**Files:**
- `App.tsx` - Main application component (lines 1-1173)
- `components/SaveLoadSection.tsx` - Save/load UI
- `components/LiftSection.tsx` - Individual lift management
- `components/PersonalBestsSection.tsx` - PB tracking
- `components/RecordsComparisonSection.tsx` - Record comparison
- `components/GameDayMode.tsx` - Competition execution mode
- `utils/calculator.ts` - Business logic
- `utils/exportHandler.ts` - PDF/CSV generation
- `state.ts` - Initial state definitions

**Key Functions:**
- `handleAttemptChange()` - Updates attempt and triggers warmup generation (App.tsx:443)
- `handleCalculateAttempts()` - Calculates missing attempts (App.tsx:487)
- `handleGenerateWarmups()` - Generates warmup sets (App.tsx:512)
- `handleSaveAs()` - Saves plan to localStorage (App.tsx:317)
- `handleExportPlan()` - Exports to .plp file (App.tsx:582)
- `handleImportPlan()` - Imports from .plp file (App.tsx:605)

**State Management:**
```typescript
const [appState, setAppState] = useState<AppState>(initialAppState);
const [savedPlans, setSavedPlans] = useState<Record<string, AppState>>({});
const [currentPlanName, setCurrentPlanName] = useState('');
const [isDirty, setIsDirty] = useState(false);
```

**Props/Inputs:**
```typescript
interface AppState {
  version?: number;
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  branding: BrandingState;
  lifts: LiftsState;
  personalBests: PersonalBests;
  gameDayState: Record<LiftType, GameDayLiftState>;
}
```

### Data Structures

See `/docs/api-specs/types-overview.md` for complete type definitions.

**Key Types:**
- `AppState` - Root application state
- `PlanData` - Serializable data for .plp files
- `LiftState` - State for a single lift
- `Attempt` - Three competition attempts
- `WarmupSet` - Single warmup set

## Edge Cases & Special Scenarios

### 1. Auto-Generate Warmups Toggle
**Scenario:** User has auto-generate enabled vs disabled
**Behavior:**
- Enabled: Warmups regenerate when opener changes
- Disabled: User must manually click "Generate Warmups"

### 2. Bench-Only Competition
**Scenario:** Only bench press has attempts, squat and deadlift are empty
**Behavior:**
- Detected by `isBenchOnly` flag (App.tsx:685)
- Total calculation uses only bench press
- Score calculation uses bench-only formulas
- PDF shows only bench section prominently

### 3. Unit Switching (kg ↔ lbs)
**Scenario:** User switches unit preference mid-planning
**Behavior:**
- All warmups regenerate in new unit
- Attempts remain in kg (user must re-enter)
- PDF exports in selected unit

### 4. Dirty State Tracking
**Scenario:** User makes changes to loaded plan
**Behavior:**
- `isDirty` flag set to true
- Asterisk (*) appears next to plan name
- "Save Changes" button becomes enabled
- User must save or changes are lost

### 5. Safari File Download
**Scenario:** User exports .plp or PDF on Safari mobile
**Behavior:**
- Special handling with 100ms delay (see ADR 001)
- Explicit download attribute set
- Link hidden with `display: none`

### 6. File Import Rejection
**Scenario:** User selects invalid .plp file
**Behavior:**
- JSON parsing fails → error message
- Type guard `isPlanData()` fails → error message
- File input resets to allow retry

### 7. Missing Warmup Lookup
**Scenario:** Opener not in default warmup table
**Behavior:**
- Returns empty warmup array
- User sees no warmups generated
- Can switch to dynamic strategy or enter manually

### 8. Record Comparison Without Full Data
**Scenario:** User hasn't selected region/age/equipment for records
**Behavior:**
- Records section shows "Select all fields" message
- No records displayed
- PDF exports without records section

## Test Scenarios

### Happy Path
1. **Given** empty form
2. **When** user enters lifter name, competition details, and attempts
3. **Then** attempts calculate correctly
4. **And** warmups generate automatically
5. **And** total and score calculate
6. **And** plan can be saved
7. **And** plan can be exported to PDF

### Error Cases

**Test 1: Invalid Attempt Input**
1. **Given** attempt field
2. **When** user enters "abc"
3. **Then** calculation fails gracefully
4. **And** error flag shows red border

**Test 2: Import Invalid File**
1. **Given** import dialog
2. **When** user selects non-JSON file
3. **Then** error message appears
4. **And** file input resets

**Test 3: Score Without Body Weight**
1. **Given** completed plan without body weight
2. **When** checking summary
3. **Then** score shows "Enter BW" message
4. **And** does not crash

## Dependencies

**Features:**
- Game Day Mode (uses competition plan data)
- Branding Section (customizes PDF exports)

**External Libraries:**
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF tables
- `@clerk/clerk-react` - Authentication (paid version)

**APIs:**
- FileReader API - For .plp file imports
- Blob API - For file exports
- localStorage API - For plan persistence

## Next.js Migration Notes

### Approach

**Server Components:**
- Main plan editor form (static parts)
- Record comparison lookup (can be server-side)

**Client Components:**
- Lift sections (interactive calculations)
- Warmup generation (client-side calculation)
- File upload/download (browser APIs)
- Summary sidebar (reactive to state changes)

**API Routes:**
- `POST /api/plans` - Save plan to database (optional, instead of localStorage)
- `GET /api/records` - Fetch records (server-side lookup)
- `POST /api/export/pdf` - Server-side PDF generation (optional)

**State Management:**
- Consider Zustand or Context for AppState
- React Hook Form for form management
- TanStack Query for records data

### Migration Checklist

- [ ] Create `/app/planner` route
- [ ] Port all TypeScript types to `/lib/types/`
- [ ] Copy business logic to `/lib/calculations/`
- [ ] Create Zod schemas for validation
- [ ] Implement Server Components for static sections
- [ ] Implement Client Components for interactive parts
- [ ] Add file download with Safari compatibility (use existing pattern)
- [ ] Add file upload with validation (accept="*")
- [ ] Implement localStorage persistence or database
- [ ] Add PDF export (client-side or API route)
- [ ] Add CSV export functionality
- [ ] Test on Safari iOS
- [ ] Test .plp import/export
- [ ] Add E2E tests for critical flows

### Code Hints for AI Agent

**File Upload Pattern:**
```typescript
'use client';

export function PlanImport() {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate with Zod
      const validated = PlanSchema.parse(data);

      // Load into state
      setPlan(validated);
    } catch (error) {
      toast.error('Invalid plan file');
    }
  };

  return (
    <input
      type="file"
      accept="*"  // Accept all, validate content
      onChange={handleUpload}
    />
  );
}
```

**Attempt Calculation Hook:**
```typescript
'use client';

import { calculateAttempts } from '@/lib/calculations/attempts';

export function useAttemptCalculation(liftType: LiftType) {
  const calculate = (attempts: Attempt, strategy: AttemptStrategy) => {
    return calculateAttempts(liftType, attempts, strategy);
  };

  return { calculate };
}
```

**State Management Example:**
```typescript
// /lib/store/planner.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlannerStore {
  appState: AppState;
  savedPlans: Record<string, AppState>;
  currentPlanName: string;
  isDirty: boolean;

  // Actions
  updateDetails: (details: Partial<CompetitionDetails>) => void;
  calculateAttempts: (liftType: LiftType) => void;
  savePlan: (name: string) => void;
  loadPlan: (name: string) => void;
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      appState: initialAppState,
      savedPlans: {},
      currentPlanName: '',
      isDirty: false,

      updateDetails: (details) => set((state) => ({
        appState: { ...state.appState, details: { ...state.appState.details, ...details }},
        isDirty: true
      })),

      // ... more actions
    }),
    {
      name: 'planner-storage',
    }
  )
);
```

## Screenshots / Examples

*(Add screenshots of the interface)*

## Related Documentation

- [Attempt Calculations](/docs/business-logic/attempt-calculations.md)
- [Warmup Generation](/docs/business-logic/warmup-generation.md)
- [Type Definitions](/docs/api-specs/types-overview.md)
- [ADR 001: Safari File Download](/docs/decisions/001-safari-file-download-handling.md)
- [ADR 002: .plp File Upload](/docs/decisions/002-plp-file-upload-accept-attribute.md)

## Change History

- **2024-12-01**: Fixed Safari download bug and .plp import restriction
- **2024-12-01**: Initial documentation created
