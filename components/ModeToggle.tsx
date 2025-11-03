import React from 'react';

interface ModeToggleProps {
  modes: { key: string; label: string }[];
  activeMode: string;
  onToggle: (mode: string) => void;
  disabled?: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ modes, activeMode, onToggle, disabled = false }) => {
  const baseClasses = 'px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white';
  const activeClasses = 'bg-white text-slate-900 shadow';
  const inactiveClasses = 'bg-transparent text-slate-300 hover:bg-slate-700';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <div className={`bg-slate-800 p-1 rounded-lg flex items-center justify-center gap-1 ${disabled ? disabledClasses : ''}`}>
      {modes.map(mode => (
        <button
          key={mode.key}
          onClick={() => onToggle(mode.key)}
          className={`${baseClasses} ${activeMode === mode.key ? activeClasses : inactiveClasses}`}
          aria-pressed={activeMode === mode.key}
          disabled={disabled && mode.key !== 'test'}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default ModeToggle;
