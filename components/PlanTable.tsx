import React from 'react';
import { LiftsState, LiftType } from '../types';

interface PlanTableProps {
  lifts: LiftsState;
  unit: 'kg' | 'lbs';
}

const PlanTable: React.FC<PlanTableProps> = ({ lifts, unit }) => {
  const liftsOrder: LiftType[] = ['squat', 'bench', 'deadlift'];
  
  const maxWarmups = Math.max(
    ...liftsOrder.map(lift => lifts[lift].warmups.filter(w => w.weight).length)
  );
  
  // Create an array from 0 to maxWarmups-1 for a top-down chronological order.
  const warmupRows = Array.from({ length: maxWarmups }, (_, i) => i);

  const attempts = [
    { label: '1st (kg)', key: '1' as const },
    { label: '2nd (kg)', key: '2' as const },
    { label: '3rd (kg)', key: '3' as const },
  ];
  
  const baseCellClass = "py-3 px-2 border border-slate-200 dark:border-slate-600";

  const renderAttemptCell = (value: string | undefined) => (
    <td className={`${baseCellClass} text-center text-sm font-semibold text-slate-700 dark:text-slate-200`}>
      {value || '-'}
    </td>
  );

  return (
    <div className="bg-white dark:bg-slate-700 p-4 md:p-6 rounded-lg shadow-md animate-fadeIn">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${baseCellClass} w-1/5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase`}>Set / Attempt</th>
            {liftsOrder.map(lift => (
              <th key={lift} className={`${baseCellClass} text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase`}>{lift}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {warmupRows.map(index => {
            const liftWithThisWarmup = liftsOrder.find(lift => lifts[lift].warmups[index]?.weight);
            if (!liftWithThisWarmup) return null;

            return (
              <tr key={`warmup-${index}`}>
                <td className={`${baseCellClass} text-left text-sm text-slate-700 dark:text-slate-300`}>Set {index + 1} ({unit})</td>
                {liftsOrder.map(lift => {
                  const warmup = lifts[lift].warmups[index];
                  return (
                    <td key={lift} className={`${baseCellClass} text-center text-sm text-slate-700 dark:text-slate-200`}>
                      {warmup?.weight ? `${warmup.weight} x ${warmup.reps}` : '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {attempts.map(attempt => (
            <tr key={attempt.key}>
              <td className={`${baseCellClass} text-left font-semibold text-sm text-slate-800 dark:text-slate-100`}>{attempt.label}</td>
              {liftsOrder.map(lift => renderAttemptCell(lifts[lift].attempts[attempt.key]))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanTable;