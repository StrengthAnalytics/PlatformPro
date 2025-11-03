import React from 'react';
import SummarySidebar from './SummarySidebar';
import { LiftsState, ScoringFormula } from '../types';

interface MobileSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  lifterName: string;
  total: number;
  score: number;
  lifts: LiftsState;
  bodyWeight: string;
  gender: 'male' | 'female' | '';
  allAttemptsFilled: boolean;
  scoringFormula: ScoringFormula;
}

const MobileSummarySheet: React.FC<MobileSummarySheetProps> = ({ isOpen, onClose, ...summaryProps }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet Container */}
      <div 
        className={`fixed bottom-0 left-0 right-0 rounded-t-2xl p-4 pt-2 pb-6 transition-transform duration-300 ease-in-out z-50 lg:hidden bg-slate-700 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-sheet-title"
      >
        <div className="flex justify-center mb-2" onClick={onClose} role="button" aria-label="Close summary">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>
        <h2 id="summary-sheet-title" className="sr-only">Plan Summary</h2>
        <SummarySidebar {...summaryProps} isEmbedded />
        <button 
          onClick={onClose} 
          className="w-full mt-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </>
  );
};

export default MobileSummarySheet;