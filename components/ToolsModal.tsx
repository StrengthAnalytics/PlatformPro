import React, { useState, useMemo } from 'react';
import PlateDisplay from './PlateDisplay';
import { getPlateBreakdown, roundToNearest2point5 } from '../utils/calculator';
import IconButton from './IconButton';

const StandalonePlateCalculator: React.FC = () => {
    const [weight, setWeight] = useState('');
    const [includeCollars, setIncludeCollars] = useState(false);

    const plateBreakdownText = useMemo(() => {
        const weightKg = parseFloat(weight);
        if (isNaN(weightKg) || weightKg <= 0) return '';
        return getPlateBreakdown(weightKg, includeCollars);
    }, [weight, includeCollars]);

    const handleWeightBlur = () => {
        const numericWeight = parseFloat(weight);
        if (!isNaN(numericWeight) && numericWeight > 0) {
            setWeight(roundToNearest2point5(numericWeight).toString());
        } else {
            setWeight('');
        }
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-center mb-3 text-slate-800 dark:text-slate-100">Quick Plate Calculator (kg)</h3>
            <div className="flex flex-col gap-4 px-2 bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                <input
                    type="number"
                    step="2.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onBlur={handleWeightBlur}
                    placeholder="Enter weight in kg"
                    className="w-full text-center p-2 border rounded-md shadow-sm bg-white text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                />
                <div className="flex justify-center items-center gap-2">
                    <input
                        type="checkbox"
                        id="calculator-collars"
                        checked={includeCollars}
                        onChange={(e) => setIncludeCollars(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:text-indigo-400 dark:bg-slate-600 dark:border-slate-500"
                    />
                    <label htmlFor="calculator-collars" className="text-sm text-slate-600 dark:text-slate-300">
                        Include 2.5kg Collars
                    </label>
                </div>
                <div className="min-h-[60px] flex items-center justify-center">
                    <PlateDisplay weight={weight} unit="kg" includeCollars={includeCollars} size="lg" />
                </div>
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-md min-h-[36px]">
                    {plateBreakdownText}
                </div>
            </div>
        </div>
    );
};


interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tools-modal-title"
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl max-w-md w-full relative outline-none animate-popIn"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 id="tools-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Tools & Utilities</h3>
        
        <StandalonePlateCalculator />

        <div className="mt-8 text-right">
            <IconButton 
                onClick={onClose} 
                className="!px-8"
            >
              Done
            </IconButton>
        </div>
      </div>
    </div>
  );
};

export default ToolsModal;