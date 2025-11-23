import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LiftType, LiftState, WarmupStrategy, Attempt } from '../types';
import IconButton from './IconButton';
import PlateDisplay from './PlateDisplay';
import InfoIcon from './InfoIcon';
import { getPlateBreakdown, getLbsPlateBreakdown, kgToLbs, lbsToKg } from '../utils/calculator';

interface AttemptInputProps {
  attempt: '1' | '2' | '3';
  value: string;
  showError: boolean;
  onChange: (attempt: '1' | '2' | '3', value: string) => void;
  planAttemptsInLbs?: boolean;
}

const AttemptInput: React.FC<AttemptInputProps> = ({ attempt, value, showError, onChange, planAttemptsInLbs }) => (
  <div className="flex flex-col items-center">
    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{attempt}{attempt === '1' ? 'st' : attempt === '2' ? 'nd' : 'rd'} Attempt {planAttemptsInLbs ? '(kg)' : ''}</label>
    <input
      type="number"
      step="2.5"
      placeholder="kg"
      value={value}
      onChange={(e) => onChange(attempt, e.target.value)}
      className={`w-full text-center p-2 border rounded-md shadow-sm transition-colors bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 ${showError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500'}`}
    />
  </div>
);

interface LiftSectionProps {
  liftType: LiftType;
  liftState: LiftState;
  unit: 'kg' | 'lbs';
  planAttemptsInLbs: boolean;
  isCoachingMode: boolean;
  onAttemptChange: (lift: LiftType, attempt: '1' | '2' | '3', value: string) => void;
  onWarmupChange: (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => void;
  onCueChange: (lift: LiftType, index: number, value: string) => void;
  onCoachingNoteChange: (lift: LiftType, value: string) => void;
  onCalculateAttempts: (lift: LiftType) => void;
  onGenerateWarmups: (lift: LiftType) => void;
  onReset: (lift: LiftType) => void;
  onCollarToggle: (lift: LiftType) => void;
  onHelpClick: () => void;
  onWarmupStrategyChange: (lift: LiftType, strategy: WarmupStrategy) => void;
  onDynamicWarmupSettingsChange: (lift: LiftType, field: keyof LiftState['dynamicWarmupSettings'], value: string) => void;
  onWarmupHelpClick: () => void;
  containerClassName?: string;
  autoGenerateWarmups: boolean;
}

const LiftSection: React.FC<LiftSectionProps> = ({
  liftType,
  liftState,
  unit,
  planAttemptsInLbs,
  isCoachingMode,
  onAttemptChange,
  onWarmupChange,
  onCueChange,
  onCoachingNoteChange,
  onCalculateAttempts,
  onGenerateWarmups,
  onReset,
  onCollarToggle,
  onHelpClick,
  onWarmupStrategyChange,
  onDynamicWarmupSettingsChange,
  onWarmupHelpClick,
  containerClassName,
  autoGenerateWarmups,
}) => {
  const { attempts, warmups, cues, error, includeCollars, warmupStrategy, dynamicWarmupSettings, openerForWarmups, coachingNote } = liftState;
  const [showCues, setShowCues] = useState(false);
  const [isGeneratingWarmups, setIsGeneratingWarmups] = useState(false);
  const prevWarmupsStringRef = useRef(JSON.stringify(warmups));

  const [isCalculating, setIsCalculating] = useState(false);
  // FIX: useRef requires an initial value. Provided `undefined` as the initial value and updated the type.
  const prevAttemptsRef = useRef<Attempt | undefined>(undefined);
  const [animatedAttempts, setAnimatedAttempts] = useState<{[k in keyof Attempt]?: boolean}>({});

  const handleCalculateClick = () => {
    prevAttemptsRef.current = attempts;
    setIsCalculating(true);
    onCalculateAttempts(liftType);
  };

  useEffect(() => {
    if (isCalculating && prevAttemptsRef.current) {
        const newlyAnimated: {[k in keyof Attempt]?: boolean} = {};
        if (attempts['1'] !== prevAttemptsRef.current['1']) newlyAnimated['1'] = true;
        if (attempts['2'] !== prevAttemptsRef.current['2']) newlyAnimated['2'] = true;
        if (attempts['3'] !== prevAttemptsRef.current['3']) newlyAnimated['3'] = true;

        if (Object.keys(newlyAnimated).length > 0) {
            setAnimatedAttempts(newlyAnimated);
            const timer = setTimeout(() => {
              setAnimatedAttempts({});
              setIsCalculating(false);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsCalculating(false);
        }
    }
  }, [attempts, isCalculating]);


  // Effect for warmup generation animation
  useEffect(() => {
    const currentWarmupsString = JSON.stringify(warmups);
    if (prevWarmupsStringRef.current !== currentWarmupsString) {
      const hasData = warmups.some(w => w.weight || w.reps);
      if (hasData) {
        setIsGeneratingWarmups(true);
        const timer = setTimeout(() => setIsGeneratingWarmups(false), 1000); // Animation duration should be longer than the cascade
        return () => clearTimeout(timer);
      }
    }
    prevWarmupsStringRef.current = currentWarmupsString;
  }, [warmups]);

  // Find the index of the last warmup set with any data.
  let lastPopulatedIndex = -1;
  for (let i = warmups.length - 1; i >= 0; i--) {
      if (warmups[i].weight || warmups[i].reps) {
          lastPopulatedIndex = i;
          break;
      }
  }

  // Determine how many rows to show.
  // Show all if none are populated.
  // Otherwise, show all populated rows + 1 extra for adding a new set, up to a max of 8.
  const numRowsToShow = lastPopulatedIndex === -1 
      ? warmups.length 
      : Math.min(lastPopulatedIndex + 2, warmups.length);

  const plateInfo = useMemo(() => {
    const opener = attempts['1'];
    if (!opener || isNaN(parseFloat(opener))) return '';
    
    const lastWarmup = [...warmups].reverse().find(w => w.weight && !isNaN(parseFloat(w.weight)));
    if (!lastWarmup) return '';

    const openerValue = parseFloat(opener);
    const lastWarmupValue = parseFloat(lastWarmup.weight);

    const openerPlates = getPlateBreakdown(openerValue, includeCollars);
    const lastWUPlates = unit === 'kg' 
      ? getPlateBreakdown(lastWarmupValue, includeCollars)
      : getLbsPlateBreakdown(lastWarmupValue);
    
    return `Opener (${opener}kg): ${openerPlates} | Last WU (${lastWarmupValue}${unit}): ${lastWUPlates}`;
  }, [attempts, warmups, includeCollars, unit]);

  const handleAttemptChange = (attempt: '1' | '2' | '3', value: string) => {
    onAttemptChange(liftType, attempt, value);
  };

  const handleLbsAttemptChange = (attempt: '1' | '2' | '3', lbsValue: string) => {
    const lbs = parseFloat(lbsValue);
    const kg = lbsToKg(lbs);
    onAttemptChange(liftType, attempt, lbsValue === '' ? '' : (kg > 0 ? kg.toString() : ''));
  };

  const hasWarmups = useMemo(() => warmups.some(w => w.weight), [warmups]);
  const openerExists = useMemo(() => attempts['1'] && !isNaN(parseFloat(attempts['1'])), [attempts]);
  const warmupButtonText = hasWarmups ? 'Regenerate Warm-ups' : 'Generate Warm-ups';

  const isStale = openerForWarmups &&
                  openerForWarmups !== attempts['1'] &&
                  hasWarmups;
  
  const LbsAttemptRow = (
      <div className="grid grid-cols-3 gap-3 mb-4">
          {(['1', '2', '3'] as const).map(attemptNum => {
              const kg = parseFloat(attempts[attemptNum]);
              const lbsValue = !isNaN(kg) && kg > 0 ? kgToLbs(kg).toString() : '';
              return (
                  <div className="flex flex-col items-center" key={`lbs-${attemptNum}`}>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{attemptNum}{attemptNum === '1' ? 'st' : attemptNum === '2' ? 'nd' : 'rd'} Attempt (lbs)</label>
                      <input
                          type="number"
                          step="5"
                          placeholder="lbs"
                          defaultValue={lbsValue}
                          key={`${liftType}-${attemptNum}-${lbsValue}`} // Re-mount component when value changes from props
                          onBlur={(e) => handleLbsAttemptChange(attemptNum, e.target.value)}
                          className={`w-full text-center p-2 border rounded-md shadow-sm transition-colors bg-sky-50 text-slate-900 dark:bg-sky-900/50 dark:text-slate-50 border-sky-300 dark:border-sky-700 focus:border-sky-500 focus:ring-sky-500`}
                      />
                  </div>
              );
          })}
      </div>
  );


  return (
    <div className={containerClassName || "bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md mb-8"}>
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-center items-center gap-2 mb-3">
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Competition Attempts</h4>
            <InfoIcon onClick={onHelpClick} />
        </div>
        
        {planAttemptsInLbs && LbsAttemptRow}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={animatedAttempts['1'] ? 'animate-flipIn' : ''}>
            <AttemptInput attempt="1" value={attempts['1']} showError={error} onChange={handleAttemptChange} planAttemptsInLbs={planAttemptsInLbs} />
          </div>
          <div className={animatedAttempts['2'] ? 'animate-flipIn' : ''}>
            <AttemptInput attempt="2" value={attempts['2']} showError={false} onChange={handleAttemptChange} planAttemptsInLbs={planAttemptsInLbs} />
          </div>
          <div className={animatedAttempts['3'] ? 'animate-flipIn' : ''}>
            <AttemptInput attempt="3" value={attempts['3']} showError={false} onChange={handleAttemptChange} planAttemptsInLbs={planAttemptsInLbs} />
          </div>
        </div>
        {error && <p className="text-red-600 text-xs text-center -mt-2 mb-4">Enter 1st attempt to generate warm-ups, or 1st/3rd to calculate.</p>}
        <div className="grid grid-cols-2 gap-3">
            <IconButton
                onClick={handleCalculateClick}
            >
                Calculate
            </IconButton>
            <IconButton
                onClick={() => onReset(liftType)}
                variant="danger"
            >
                Reset
            </IconButton>
        </div>
      </div>

      {!autoGenerateWarmups && (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center items-center gap-2 mb-3">
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Warm-up Strategy</h4>
                <InfoIcon onClick={onWarmupHelpClick} />
            </div>
            <div className="flex justify-center gap-6 mb-4">
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id={`${liftType}-default`} 
                  name={`${liftType}-strategy`} 
                  value="default" 
                  checked={warmupStrategy === 'default'} 
                  onChange={() => onWarmupStrategyChange(liftType, 'default')} 
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 dark:text-indigo-400 dark:bg-slate-600 dark:border-slate-500"
                />
                <label htmlFor={`${liftType}-default`} className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Default (Recommended)</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id={`${liftType}-dynamic`} 
                  name={`${liftType}-strategy`} 
                  value="dynamic" 
                  checked={warmupStrategy === 'dynamic'} 
                  onChange={() => onWarmupStrategyChange(liftType, 'dynamic')} 
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 dark:text-indigo-400 dark:bg-slate-600 dark:border-slate-500"
                />
                <label htmlFor={`${liftType}-dynamic`} className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Dynamic</label>
              </div>
            </div>
            
            {warmupStrategy === 'dynamic' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex flex-col items-center">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"># of Sets</label>
                  <input
                    type="number"
                    value={dynamicWarmupSettings.numSets}
                    onChange={(e) => onDynamicWarmupSettingsChange(liftType, 'numSets', e.target.value)}
                    className="w-full text-center p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Start Weight (kg)</label>
                  <input
                    type="number"
                    step="2.5"
                    value={dynamicWarmupSettings.startWeight}
                    onChange={(e) => onDynamicWarmupSettingsChange(liftType, 'startWeight', e.target.value)}
                    className="w-full text-center p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Final WU % of Opener</label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="100"
                    value={dynamicWarmupSettings.finalWarmupPercent}
                    onChange={(e) => onDynamicWarmupSettingsChange(liftType, 'finalWarmupPercent', e.target.value)}
                    className="w-full text-center p-2 border rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                <IconButton 
                    onClick={() => onGenerateWarmups(liftType)} 
                    disabled={!openerExists}
                    variant={isStale ? 'warning' : 'success'}
                    className={isStale ? 'animate-pulse' : ''}
                    aria-label={hasWarmups ? 'Regenerate warmups with new settings' : 'Generate warmups based on opener'}
                >
                    {warmupButtonText}
                </IconButton>
            </div>
          </div>
      )}

      <div>
        <div className="mb-3 text-center">
          <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Warm-ups</h4>
        </div>

        {unit === 'kg' && (
            <div className="flex items-center justify-center gap-2 mb-4">
                <input
                type="checkbox"
                id={`${liftType}-collars`}
                checked={includeCollars}
                onChange={() => onCollarToggle(liftType)}
                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:text-indigo-400 dark:bg-slate-700 dark:border-slate-600"
                />
                <label htmlFor={`${liftType}-collars`} className="text-sm text-slate-600 dark:text-slate-400">
                Include 2.5kg Collars in Loading
                </label>
            </div>
        )}

        <div className="grid grid-cols-[30px_90px_60px_1fr] gap-x-3 gap-y-2 items-center text-center text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            <div className="text-xs">Set</div>
            <div className="text-xs">Weight ({unit})</div>
            <div className="text-xs">Reps</div>
            <div className="text-xs">Plate Loading (one side)</div>
        </div>
         {warmups.slice(0, numRowsToShow).map((set, index) => (
          <div 
            key={index} 
            className={`grid grid-cols-[30px_90px_60px_1fr] gap-x-3 gap-y-2 items-center mb-1 ${isGeneratingWarmups ? 'animate-cascadeIn' : ''}`}
            style={isGeneratingWarmups ? { animationDelay: `${index * 50}ms`, opacity: 0 } : {}}
            >
            <div className="text-slate-500 dark:text-slate-400 font-semibold text-center text-sm">{index + 1}</div>
            <input 
                type="number" 
                step={unit === 'kg' ? "2.5" : "5"} 
                placeholder={unit}
                value={set.weight}
                onChange={(e) => onWarmupChange(liftType, index, 'weight', e.target.value)}
                className="w-full text-center p-2 border rounded-md shadow-sm text-sm bg-slate-50 text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            <input 
                type="text" 
                placeholder="reps" 
                value={set.reps}
                onChange={(e) => onWarmupChange(liftType, index, 'reps', e.target.value)}
                className="w-full text-center p-2 border rounded-md shadow-sm text-sm bg-slate-50 text-slate-900 border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600" />
            <div className="flex justify-start items-center pl-2">
                <PlateDisplay weight={set.weight} unit={unit} includeCollars={includeCollars} />
            </div>
          </div>
        ))}
        {plateInfo && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">{plateInfo}</p>}
      </div>
    </div>
  );
};

export default LiftSection;