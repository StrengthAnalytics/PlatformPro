import React from 'react';

interface ViewToggleProps {
  mode: 'pro' | 'lite';
  onToggle: (mode: 'pro' | 'lite') => void;
  disabled?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ mode, onToggle, disabled = false }) => {
  const baseClasses = 'px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white';
  const activeClasses = 'bg-white text-slate-900 shadow';
  const inactiveClasses = 'bg-transparent text-slate-300 hover:bg-slate-700';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <div className={`bg-slate-800 p-1 rounded-lg flex items-center justify-center gap-1 ${disabled ? disabledClasses : ''}`} data-tour-id="view-toggle">
      <button
        onClick={() => onToggle('pro')}
        className={`${baseClasses} ${mode === 'pro' ? activeClasses : inactiveClasses}`}
        aria-pressed={mode === 'pro'}
        disabled={disabled}
      >
        Pro
      </button>
      <button
        onClick={() => onToggle('lite')}
        className={`${baseClasses} ${mode === 'lite' ? activeClasses : inactiveClasses}`}
        aria-pressed={mode === 'lite'}
        disabled={disabled}
      >
        Lite
      </button>
    </div>
  );
};

export default ViewToggle;
