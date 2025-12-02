# Type System Overview

This document provides an overview of all TypeScript types used in Platform Coach. These types are defined in `/types.ts` and should be preserved during Next.js migration.

## Core Application Types

### AppState
The main application state containing all data for a competition plan.

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

**Purpose**: Root state object for the entire application
**Used by**: Main App component, state management
**Migration notes**: Consider splitting into separate contexts in Next.js

---

### PlanData
Subset of AppState used for import/export of competition plans (.plp files).

```typescript
interface PlanData {
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  lifts: LiftsState;
  personalBests: PersonalBests;
}
```

**Purpose**: Serializable data structure for .plp files
**Used by**: Import/export functionality
**Migration notes**: This is what gets saved to .plp files (JSON format)
**Validation**: Must pass `isPlanData()` type guard

---

## Competition Details

### CompetitionDetails
All information about the competition and lifter.

```typescript
interface CompetitionDetails {
  eventName: string;
  lifterName: string;
  weightClass: string;
  competitionDate: string;
  weighInTime: string;
  bodyWeight: string;
  gender: 'male' | 'female' | '';
  scoringFormula: ScoringFormula;
  unit: 'kg' | 'lbs';
  attemptStrategy: AttemptStrategy;
  recordsRegion?: string;
  recordsAgeCategory?: string;
  recordsEquipment?: 'equipped' | 'unequipped';
}
```

**Fields:**
- `eventName`: Name of the competition
- `lifterName`: Athlete's name (used in exports)
- `weightClass`: e.g., "83kg", "93kg"
- `competitionDate`: YYYY-MM-DD format
- `weighInTime`: HH:MM format
- `bodyWeight`: Actual body weight in kg (string)
- `gender`: Required for scoring calculations
- `scoringFormula`: Which formula to use (IPF GL Points, Wilks, DOTS)
- `unit`: Global unit preference
- `attemptStrategy`: How to calculate attempts
- `recordsRegion`: Optional, for record comparison
- `recordsAgeCategory`: Optional, e.g., "Open", "Junior"
- `recordsEquipment`: Optional, equipped vs unequipped

**Validation:**
- `lifterName` should not be empty for meaningful exports
- `bodyWeight` and `gender` required for scoring
- `weightClass` required for record comparison

---

### EquipmentSettings
Rack heights and equipment preferences.

```typescript
interface EquipmentSettings {
  squatRackHeight: string;
  squatStands: string;        // "In", "Out", "Left In", "Right In"
  benchRackHeight: string;
  handOut: string;            // "Self", "Yes"
  benchSafetyHeight: string;
}
```

**Purpose**: Technical settings for meet day
**Used by**: PDF exports, Game Day Mode
**Migration notes**: Simple key-value pairs, no validation needed

---

## Lift Data Structures

### LiftType
Type union for the three competition lifts.

```typescript
type LiftType = 'squat' | 'bench' | 'deadlift';
```

**Usage**: Keys for Records, iteration over lifts
**Migration notes**: Used extensively, preserve exactly

---

### LiftState
Complete state for a single lift.

```typescript
interface LiftState {
  attempts: Attempt;
  warmups: WarmupSet[];
  cues: string[];
  error: boolean;
  includeCollars: boolean;
  warmupStrategy: WarmupStrategy;
  dynamicWarmupSettings: DynamicWarmupSettings;
  openerForWarmups: string;
  coachingNote: string;
}
```

**Fields:**
- `attempts`: The three competition attempts
- `warmups`: Generated warmup sets
- `cues`: Technical cues for this lift
- `error`: Flag for validation errors
- `includeCollars`: Whether to account for 5kg collars in warmup loading
- `warmupStrategy`: 'default' or 'dynamic'
- `dynamicWarmupSettings`: Settings for dynamic warmup generation
- `openerForWarmups`: The opener used to generate current warmups
- `coachingNote`: Additional notes

**Validation:**
- Attempts should be numeric strings
- Warmups should have valid weight/reps
- `openerForWarmups` tracks if warmups need regeneration

---

### Attempt
The three competition attempts for a lift.

```typescript
interface Attempt {
  '1': string;  // Opener
  '2': string;  // Second attempt
  '3': string;  // Third attempt
}
```

**Purpose**: Stores attempt weights
**Type**: Strings (allows empty state, numeric input)
**Validation**: Should be parseable as numbers when filled
**Migration notes**: Numeric keys as strings ('1', '2', '3')

---

### WarmupSet
A single warmup set.

```typescript
interface WarmupSet {
  weight: string;
  reps: string;
  completed?: boolean;  // Only used in Game Day Mode
}
```

**Purpose**: Warmup prescription
**Fields:**
- `weight`: Weight for this set (string, numeric)
- `reps`: Number of reps (string, numeric)
- `completed`: Tracked in Game Day Mode

**Validation:**
- Both fields can be empty (unpopulated warmup)
- Should be numeric when populated

---

### LiftsState
Collection of all three lifts.

```typescript
type LiftsState = Record<LiftType, LiftState>;
```

**Structure:**
```typescript
{
  squat: LiftState,
  bench: LiftState,
  deadlift: LiftState
}
```

---

## Warmup Configuration

### WarmupStrategy
Method for generating warmups.

```typescript
type WarmupStrategy = 'default' | 'dynamic';
```

**Options:**
- `default`: Uses predefined warmup tables
- `dynamic`: User-configured progression

---

### DynamicWarmupSettings
Configuration for dynamic warmup generation.

```typescript
interface DynamicWarmupSettings {
  numSets: string;           // Number of warmup sets
  startWeight: string;       // Starting weight (usually bar weight)
  finalWarmupPercent: string; // Percentage of opener for final warmup
}
```

**Example:**
```typescript
{
  numSets: "5",
  startWeight: "20",
  finalWarmupPercent: "90"
}
```

**Validation:**
- All fields should be numeric
- `numSets`: 3-8 typically
- `startWeight`: Usually 20kg (empty bar)
- `finalWarmupPercent`: 85-95% typical range

---

## Personal Bests

### PersonalBest
A personal record for a lift.

```typescript
interface PersonalBest {
  weight: string;
  date: string;
}
```

**Fields:**
- `weight`: PR weight (numeric string)
- `date`: YYYY-MM-DD format (optional)

**Usage**: Displayed on PDFs, used for context

---

### PersonalBests
Collection of PRs for all lifts.

```typescript
type PersonalBests = Record<LiftType, PersonalBest>;
```

---

## Game Day Mode

### AttemptStatus
Status tracking for attempts during competition.

```typescript
type AttemptStatus = 'pending' | 'completed' | 'missed';
```

---

### GameDayLiftState
Extended lift state with attempt tracking.

```typescript
interface GameDayLiftState extends LiftState {
  attempts: Attempt & {
    status: { '1': AttemptStatus; '2': AttemptStatus; '3': AttemptStatus };
  };
  warmups: WarmupSet[];
}
```

**Purpose**: Adds status tracking to LiftState for live competition use
**Migration notes**: This is derived from LiftState, not saved to .plp files

---

## Strategy Types

### AttemptStrategy
Method for calculating attempt progression.

```typescript
type AttemptStrategy = 'aggressive' | 'stepped' | 'conservative';
```

**Options:**
- `aggressive`: Heavier opener, smaller jumps
- `stepped`: Equal jumps between attempts
- `conservative`: Lighter opener, larger jumps

**Used by**: Attempt calculation algorithm

---

### ScoringFormula
Scoring system for powerlifting totals.

```typescript
type ScoringFormula = 'ipfgl' | 'wilks' | 'dots';
```

**Options:**
- `ipfgl`: IPF GL Points (current standard)
- `wilks`: Wilks coefficient (legacy)
- `dots`: DOTS formula (alternative)

---

## Branding

### BrandingState
Customization for PDF exports.

```typescript
interface BrandingState {
  logo: string;         // base64 encoded image
  primaryColor: string;  // Hex color for main header
  secondaryColor: string; // Hex color for section headers
}
```

**Fields:**
- `logo`: Base64 image data (PNG/JPEG)
- `primaryColor`: Hex color (e.g., "#111827")
- `secondaryColor`: Hex color (e.g., "#1e293b")

**Migration notes**: Saved to localStorage separately from plans

---

## Powerlifting Records

### PowerliftingRecord
An official powerlifting record.

```typescript
interface PowerliftingRecord {
  region: string;
  name: string;
  weightClass: string;
  gender: 'M' | 'F';
  lift: 'squat' | 'bench_press' | 'bench_press_ac' | 'deadlift' | 'total';
  ageCategory: string;
  record: number;
  dateSet: string;
  equipment: 'equipped' | 'unequipped';
}
```

**Purpose**: Record data from British Powerlifting
**Source**: `data-source/records.json`

---

### RecordLookupParams
Parameters for finding a record.

```typescript
interface RecordLookupParams {
  gender?: 'M' | 'F';
  weightClass?: string;
  lift?: 'squat' | 'bench_press' | 'bench_press_ac' | 'deadlift' | 'total';
  ageCategory?: string;
  equipment?: 'equipped' | 'unequipped';
  region?: string;
}
```

**Usage**: Finding matching records from database

---

## Workout Timer Types

### TimerMode
Type of timer workout.

```typescript
type TimerMode = 'interval' | 'rolling' | 'manual';
```

---

### SavedTimer
Complete timer configuration.

```typescript
interface SavedTimer {
  id: string;
  name: string;
  mode: TimerMode;
  intervals: Interval[];
  rounds: number;
  leadIn: number;
  sets: number;
  roundTime: number;
  restTime: number;
  alertTimings?: number[];
  alertVolume?: number;
  useSpeech?: boolean;
  voiceGender?: 'male' | 'female';
}
```

**Migration notes**: Separate feature, not part of competition planning

---

## 1RM Calculator Types

### OneRepMaxResults
Results from 1RM calculation.

```typescript
interface OneRepMaxResults {
  allCalculations: { name: string; value: number }[];
  strengthAnalytics1RM: number;
  repTableData: { reps: number; percentage: string; weight: string }[];
}
```

**Migration notes**: Separate feature, export to PDF functionality

---

## Migration Checklist

When porting to Next.js:

- [ ] Copy all type definitions to `/lib/types/`
- [ ] Create Zod schemas matching these types
- [ ] Maintain exact field names and structures
- [ ] Preserve string types where validation happens at runtime
- [ ] Keep numeric keys as strings ('1', '2', '3')
- [ ] Document any new types added for Next.js features
