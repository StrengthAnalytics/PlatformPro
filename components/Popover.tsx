import React, { useEffect, useRef } from 'react';
import IconButton from './IconButton';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ isOpen, onClose, title, children }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the popover for accessibility
      popoverRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popover-title"
    >
      <div
        ref={popoverRef}
        tabIndex={-1}
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl max-w-md w-full relative outline-none"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 id="popover-title" className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
        <div className="text-slate-700 dark:text-slate-300">
          {children}
        </div>
        <div className="mt-6 text-right">
          <IconButton onClick={onClose} className="!px-5">
            Got it!
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default Popover;