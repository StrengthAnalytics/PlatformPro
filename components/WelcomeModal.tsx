import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onStartTour, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Welcome to the Powerlifting Meet Planner!</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Would you like a quick tour to help you create your first plan in under 60 seconds?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100"
          >
            No, thanks
          </button>
          <button
            onClick={onStartTour}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-md shadow-sm transition-colors"
          >
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
