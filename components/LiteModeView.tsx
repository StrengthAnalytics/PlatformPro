import React, { useState } from 'react';
import { AppState, LiftType } from '../types';
import Section from './Section';
import LiteModePlanDisplay from './LiteModePlanDisplay';
import IconButton from './IconButton';

interface LiteModeViewProps {
  appState: AppState;
  onBuildPlan: (name: string, thirds: Record<LiftType, string>) => void;
  onLifterNameChange: (name: string) => void;
  onAttemptChange: (lift: LiftType, attempt: '1' | '2' | '3', value: string) => void;
  onWarmupChange: (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => void;
  onResetPlan: () => void;
  onLaunchGameDay: () => void;
  onSaveLitePDF: () => void;
  onImportPlanClick: () => void;
  onHelpClick: () => void;
}

const LiteModeView: React.FC<LiteModeViewProps> = ({ 
    appState, 
    onBuildPlan, 
    onLifterNameChange,
    onAttemptChange,
    onWarmupChange,
    onResetPlan,
    onLaunchGameDay,
    onSaveLitePDF,
    onImportPlanClick,
    onHelpClick
}) => {
  const [thirds, setThirds] = useState<Record<LiftType, string>>({ squat: '', bench: '', deadlift: '' });
  
  // Determine if a plan exists in the main app state. This is more reliable than local state.
  const planExistsInState = !!(appState.lifts.squat.attempts['1'] || appState.lifts.bench.attempts['1'] || appState.lifts.deadlift.attempts['1']);

  const handleBuildClick = () => {
    onBuildPlan(appState.details.lifterName, thirds);
  };
  
  const handleResetClick = () => {
    setThirds({ squat: '', bench: '', deadlift: '' });
    onResetPlan();
  };

  const allInputsFilled = appState.details.lifterName && thirds.squat && thirds.bench && thirds.deadlift;

  const handleThirdChange = (lift: LiftType, value: string) => {
    setThirds(prev => ({
        ...prev,
        [lift]: value,
    }));
  };

  const renderInput = (label: string, lift: LiftType) => (
      <div className="flex flex-col">
          <label htmlFor={`lite-${lift}`} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label>
          <input
              id={`lite-${lift}`}
              type="number"
              step="2.5"
              placeholder="kg"
              value={thirds[lift]}
              onChange={e => handleThirdChange(lift, e.target.value)}
              className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
          />
      </div>
  );

  if (planExistsInState) {
    return (
        <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Plan for:</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{appState.details.lifterName || 'Lifter'}</h3>
                    </div>
                    <IconButton onClick={handleResetClick} variant="secondary">
                        Start New Plan
                    </IconButton>
                </div>
                <LiteModePlanDisplay 
                    lifts={appState.lifts} 
                    unit={appState.details.unit} 
                    onAttemptChange={onAttemptChange}
                    onWarmupChange={onWarmupChange}
                />
            </div>

            <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mt-8">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Export Plan</h3>
                <div className="flex justify-center">
                    <button onClick={onSaveLitePDF} className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to PDF</button>
                </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-lg shadow-md mt-8">
              <h3 className="text-2xl font-bold mb-2">Ready for the Platform?</h3>
              <p className="text-orange-100 mb-4">
                Switch to a simplified, high-contrast view for use during the competition.
              </p>
              <button
                onClick={onLaunchGameDay}
                className="px-8 py-4 bg-white hover:bg-orange-50 text-orange-600 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-xl"
                aria-label="Enter Game Day Mode"
              >
                🚀 Launch Game Day Mode
              </button>
            </div>
        </main>
    );
  }

  return (
    <main className="flex-1 min-w-0">
        <Section title="Create a Quick Plan" onHelpClick={onHelpClick}>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="flex flex-col">
                    <label htmlFor="lite-lifterName" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Lifter Name</label>
                    <input
                        id="lite-lifterName"
                        type="text"
                        placeholder="e.g., Jane Smith"
                        value={appState.details.lifterName}
                        onChange={e => onLifterNameChange(e.target.value)}
                        className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
                    />
                </div>
                {renderInput("Squat 3rd Attempt", 'squat')}
                {renderInput("Bench 3rd Attempt", 'bench')}
                {renderInput("Deadlift 3rd Attempt", 'deadlift')}
            </div>
        </Section>
        <div className="flex flex-col items-center mt-8 gap-4">
            <IconButton
                onClick={handleBuildClick}
                disabled={!allInputsFilled}
                className="!text-xl !py-4 !px-12"
            >
                Build My Plan
            </IconButton>
            <span className="text-slate-500 dark:text-slate-400">or</span>
            <IconButton
                onClick={onImportPlanClick}
                variant="success"
            >
                Import a Plan...
            </IconButton>
        </div>
    </main>
  );
};

export default LiteModeView;