import React from 'react';
import type { WarmupSet, LiftType } from '../types';
import PlateDisplay from './PlateDisplay';

interface WarmupResultDisplayProps {
  plan: WarmupSet[];
  unit: 'kg' | 'lbs';
  liftType: LiftType;
  targetWeight: string;
  targetReps: string;
  plateType: '20kg' | '25kg';
  includeCollars: boolean;
  onRowClick?: (weight: string) => void;
}

const WarmupResultDisplay = React.forwardRef<HTMLDivElement, WarmupResultDisplayProps>(({ 
  plan, 
  unit, 
  liftType,
  targetWeight, 
  targetReps, 
  plateType, 
  includeCollars, 
  onRowClick 
}, ref) => {
  const rowClasses = onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50' : '';
  const cardClasses = onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700' : '';

  return (
    <div ref={ref} className="bg-white dark:bg-slate-700 p-4 sm:p-6 rounded-lg shadow-md animate-fadeIn">
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center">Generated Warm-up Plan</h3>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4 capitalize">
          {liftType} &ndash; Target: {targetWeight} {unit} x {targetReps}
      </p>
      
      {/* Mobile View: Card List */}
      <div className="md:hidden space-y-3">
        {plan.map((set, index) => (
            <div key={index} onClick={() => onRowClick && onRowClick(set.weight)} className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-lg shadow-sm ${cardClasses} flex items-center justify-between`}>
                <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Set {index + 1}</span>
                    <p>
                        <span className="font-bold text-lg text-slate-700 dark:text-slate-200">{set.weight} {unit}</span>
                        <span className="font-semibold text-base text-slate-500 dark:text-slate-400"> x {set.reps}</span>
                    </p>
                </div>
                <div className="pl-4">
                    <PlateDisplay weight={set.weight} unit={unit} includeCollars={includeCollars} plateType={plateType} />
                </div>
            </div>
        ))}
        {/* Work Set Card */}
        <div onClick={() => onRowClick && onRowClick(targetWeight)} className={`bg-green-100/70 dark:bg-green-900/30 p-3 rounded-lg shadow-sm border-t-2 border-green-300 dark:border-green-700 ${cardClasses} flex items-center justify-between`}>
           <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">Work Set</span>
                <p>
                    <span className="font-bold text-lg text-slate-700 dark:text-slate-200">{targetWeight} {unit}</span>
                    <span className="font-semibold text-base text-slate-500 dark:text-slate-400"> x {targetReps}</span>
                </p>
            </div>
            <div className="pl-4">
                <PlateDisplay weight={targetWeight} unit={unit} includeCollars={includeCollars} plateType={plateType} />
            </div>
        </div>
      </div>
      
      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-600">
              <th className="p-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Set</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Weight ({unit})</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Reps</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Plate Loading (per side)</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((set, index) => (
                <tr key={index} onClick={() => onRowClick && onRowClick(set.weight)} className={`border-b border-slate-100 dark:border-slate-800 ${rowClasses}`}>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{index + 1}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{set.weight}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{set.reps}</td>
                  <td className="p-3 text-sm text-slate-500 dark:text-slate-400">
                    <PlateDisplay weight={set.weight} unit={unit} includeCollars={includeCollars} plateType={plateType} />
                  </td>
                </tr>
              ))}
             <tr onClick={() => onRowClick && onRowClick(targetWeight)} className={`border-t-2 border-slate-200 dark:border-slate-600 bg-green-100/70 dark:bg-green-900/30 font-bold ${rowClasses}`}>
                <td className="p-3 text-slate-700 dark:text-slate-100">Work Set</td>
                <td className="p-3 text-slate-800 dark:text-slate-50">{targetWeight}</td>
                <td className="p-3 text-slate-800 dark:text-slate-50">{targetReps}</td>
                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                   <PlateDisplay weight={targetWeight} unit={unit} includeCollars={includeCollars} plateType={plateType} />
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default WarmupResultDisplay;