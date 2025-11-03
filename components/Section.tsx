import React from 'react';
import InfoIcon from './InfoIcon';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  onHelpClick?: () => void;
}

const Section: React.FC<SectionProps> = ({ title, children, headerAction, onHelpClick }) => {
  return (
    <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {title}
            </h3>
            {onHelpClick && <InfoIcon onClick={onHelpClick} />}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

export default Section;