import React from 'react';
import { getPlatesForDisplay, getLbsPlateBreakdown } from '../utils/calculator';

interface PlateDisplayProps {
  weight: string;
  unit: 'kg' | 'lbs';
  includeCollars?: boolean;
  size?: 'sm' | 'lg';
  plateType?: '20kg' | '25kg';
}

const PlateDisplay: React.FC<PlateDisplayProps> = ({ weight, unit, includeCollars = false, size = 'sm', plateType = '25kg' }) => {
  const totalWeight = parseFloat(weight);
  
  const containerHeightClass = size === 'lg' ? 'h-14' : 'h-10';
  const barSleeveClasses = size === 'lg' ? 'h-4 w-6' : 'h-2.5 w-4';
  const collarClasses = size === 'lg' ? 'h-7 w-3' : 'h-5 w-2';

  if (isNaN(totalWeight) || totalWeight <= 0) {
    return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}></div>;
  }
  
  if (unit === 'kg') {
    const barWeight = 20;
    const barOnlyText = 'Bar Only';

    if (totalWeight > 0 && totalWeight < barWeight) {
      return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>Invalid</div>;
    }
    if (includeCollars && totalWeight > barWeight && totalWeight < 25) {
      return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>Invalid</div>;
    }
    
    const plates = getPlatesForDisplay(totalWeight, includeCollars, size as 'sm' | 'lg', plateType);
    
    const canLoadWithCollars = totalWeight >= 25;
    const showCollars = includeCollars && canLoadWithCollars;
    
    if (totalWeight === barWeight || (totalWeight > barWeight && plates.length === 0 && !canLoadWithCollars && !showCollars)) {
      return <div className={`${containerHeightClass} flex items-center justify-start text-xs text-slate-400 dark:text-slate-500`}>{barOnlyText}</div>;
    }
    
    return (
      <div className={`flex items-center ${containerHeightClass}`}>
        <div className={`${barSleeveClasses} bg-slate-300 dark:bg-slate-600 rounded-r-sm z-10 shadow-inner`}></div>
        <div className="flex items-center -space-x-px">
          {plates.map((plate, index) => (
            <div
              key={index}
              className={`rounded-md ${plate.size} ${plate.color} flex items-center justify-center shadow`}
              title={`${plate.weight}kg`}
            ></div>
          ))}
        </div>
        {showCollars &&
          <div className={`${collarClasses} bg-slate-500 dark:bg-slate-400 border border-slate-600 dark:border-slate-500 ml-1 rounded-sm shadow-md`} title="2.5kg Collar"></div>
        }
      </div>
    );

  } else { // unit is 'lbs'
    const breakdownText = getLbsPlateBreakdown(totalWeight);
    return (
      <div className="h-10 flex items-center">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {breakdownText}
          </p>
      </div>
    );
  }
};

export default PlateDisplay;