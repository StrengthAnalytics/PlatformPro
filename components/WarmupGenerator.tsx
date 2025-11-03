import React, { useState, useRef, useEffect } from 'react';
import Section from './Section';
import IconButton from './IconButton';
import Popover from './Popover';
import { generateCustomWarmups, kgToLbs, lbsToKg, getPlateBreakdown, getLbsPlateBreakdownPerSide } from '../utils/calculator';
import type { WarmupSet, LiftType } from '../types';
import WarmupResultDisplay from './WarmupResultDisplay';

type Unit = 'kg' | 'lbs';
type PlateType = '20kg' | '25kg';

// Add global declaration for the htmlToImage library loaded via CDN
declare global {
  interface Window {
    htmlToImage: any;
  }
}

const WarmupGenerator: React.FC = () => {
    const [targetWeight, setTargetWeight] = useState('');
    const [unit, setUnit] = useState<Unit>('kg');
    const [plateType, setPlateType] = useState<PlateType>('25kg');
    const [includeCollars, setIncludeCollars] = useState<boolean>(false);
    const [liftType, setLiftType] = useState<LiftType>('squat');
    const [warmupPlan, setWarmupPlan] = useState<WarmupSet[] | null>(null);
    const [error, setError] = useState('');
    const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
    const [platePopover, setPlatePopover] = useState({ isOpen: false, title: '', content: '' });
    const resultsRef = useRef<HTMLDivElement>(null);
    const shareableRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (warmupPlan && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [warmupPlan]);

    const handleGenerate = () => {
        const wt = parseFloat(targetWeight);

        if (isNaN(wt) || wt <= 0) {
            setError('Please enter a valid target weight.');
            setWarmupPlan(null);
            return;
        }

        setError('');
        const plan = generateCustomWarmups({
            targetWeight: wt,
            targetReps: 1, // Assume single rep for work set
            unit,
            liftType,
        });
        setWarmupPlan(plan);
    };

    const handleReset = () => {
        setTargetWeight('');
        setLiftType('squat');
        setWarmupPlan(null);
        setError('');
    };

    const handleUnitChange = (newUnit: Unit) => {
        if (unit === newUnit) return;

        let newWeightStr = targetWeight;
        const currentWeight = parseFloat(targetWeight);
        if (!isNaN(currentWeight) && currentWeight > 0) {
            const newWeight = newUnit === 'lbs' ? kgToLbs(currentWeight) : lbsToKg(currentWeight);
            newWeightStr = String(newWeight);
            setTargetWeight(newWeightStr);
        }
        
        setUnit(newUnit);
        
        // Autogenerate if a plan already exists
        if (warmupPlan) {
            const wt = parseFloat(newWeightStr);
            if (!isNaN(wt) && wt > 0) {
                setError('');
                const plan = generateCustomWarmups({
                    targetWeight: wt,
                    targetReps: 1,
                    unit: newUnit,
                    liftType,
                });
                setWarmupPlan(plan);
            } else {
                setWarmupPlan(null);
            }
        }
    };

    const handleRowClick = (weightStr: string) => {
        const weightNum = parseFloat(weightStr);
        if (isNaN(weightNum) || weightNum <= 0) return;

        const breakdown = unit === 'kg'
            ? getPlateBreakdown(weightNum, includeCollars, plateType)
            : getLbsPlateBreakdownPerSide(weightNum);

        const barWeight = unit === 'kg' ? 20 : 45;
        const collarWeight = unit === 'kg' && includeCollars ? 5 : 0;
        const isBarOnly = weightNum === barWeight || (unit === 'kg' && includeCollars && weightNum === barWeight + collarWeight);

        let content: string;
        if (isBarOnly || breakdown === 'None' || !breakdown) {
            content = `Just the bar${unit === 'kg' && includeCollars && weightNum > barWeight ? ' with collars' : ''}. No plates on the side.`;
        } else if (breakdown === 'Invalid weight' || breakdown === 'Unloadable') {
            content = "This weight is not possible with standard plates.";
        } else {
            content = `Load per side: ${breakdown}`;
        }

        setPlatePopover({
            isOpen: true,
            title: `Plate Loading for ${weightStr} ${unit}`,
            content: content
        });
    };

    const handleShareImage = async () => {
        if (!shareableRef.current) {
            alert('Cannot share image right now. Please try again.');
            return;
        }

        if (!navigator.share || !navigator.canShare) {
            alert('Image sharing is not supported on your browser.');
            return;
        }

        setIsSharing(true);

        try {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const bgColor = isDarkMode ? '#0f172a' : '#f1f5f9'; // slate-900 or slate-100

            const dataBlob = await window.htmlToImage.toBlob(shareableRef.current, {
                quality: 0.95,
                backgroundColor: bgColor,
                pixelRatio: 2, // Increase resolution
                style: { padding: '1rem' } // Add some padding around the image
            });

            if (!dataBlob) {
                throw new Error('Could not generate image.');
            }

            const file = new File([dataBlob], 'warmup-plan.png', { type: 'image/png' });
            
            const shareData = {
                files: [file],
                title: `Warm-up for ${liftType}`,
                text: `Here's the warm-up plan for a ${targetWeight} ${unit} ${liftType}.`,
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error("Cannot share this file type.");
            }
        } catch (err) {
            console.error('Sharing failed:', err);
            alert(`Could not share the image. Error: ${(err as Error).message}`);
        } finally {
            setIsSharing(false);
        }
    };

    const helpContent = (
      <>
        <p className="mb-3 text-slate-600 dark:text-slate-300">
            This tool generates a structured warm-up plan based on your target working set for any given day. It uses pre-defined, experience-based tables to find the closest appropriate warm-up progression.
        </p>
        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-2">
            <li>
                <strong>Enter Target Weight:</strong> Input the weight of your main working set for the day.
            </li>
            <li>
                <strong>Select Settings:</strong> Choose the lift type, unit (kg/lbs), and if using kg, your heaviest plate type and whether to include collars.
            </li>
            <li>
                <strong>Generate:</strong> Click "Generate Warm-ups" to see your plan.
            </li>
            <li>
                <strong>View & Share:</strong> The plan shows each warm-up set with weight, reps, and a plate visual. Click any row for a text description, or click "Share Image" to send it.
            </li>
        </ol>
      </>
    );
    
    const segmentButtonBase = 'px-4 py-1 text-sm font-semibold rounded-md transition-colors';
    const segmentButtonActive = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow';
    const segmentButtonInactive = 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50';

    return (
        <>
            <Popover 
                isOpen={isHelpPopoverOpen}
                onClose={() => setIsHelpPopoverOpen(false)}
                title="How to use the Warm-up Generator"
            >
                {helpContent}
            </Popover>
            <Popover 
                isOpen={platePopover.isOpen}
                onClose={() => setPlatePopover(prev => ({ ...prev, isOpen: false }))}
                title={platePopover.title}
            >
                <p className="text-lg text-center font-semibold text-slate-700 dark:text-slate-200">{platePopover.content}</p>
            </Popover>
            <div className="animate-fadeIn max-w-4xl mx-auto">
                <Section title="Work Set Details" onHelpClick={() => setIsHelpPopoverOpen(true)}>
                    <div className="md:col-span-2 lg:col-span-3">
                        <div className="max-w-md mx-auto flex flex-col items-center gap-8">
                             {/* Core Inputs */}
                            <div className="flex flex-col w-full">
                                <label htmlFor="target-weight" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Target Weight</label>
                                <input
                                    id="target-weight" type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
                                    placeholder={`e.g., 100`}
                                    className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 text-lg" />
                            </div>
                             {/* Settings */}
                            <div className="flex flex-col gap-6 w-full items-center">
                                <div className="flex flex-col items-center">
                                    <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Lift Type</label>
                                    <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex gap-1">
                                        {(['squat', 'bench', 'deadlift'] as LiftType[]).map(lift => (
                                            <button key={lift} onClick={() => setLiftType(lift)} className={`${segmentButtonBase} ${liftType === lift ? segmentButtonActive : segmentButtonInactive} capitalize`}>
                                                {lift}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Unit</label>
                                    <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex gap-1">
                                        <button onClick={() => handleUnitChange('kg')} className={`${segmentButtonBase} ${unit === 'kg' ? segmentButtonActive : segmentButtonInactive}`}>kg</button>
                                        <button onClick={() => handleUnitChange('lbs')} className={`${segmentButtonBase} ${unit === 'lbs' ? segmentButtonActive : segmentButtonInactive}`}>lbs</button>
                                    </div>
                                </div>
                                {unit === 'kg' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
                                    <div className="flex flex-col items-center">
                                            <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Heaviest Plates</label>
                                            <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex gap-1">
                                                <button onClick={() => setPlateType('20kg')} className={`${segmentButtonBase} ${plateType === '20kg' ? segmentButtonActive : segmentButtonInactive}`}>20kg</button>
                                                <button onClick={() => setPlateType('25kg')} className={`${segmentButtonBase} ${plateType === '25kg' ? segmentButtonActive : segmentButtonInactive}`}>25kg</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Collars</label>
                                            <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex items-center h-[34px]">
                                                <input type="checkbox" id="warmup-gen-collars" checked={includeCollars} onChange={(e) => setIncludeCollars(e.target.checked)} className="h-4 w-4 rounded border-slate-400 text-slate-600 focus:ring-slate-500 mx-2" />
                                                <label htmlFor="warmup-gen-collars" className="text-sm text-slate-600 dark:text-slate-300 pr-2 cursor-pointer">Include 2.5kg</label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="md:col-span-2 lg:col-span-3 mt-8 flex justify-center gap-4">
                        <IconButton onClick={handleReset} variant="danger" className="!text-lg !py-3 !px-10">
                            Reset
                        </IconButton>
                        <IconButton onClick={handleGenerate} variant="success" className="!text-lg !py-3 !px-10">
                            Generate Warm-ups
                        </IconButton>
                    </div>
                     {error && <p className="text-red-500 text-center mt-4 md:col-span-2 lg:col-span-3">{error}</p>}
                </Section>

                <div ref={resultsRef} className="mt-8">
                    {warmupPlan ? (
                        <>
                            <WarmupResultDisplay 
                                ref={shareableRef}
                                plan={warmupPlan} 
                                unit={unit} 
                                liftType={liftType}
                                targetWeight={targetWeight}
                                targetReps="1"
                                plateType={plateType}
                                includeCollars={includeCollars}
                                onRowClick={handleRowClick}
                            />
                            <div className="mt-6 flex justify-center">
                                <IconButton onClick={handleShareImage} variant="info" disabled={isSharing}>
                                    {isSharing ? 'Generating...' : 'Share Image'}
                                </IconButton>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <p>Enter your work set details to generate a custom warm-up plan.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WarmupGenerator;