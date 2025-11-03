import React from 'react';
import { LiftsState, LiftType } from '../types';

interface LiteModePlanDisplayProps {
  lifts: LiftsState;
  unit: 'kg' | 'lbs';
  onAttemptChange: (lift: LiftType, attempt: '1' | '2' | '3', value: string) => void;
  onWarmupChange: (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => void;
}

interface LiftFocusCardProps {
    liftType: LiftType; 
    liftState: LiftsState[LiftType]; 
    unit: 'kg' | 'lbs';
    onAttemptChange: (liftType: LiftType, attempt: '1' | '2' | '3', value: string) => void;
    onWarmupChange: (liftType: LiftType, index: number, field: 'weight' | 'reps', value: string) => void;
}

const LiftFocusCard: React.FC<LiftFocusCardProps> = ({ liftType, liftState, unit, onAttemptChange, onWarmupChange }) => {
    const inputClasses = "w-full text-center p-1 border rounded-md shadow-sm bg-white text-slate-800 border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:bg-slate-700/50 dark:text-slate-100 dark:border-slate-600";
    const attemptLabels = { '1': '1st', '2': '2nd', '3': '3rd' };

    return (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-md p-4 animate-fadeIn">
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center capitalize border-b border-slate-200 dark:border-slate-700 pb-3">{liftType}</h4>

            <div>
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center uppercase tracking-wider">Attempts (kg)</h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {(['1', '2', '3'] as const).map(attemptNum => (
                        <div key={attemptNum}>
                            <label htmlFor={`lite-${liftType}-${attemptNum}`} className="text-xs text-slate-400">{attemptLabels[attemptNum]}</label>
                            <input
                                id={`lite-${liftType}-${attemptNum}`}
                                type="number"
                                step="2.5"
                                value={liftState.attempts[attemptNum]}
                                onChange={(e) => onAttemptChange(liftType, attemptNum, e.target.value)}
                                className={`${inputClasses} text-lg font-bold`}
                                placeholder="kg"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>

            {liftState.warmups.some(w => w.weight && w.reps) && (
                <div>
                    <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center uppercase tracking-wider">Warm-ups ({unit})</h5>
                    <ul className="space-y-2">
                        {liftState.warmups.map((warmup, index) => {
                            if (!warmup.weight && !warmup.reps) return null;
                            return (
                                <li key={index} className="grid grid-cols-[auto_1fr] gap-x-3 items-center bg-white dark:bg-slate-700/50 p-2 rounded-md text-sm">
                                    <span className="font-medium text-slate-500 dark:text-slate-400 text-right">Set {index + 1}</span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            step={unit === 'kg' ? '2.5' : '5'}
                                            value={warmup.weight}
                                            onChange={(e) => onWarmupChange(liftType, index, 'weight', e.target.value)}
                                            className={`${inputClasses} w-16 text-right`}
                                            aria-label={`Warmup ${index + 1} weight`}
                                        />
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">x</span>
                                        <input
                                            type="number"
                                            value={warmup.reps}
                                            onChange={(e) => onWarmupChange(liftType, index, 'reps', e.target.value)}
                                            className={`${inputClasses} w-12 text-center`}
                                            aria-label={`Warmup ${index + 1} reps`}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

const LiteModePlanDisplay: React.FC<LiteModePlanDisplayProps> = ({ lifts, unit, onAttemptChange, onWarmupChange }) => {
  const liftsOrder: LiftType[] = ['squat', 'bench', 'deadlift'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
      {liftsOrder.map(lift => (
        <LiftFocusCard 
          key={lift}
          liftType={lift}
          liftState={lifts[lift]}
          unit={unit}
          onAttemptChange={onAttemptChange}
          onWarmupChange={onWarmupChange}
        />
      ))}
    </div>
  );
};

export default LiteModePlanDisplay;
