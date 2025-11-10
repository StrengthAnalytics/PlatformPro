import React from 'react';
import type { PersonalBests, LiftType } from '../types';

interface PersonalBestsSectionProps {
  personalBests: PersonalBests;
  unit: 'kg' | 'lbs';
  onChange: (lift: LiftType, field: 'weight' | 'date', value: string) => void;
}

const PersonalBestsSection: React.FC<PersonalBestsSectionProps> = ({ personalBests, unit, onChange }) => {
  const lifts: { key: LiftType; label: string }[] = [
    { key: 'squat', label: 'Squat' },
    { key: 'bench', label: 'Bench Press' },
    { key: 'deadlift', label: 'Deadlift' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Enter your current personal bests and when they were achieved. These will be displayed on the PDF plan.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lifts.map(({ key, label }) => (
          <div key={key} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
              {label}
            </h4>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor={`pb-${key}-weight`}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  PB Weight ({unit})
                </label>
                <input
                  id={`pb-${key}-weight`}
                  type="text"
                  inputMode="decimal"
                  value={personalBests[key].weight}
                  onChange={(e) => onChange(key, 'weight', e.target.value)}
                  placeholder={`e.g., ${unit === 'kg' ? '200' : '440'}`}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor={`pb-${key}-date`}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Date Achieved
                </label>
                <input
                  id={`pb-${key}-date`}
                  type="date"
                  value={personalBests[key].date}
                  onChange={(e) => onChange(key, 'date', e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalBestsSection;
