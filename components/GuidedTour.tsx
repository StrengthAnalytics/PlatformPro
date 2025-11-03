import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import type { TourStep } from '../tourSteps';

interface GuidedTourProps {
  isActive: boolean;
  stepIndex: number;
  steps: TourStep[];
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isActive, stepIndex, steps, onNext, onBack, onSkip }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const step = steps[stepIndex];
  const isFinalStep = stepIndex === steps.length - 1;

  useLayoutEffect(() => {
    if (!isActive || !step?.selector) {
      setTargetRect(null);
      return;
    }

    const targetElement = document.querySelector(step.selector) as HTMLElement;
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        // Special case for scrolling into view
        if(step.scrollTo) {
           targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
      setTargetRect(null);
    }
  }, [isActive, stepIndex, step]);

  // FIX: Refactored the useEffect to correctly handle event listeners and cleanup.
  // The previous implementation had a syntax error and incorrect logic for event listener removal.
  useEffect(() => {
    if (!isActive || !step) return;

    const handleInteraction = () => {
        onNext();
    };

    const targetElement = step.selector ? document.querySelector(step.selector) : null;

    if (targetElement && step.action) {
        const eventType = step.action.type === 'click' ? 'click' : 'input';
        targetElement.addEventListener(eventType, handleInteraction);
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onSkip();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
        if (targetElement && step.action) {
            const eventType = step.action.type === 'click' ? 'click' : 'input';
            targetElement.removeEventListener(eventType, handleInteraction);
        }
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, step, onNext, onSkip]);

  const getPopoverPosition = (): React.CSSProperties => {
    if (!targetRect || !popoverRef.current) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const { top, left, width, height, right, bottom } = targetRect;
    const popoverHeight = popoverRef.current.offsetHeight;
    const popoverWidth = popoverRef.current.offsetWidth;
    const offset = 12;

    const positions = {
      bottom: { top: bottom + offset, left: left + width / 2 - popoverWidth / 2 },
      top: { top: top - popoverHeight - offset, left: left + width / 2 - popoverWidth / 2 },
      right: { top: top + height / 2 - popoverHeight / 2, left: right + offset },
      left: { top: top + height / 2 - popoverHeight / 2, left: left - popoverWidth - offset },
    };

    let pos = positions[step.placement || 'bottom'];
    
    // Adjust if it goes off-screen
    if (pos.left < 10) pos.left = 10;
    if (pos.left + popoverWidth > window.innerWidth - 10) pos.left = window.innerWidth - popoverWidth - 10;
    if (pos.top < 10) pos.top = 10;
    if (pos.top + popoverHeight > window.innerHeight - 10) pos.top = window.innerHeight - popoverHeight - 10;

    return pos;
  };

  if (!isActive || !step) return null;

  const spotlightStyle: React.CSSProperties = targetRect
    ? {
        width: targetRect.width + 12,
        height: targetRect.height + 12,
        top: targetRect.top - 6,
        left: targetRect.left - 6,
        borderRadius: '8px',
        boxShadow: `0 0 0 500vmax rgba(15, 23, 42, 0.7)`,
      }
    : {};
    
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Spotlight */}
      <div 
        className={`absolute transition-all duration-300 ease-in-out animate-spotlightFadeIn`}
        style={spotlightStyle}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed bg-white dark:bg-slate-800 p-5 rounded-lg shadow-2xl max-w-sm w-full transition-all duration-300 ease-in-out animate-popIn"
        style={getPopoverPosition()}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <h3 id="tour-title" className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{step.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm">{step.content}</p>
        <div className="flex justify-between items-center mt-4">
          {/* FIX: Wrapped onSkip in an arrow function to prevent passing the MouseEvent. */}
          <button onClick={() => onSkip()} className="text-xs text-slate-500 hover:underline">Skip Tour</button>
          <div className="flex gap-2">
            {/* FIX: Wrapped onBack in an arrow function to prevent passing the MouseEvent. */}
            {stepIndex > 0 && <button onClick={() => onBack()} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-sm font-semibold rounded-md">Back</button>}
            {!step.action && <button onClick={isFinalStep ? () => onSkip() : () => onNext()} className="px-3 py-1.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-sm font-semibold rounded-md">{isFinalStep ? 'Finish' : 'Next'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;