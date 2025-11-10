import type { AppState, LiftsState, LiftType, GameDayLiftState, PersonalBests } from './types';

export const CURRENT_APP_VERSION = 1;

export const initialLiftsState: LiftsState = {
    squat: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '', coachingNote: '' },
    bench: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '', coachingNote: '' },
    deadlift: { attempts: { '1': '', '2': '', '3': '' }, warmups: Array(8).fill({ weight: '', reps: '' }), cues: ['', '', ''], error: false, includeCollars: false, warmupStrategy: 'default', dynamicWarmupSettings: { numSets: '6', startWeight: '20', finalWarmupPercent: '92' }, openerForWarmups: '', coachingNote: '' },
};

export const initialPersonalBests: PersonalBests = {
    squat: { weight: '', date: '' },
    bench: { weight: '', date: '' },
    deadlift: { weight: '', date: '' },
};

export const deriveGameDayStateFromLifts = (lifts: LiftsState): Record<LiftType, GameDayLiftState> => {
    const gameDayState: Partial<Record<LiftType, GameDayLiftState>> = {};
    (Object.keys(lifts) as LiftType[]).forEach(lift => {
        gameDayState[lift] = {
            ...lifts[lift],
            attempts: {
                ...lifts[lift].attempts,
                status: { '1': 'pending', '2': 'pending', '3': 'pending' }
            },
            warmups: lifts[lift].warmups.map(w => ({ ...w, completed: false }))
        };
    });
    return gameDayState as Record<LiftType, GameDayLiftState>;
};

export const initialAppState: AppState = {
  version: CURRENT_APP_VERSION,
  details: {
    eventName: '', lifterName: '', weightClass: '', competitionDate: '', weighInTime: '', bodyWeight: '', gender: '', scoringFormula: 'ipfgl', unit: 'kg', attemptStrategy: 'aggressive',
  },
  equipment: {
    squatRackHeight: '', squatStands: '', benchRackHeight: '', handOut: '', benchSafetyHeight: '',
  },
  branding: {
    logo: '',
    primaryColor: '#111827', // slate-900
    secondaryColor: '#1e293b', // slate-800
  },
  lifts: initialLiftsState,
  personalBests: initialPersonalBests,
  gameDayState: deriveGameDayStateFromLifts(initialLiftsState),
};