import React from 'react';
import IconButton from './IconButton';

interface WizardNavigationProps {
  step: number;
  totalSteps: number;
  setStep: (step: number) => void;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({ step, totalSteps, setStep }) => {
  const stepLabels = ['Setup', 'Plan Lifts', 'Review & Export'];

  return (
    <div className="mt-8 flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md sticky bottom-4 z-20">
      <IconButton
        onClick={() => setStep(step - 1)}
        disabled={step === 1}
        variant="secondary"
        className="!px-6"
      >
        &larr; Back{step > 1 ? ` to ${stepLabels[step - 2]}` : ''}
      </IconButton>

      <span className="hidden sm:block text-sm font-semibold text-slate-500 dark:text-slate-400">
        Step {step} of {totalSteps}
      </span>

      <IconButton
        onClick={() => setStep(step + 1)}
        disabled={step === totalSteps}
        variant="primary"
        className="!px-6"
      >
        {step < totalSteps ? `Next: ${stepLabels[step]}` : 'All Done'} &rarr;
      </IconButton>
    </div>
  );
};

export default WizardNavigation;