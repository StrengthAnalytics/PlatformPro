// FIX: Removed the conflicting import statement. This file defines the types, so it should not import them.

export type LiftType = 'squat' | 'bench' | 'deadlift';

export type WarmupStrategy = 'default' | 'dynamic';

export type ScoringFormula = 'ipfgl' | 'wilks' | 'dots';

export type AttemptStrategy = 'aggressive' | 'stepped' | 'conservative';

export interface DynamicWarmupSettings {
  numSets: string;
  startWeight: string;
  finalWarmupPercent: string;
}

export interface CompetitionDetails {
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
}

export interface EquipmentSettings {
  squatRackHeight: string;
  squatStands: string;
  benchRackHeight: string;
  handOut: string;
  benchSafetyHeight: string;
}

export interface BrandingState {
  logo: string; // base64 encoded image
  primaryColor: string;
  secondaryColor: string;
}

export interface Attempt {
  '1': string;
  '2': string;
  '3': string;
}

export interface WarmupSet {
  weight: string;
  reps: string;
  completed?: boolean;
}

export interface Plate {
    weight: number;
    color: string;
    size: string;
}

export interface LiftState {
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

export type LiftsState = Record<LiftType, LiftState>;

export interface PersonalBest {
  weight: string;
  date: string;
}

export type PersonalBests = Record<LiftType, PersonalBest>;

export interface AppState {
  version?: number;
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  branding: BrandingState;
  lifts: LiftsState;
  personalBests: PersonalBests;
  gameDayState: Record<LiftType, GameDayLiftState>;
}

export interface PlanData {
  details: CompetitionDetails;
  equipment: EquipmentSettings;
  lifts: LiftsState;
  personalBests: PersonalBests;
}

// For Game Day Mode local state
export type AttemptStatus = 'pending' | 'completed' | 'missed';

export interface GameDayLiftState extends LiftState {
    attempts: Attempt & {
        status: { '1': AttemptStatus; '2': AttemptStatus; '3': AttemptStatus };
    };
    warmups: WarmupSet[];
}

export interface CustomWarmupParams {
  targetWeight: number;
  targetReps: number;
  unit: 'kg' | 'lbs';
  liftType: LiftType;
}

// Workout Timer Types
export type IntervalType = 'prep' | 'work' | 'rest' | 'cooldown';
export type TimerMode = 'interval' | 'rolling' | 'manual';

export interface Interval {
  id: string;
  name: string;
  duration: number; // in seconds
  type: IntervalType;
  color: string;
}

export interface SavedTimer {
  id: string;
  name: string;
  mode: TimerMode;
  // For 'interval' mode
  intervals: Interval[];
  rounds: number;
  // For 'rolling' mode
  leadIn: number;
  sets: number; // Also used by manual
  roundTime: number;
  // For 'manual' mode
  restTime: number;
  alertTimings?: number[];
  alertVolume?: number;
  useSpeech?: boolean;
  voiceGender?: 'male' | 'female';
}

// 1RM Calculator Export Types
export interface OneRepMaxResults {
    allCalculations: { name: string; value: number }[];
    strengthAnalytics1RM: number;
    repTableData: { reps: number; percentage: string; weight: string }[];
}

export interface OneRepMaxExportData {
    isMobile: boolean;
    branding: BrandingState;
    lifterName: string;
    weight: string;
    reps: string;
    unit: 'kg' | 'lbs';
    results: OneRepMaxResults;
}

// Powerlifting Records Types
export interface PowerliftingRecord {
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

export interface RecordLookupParams {
  gender?: 'M' | 'F';
  weightClass?: string;
  lift?: 'squat' | 'bench_press' | 'bench_press_ac' | 'deadlift' | 'total';
  ageCategory?: string;
  equipment?: 'equipped' | 'unequipped';
  region?: string;
}

export interface RecordComparison {
  record: PowerliftingRecord;
  difference: number;
  percentageOfRecord: number;
}
