import React from 'react';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-2 rounded-xl text-center group transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
      aria-label={`Launch ${title}`}
    >
      <div className="w-28 h-28 bg-white dark:bg-slate-700 rounded-3xl shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95 text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      <p className="font-semibold text-sm text-white">{title}</p>
    </button>
  );
};

export default ToolCard;