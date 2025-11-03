import React from 'react';
import IconButton from './IconButton';

interface UnitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: 'kg' | 'lbs';
  onUnitChange: (unit: 'kg' | 'lbs') => void;
}

const UnitSettingsModal: React.FC<UnitSettingsModalProps> = ({ isOpen, onClose, unit, onUnitChange }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-settings-title"
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl max-w-sm w-full relative outline-none animate-popIn"
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
        <h3 id="unit-settings-title" className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center">Warm-Up Units</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Select the unit for warm-up weights. Competition attempts will remain in kg.</p>
        
        <div className="flex items-center justify-center space-x-4 my-8">
            <span className={`font-bold text-xl transition-colors ${unit === 'kg' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                kg
            </span>
            <button
                onClick={() => onUnitChange(unit === 'kg' ? 'lbs' : 'kg')}
                className="relative inline-flex flex-shrink-0 h-8 w-16 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-slate-200 dark:bg-slate-700"
                role="switch"
                aria-checked={unit === 'lbs'}
            >
                <span className="sr-only">Use setting</span>
                <span
                aria-hidden="true"
                className={`
                    ${unit === 'lbs' ? 'translate-x-8' : 'translate-x-0'}
                    pointer-events-none inline-block h-7 w-7 rounded-full bg-white dark:bg-slate-500 shadow-lg transform ring-0 transition ease-in-out duration-200
                `}
                />
            </button>
            <span className={`font-bold text-xl transition-colors ${unit === 'lbs' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                lbs
            </span>
        </div>

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

export default UnitSettingsModal;
