import React, { useState } from 'react';
import InfoIcon from './InfoIcon';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
  onHelpClick?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, initiallyOpen = false, onHelpClick }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div className="bg-white dark:bg-slate-700 rounded-lg shadow-md mb-8 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{title}</h3>
            {onHelpClick && <InfoIcon onClick={(e) => { e.stopPropagation(); onHelpClick(); }} />}
        </div>
        <svg
          className={`w-6 h-6 text-slate-500 dark:text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-0">
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                 {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;