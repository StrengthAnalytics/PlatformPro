import React from 'react';
import { LiftsState, LiftType, ScoringFormula } from '../types';

interface SummarySidebarProps {
  lifterName: string;
  total: number;
  score: number;
  lifts: LiftsState;
  isEmbedded?: boolean;
  bodyWeight: string;
  gender: 'male' | 'female' | '';
  allAttemptsFilled: boolean;
  scoringFormula: ScoringFormula;
}

const AttemptCell: React.FC<{ value: string }> = ({ value }) => (
  <div className="flex items-center justify-center h-12 bg-slate-700 rounded-md">
    <span className="text-lg font-semibold text-white">{value || '-'}</span>
  </div>
);

const SummarySidebar: React.FC<SummarySidebarProps> = ({ lifterName, total, score, lifts, isEmbedded = false, bodyWeight, gender, allAttemptsFilled, scoringFormula }) => {
  const liftsOrder: LiftType[] = ['squat', 'bench', 'deadlift'];
  const containerClasses = isEmbedded 
    ? "bg-slate-700 text-white" 
    : "bg-slate-700 text-white p-6 rounded-lg shadow-xl";

  const formulaLabels: Record<ScoringFormula, string> = {
    ipfgl: 'IPF GL Score',
    dots: 'DOTS Score',
    wilks: 'Wilks Score',
  };

  const ScoreDisplay: React.FC = () => {
    if (total <= 0) {
        return <p className="text-3xl font-bold">--</p>;
    }
    const bw = parseFloat(bodyWeight);
    if (isNaN(bw) || bw <= 0) {
        return <p className="text-lg font-semibold text-yellow-400">Enter Body Weight</p>;
    }
    if (!gender) {
        return <p className="text-lg font-semibold text-yellow-400">Select Gender</p>;
    }
    return <p className="text-3xl font-bold">{score.toFixed(2)}</p>;
  }

  return (
    <div className={containerClasses} data-tour-id="summary-sidebar">
      <h2 className="text-2xl font-bold text-center mb-4">Plan Summary</h2>
      
      <div className="text-center mb-4">
        <p className="text-lg text-slate-300">Lifter</p>
        <p className="text-xl font-semibold truncate">{lifterName || 'N/A'}</p>
      </div>

      <div className="bg-slate-700/50 p-4 rounded-lg flex justify-around text-center mb-6">
        <div>
          <p className="text-sm font-medium text-slate-300">Predicted Total</p>
          <p className={`text-3xl font-bold ${total > 0 && !allAttemptsFilled ? 'text-yellow-400' : ''}`}>
            {total > 0 ? `${total} kg` : '--'}
          </p>
        </div>
        <div className="border-l border-slate-600"></div>
        <div className="h-16 flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-300">{formulaLabels[scoringFormula]}</p>
          <ScoreDisplay />
        </div>
      </div>

      <h3 className="text-xl font-bold text-center mb-3">Attempts Overview</h3>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-center">
        {/* Header Row */}
        <div></div>
        <div className="text-xs font-semibold text-slate-400">1st</div>
        <div className="text-xs font-semibold text-slate-400">2nd</div>
        <div className="text-xs font-semibold text-slate-400">3rd</div>

        {liftsOrder.map(lift => (
          <React.Fragment key={lift}>
            <div className="text-sm font-bold text-slate-300 capitalize pr-2 text-right">{lift}</div>
            <AttemptCell value={lifts[lift].attempts['1']} />
            <AttemptCell value={lifts[lift].attempts['2']} />
            <AttemptCell value={lifts[lift].attempts['3']} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SummarySidebar;