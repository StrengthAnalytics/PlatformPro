// FIX: Import 'useCallback' from 'react' to resolve 'Cannot find name' error.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Section from './Section';
import IconButton from './IconButton';
import Popover from './Popover';
import ModeToggle from './ModeToggle';
import InfoIcon from './InfoIcon';
import { kgToLbs, lbsToKg } from '../utils/calculator';
import { exportOneRepMaxToPDF, savePdf, sharePdf } from '../utils/exportHandler';
import { BrandingState } from '../types';

// --- TRAINING LOAD CALCULATOR COMPONENT ---

const TrainingLoadCalculator: React.FC = () => {
    const [est1RM, setEst1RM] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [effortMode, setEffortMode] = useState<'rir' | 'rpe'>('rir');
    const [effortValue, setEffortValue] = useState<number>(2);
    const [rounding, setRounding] = useState<'none' | '1' | '2.5' | '5'>('2.5');

    // --- Calculation Logic Ported from User's Example ---
    const repMaxTable = useMemo(() => [
        {reps: 1, percent: 1.00}, {reps: 2, percent: 0.972}, {reps: 3, percent: 0.944},
        {reps: 4, percent: 0.917}, {reps: 5, percent: 0.889}, {reps: 6, percent: 0.853},
        {reps: 7, percent: 0.821}, {reps: 8, percent: 0.794}, {reps: 9, percent: 0.770},
        {reps: 10, percent: 0.750}, {reps: 11, percent: 0.732}, {reps: 12, percent: 0.729},
        {reps: 13, percent: 0.720}, {reps: 14, percent: 0.711}, {reps: 15, percent: 0.703}
    ], []);

    const getPercentFromReps = useCallback((reps: number) => {
        if (reps <= 1) return 1.00;
        const maxReps = repMaxTable[repMaxTable.length - 1].reps;
        const minPercent = repMaxTable[repMaxTable.length - 1].percent;
        if (reps >= maxReps) return minPercent;
        
        for (let i = 0; i < repMaxTable.length - 1; i++) {
            const p1 = repMaxTable[i];
            const p2 = repMaxTable[i+1];
            if (reps >= p1.reps && reps < p2.reps) { // Use < on p2.reps for correct interpolation
                return p1.percent + (reps - p1.reps) * (p2.percent - p1.percent) / (p2.reps - p1.reps);
            }
        }
        return minPercent;
    }, [repMaxTable]);

    const getFatigueFactor = (rir: number) => {
        switch(rir) {
            case 0: return 1.5; case 1: return 1.25; case 2: return 1.0;
            case 3: return 0.8; case 4: return 0.6; case 5: return 0.6;
            default: return 1.0;
        }
    };
    
    const result = useMemo(() => {
        const numEst1RM = parseFloat(est1RM);
        const numSets = parseInt(sets, 10);
        const numReps = parseInt(reps, 10);

        if (!numEst1RM || !numSets || !numReps) return null;

        const finalRIR = effortMode === 'rpe' ? 10 - effortValue : effortValue;
        
        const fatigueFactor = getFatigueFactor(finalRIR);
        const baseRepLoss = 0.5;
        const accumulationFactor = 1.12; 

        let totalRepsLost = 0;
        let currentRepLoss = baseRepLoss * fatigueFactor;

        if (numSets > 1) {
            for (let i = 0; i < numSets - 1; i++) {
                totalRepsLost += currentRepLoss;
                currentRepLoss *= accumulationFactor;
            }
        }

        const effectiveRepMax = numReps + finalRIR + totalRepsLost;
        const targetPercent = getPercentFromReps(effectiveRepMax);
        const recommendedLoad = numEst1RM * targetPercent;
        
        let finalLoad: string;
        if (rounding === 'none') {
            finalLoad = recommendedLoad.toFixed(1);
        } else {
            const roundingValue = parseFloat(rounding);
            const rounded = Math.round(recommendedLoad / roundingValue) * roundingValue;
            finalLoad = (rounded % 1 === 0) ? rounded.toFixed(0) : rounded.toFixed(1).replace(/\.0$/, '');
        }

        return {
            load: finalLoad,
            percentage: (targetPercent * 100).toFixed(1)
        };
    }, [est1RM, sets, reps, effortMode, effortValue, rounding, getPercentFromReps]);

    useEffect(() => {
        if (effortMode === 'rir') {
            // If current RPE value is valid, convert it to RIR
            if (effortValue >= 5 && effortValue <= 10) {
                setEffortValue(10 - effortValue);
            }
        } else { // effortMode is 'rpe'
            // If current RIR value is valid, convert it to RPE
            if (effortValue >= 0 && effortValue <= 5) {
                setEffortValue(10 - effortValue);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effortMode]);
    
    const rirOptions = [
        {value: 0, text: '0 RIR (Failure)'}, {value: 1, text: '1 RIR'},
        {value: 2, text: '2 RIR'}, {value: 3, text: '3 RIR'},
        {value: 4, text: '4 RIR'}, {value: 5, text: '5 RIR'}
    ];
    const rpeOptions = [
        {value: 10, text: '10 RPE (Max Effort)'}, {value: 9, text: '9 RPE'},
        {value: 8, text: '8 RPE'}, {value: 7, text: '7 RPE'},
        {value: 6, text: '6 RPE'}, {value: 5, text: '5 RPE'}
    ];
    const effortOptions = effortMode === 'rir' ? rirOptions : rpeOptions;

    return (
        <Section title="Training Load Calculator">
            <div className="md:col-span-2 lg:col-span-3">
                <div className="input-group mb-5">
                    <label htmlFor="est-1rm" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Estimated 1RM (kg or lbs)</label>
                    <input type="number" id="est-1rm" value={est1RM} onChange={e => setEst1RM(e.target.value)} min="20" max="500" step="2.5" placeholder="Enter your 1RM" className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="input-group">
                        <label htmlFor="sets" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Number of Sets</label>
                        <input type="number" id="sets" value={sets} onChange={e => setSets(e.target.value)} min="1" max="10" step="1" placeholder="e.g., 3" className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="reps" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Reps per Set</label>
                        <input type="number" id="reps" value={reps} onChange={e => setReps(e.target.value)} min="1" max="20" step="1" placeholder="e.g., 5" className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:placeholder-slate-400" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="effort-mode" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Effort Measurement</label>
                        <select id="effort-mode" value={effortMode} onChange={e => setEffortMode(e.target.value as 'rir' | 'rpe')} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50">
                            <option value="rir">RIR (Default)</option>
                            <option value="rpe">RPE</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label htmlFor="rir-rpe-value" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Final Set {effortMode.toUpperCase()}</label>
                        <select id="rir-rpe-value" value={effortValue} onChange={e => setEffortValue(Number(e.target.value))} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50">
                            {effortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="input-group mb-8 max-w-sm mx-auto">
                    <label htmlFor="rounding" className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center">Round Result To Nearest</label>
                    <select id="rounding" value={rounding} onChange={e => setRounding(e.target.value as any)} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50">
                        <option value="none">No Rounding</option>
                        <option value="1">1 kg</option>
                        <option value="2.5">2.5 kg</option>
                        <option value="5">5 lbs</option>
                    </select>
                </div>

                <div className="bg-gradient-to-br from-sky-500 to-indigo-600 dark:from-sky-600 dark:to-indigo-700 p-6 rounded-lg text-white text-center shadow-lg">
                    <div className="result-label text-sm uppercase tracking-wider font-semibold opacity-90 mb-2">Recommended Load</div>
                    <div className="result-value text-5xl font-bold">{result ? result.load : '--'}</div>
                    <div className="result-percentage text-lg font-medium opacity-90 mt-1">{result ? `${result.percentage}% of 1RM` : '-- % of 1RM'}</div>
                </div>

                <p className="text-center text-xs italic text-slate-500 dark:text-slate-400 mt-4">
                    This model assumes recovery intervals between sets of 3+ minutes.
                </p>

                <div className="mt-6 p-4 bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 dark:border-sky-400 text-sky-800 dark:text-sky-200 rounded-r-lg text-sm space-y-2">
                    <p><strong>Individual Differences:</strong> The model doesn't account for individual training experience, recovery capacity, or fiber type makeup, all of which influence fatigue.</p>
                    <p><strong>Tempo and Technique:</strong> The speed of reps (tempo) and lifting efficiency can significantly affect fatigue and are not factored in.</p>
                    <p><strong>Psychological Factors:</strong> RPE and RIR are subjective measures influenced by mental state, motivation, and perception of effort.</p>
                </div>
            </div>
        </Section>
    );
};

// --- Classic 1RM Formulas (for comparison) ---
const epley_1rm = (w: number, r: number) => w * (1 + 0.0333 * r);
const brzycki_1rm = (w: number, r: number) => w * (36 / (37 - r));
const lombardi_1rm = (w: number, r: number) => w * Math.pow(r, 0.10);
const oconnor_1rm = (w: number, r: number) => w * (1 + 0.025 * r);
const mayhew_1rm = (w: number, r: number) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r));
const wathan_1rm = (w: number, r: number) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r));

const classicFormulas = [
    { name: 'Epley (1985)', func: epley_1rm },
    { name: 'Brzycki (1993)', func: brzycki_1rm },
    { name: 'Lombardi (1989)', func: lombardi_1rm },
    { name: 'O’Connor et al. (1989)', func: oconnor_1rm },
    { name: 'Mayhew et al. (1992)', func: mayhew_1rm },
    { name: 'Wathan (1994)', func: wathan_1rm },
];


// --- New Blended "Strength Analytics" Formula ---
const reps_brzycki = (p: number) => 37 - 36 * p;
const reps_epley = (p: number) => (1 / p - 1) / 0.0333;
const reps_oconnor = (p: number) => (1 / p - 1) / 0.025;

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const median = (a: number, b: number, c: number) => {
    return [a, b, c].sort((x, y) => x - y)[1];
};

const blended_reps_at_percent = (p: number): number => {
    const rB = reps_brzycki(p);
    const rE = reps_epley(p);
    const rO = reps_oconnor(p);
    const r_anchor = median(rB, rE, rO);
    let r: number;
    if (r_anchor <= 5) r = rB;
    else if (r_anchor >= 11) {
        const t = clamp((r_anchor - 10) / 5, 0, 1);
        r = (1 - t) * rE + t * rO;
    } else {
        const t = clamp((r_anchor - 5) / 5, 0, 1);
        r = (1 - t) * rB + t * rE;
    }
    return Math.max(0, Math.min(r, 20));
};

const find_percent_for_reps = (target_reps: number): number => {
    if (target_reps <= 1) return 1.0;
    let low_p = 0.01;
    let high_p = 1.0;
    const precision = 0.0001;
    for (let i = 0; i < 100; i++) {
        if (high_p - low_p < precision) break;
        const mid_p = (low_p + high_p) / 2;
        if (blended_reps_at_percent(mid_p) > target_reps) low_p = mid_p;
        else high_p = mid_p;
    }
    return (low_p + high_p) / 2;
};

interface OneRepMaxCalculatorProps {
    branding: BrandingState;
}

const OneRepMaxCalculator: React.FC<OneRepMaxCalculatorProps> = ({ branding }) => {
    const [mode, setMode] = useState<'oneRepMax' | 'trainingLoad'>('oneRepMax');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const [effortMode, setEffortMode] = useState<'rir' | 'rpe'>('rir');
    const [effortValue, setEffortValue] = useState<number>(0);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
    const [isIntensityHelpOpen, setIsIntensityHelpOpen] = useState(false);
    const [lifterName, setLifterName] = useState('');
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if ('share' in navigator) {
            setCanShare(true);
        }
    }, []);

    useEffect(() => {
        // This effect syncs effortValue when the mode changes
        // RPE 10 = RIR 0, RPE 9 = RIR 1, etc.
        if (effortMode === 'rir') {
            // If we just switched from RPE, convert the value
            if (effortValue >= 7 && effortValue <= 10) {
                setEffortValue(10 - effortValue);
            }
        } else { // effortMode is 'rpe'
            // If we just switched from RIR, convert the value
            if (effortValue >= 0 && effortValue <= 3) {
                setEffortValue(10 - effortValue);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effortMode]);


    const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
        if (unit === newUnit) return;

        const currentWeight = parseFloat(weight);
        if (!isNaN(currentWeight) && currentWeight > 0) {
            let newWeight: number;
            if (newUnit === 'lbs') { // Current unit must be kg
                newWeight = kgToLbs(currentWeight);
            } else { // Current unit must be lbs
                newWeight = lbsToKg(currentWeight);
            }
            setWeight(String(Math.round(newWeight * 10) / 10));
        }

        setUnit(newUnit);
    };

    const handleReset = () => {
        setWeight('');
        setReps('');
        setLifterName('');
        setEffortMode('rir');
        setEffortValue(0);
    };

    const formatValue = (value: number) => {
        // Round to nearest 0.5 for a cleaner display
        return (Math.round(value * 2) / 2).toFixed(1);
    }

    const results = useMemo(() => {
        const w = parseFloat(weight);
        const r_actual = parseInt(reps, 10);

        if (isNaN(w) || w <= 0 || isNaN(r_actual) || r_actual <= 0) {
            return null;
        }

        const rir = effortMode === 'rir' ? effortValue : 10 - effortValue;
        const r_effective = r_actual + rir;
        
        let strengthAnalytics1RM: number;

        if (r_effective <= 1) {
            strengthAnalytics1RM = w;
        } else {
            const p = find_percent_for_reps(r_effective);
            strengthAnalytics1RM = w / p;
        }

        const classicCalculations = classicFormulas.map(f => ({
            name: f.name,
            value: r_effective <= 1 ? w : f.func(w, r_effective),
        }));
        
        const allCalculations = [
            { name: 'Strength Analytics Formula', value: strengthAnalytics1RM },
            ...classicCalculations
        ];
        
        const repTableData = [];
        if (strengthAnalytics1RM > 0) {
            for (let r_table = 1; r_table <= 15; r_table++) {
                const p = find_percent_for_reps(r_table);
                const weightValue = strengthAnalytics1RM * p;
                repTableData.push({
                    reps: r_table,
                    percentage: (p * 100).toFixed(1),
                    weight: formatValue(weightValue),
                });
            }
        }

        return { allCalculations, strengthAnalytics1RM, repTableData };
    }, [weight, reps, effortMode, effortValue]);

    const handleExportPdf = (isMobile: boolean) => {
        if (!results) return;
        const blob = exportOneRepMaxToPDF({
            isMobile,
            branding,
            lifterName,
            weight,
            reps,
            unit,
            results
        });
        const fileName = `${lifterName.replace(/\s+/g, '_') || 'Lifter'}_1RM_Results${isMobile ? '_Mobile' : ''}.pdf`;
        savePdf(blob, fileName);
    };

    const handleSharePdf = async () => {
        if (!results) return;
        const blob = exportOneRepMaxToPDF({
            isMobile: true, // Always share mobile friendly version
            branding,
            lifterName,
            weight,
            reps,
            unit,
            results
        });
        const fileName = `${lifterName.replace(/\s+/g, '_') || 'Lifter'}_1RM_Results_Mobile.pdf`;
        const title = '1RM Calculator Results';
        const text = `Here are the 1RM calculation results for ${lifterName || 'this lifter'}.`;
        await sharePdf(blob, fileName, title, text);
    };

    const handleExportCsv = () => {
        if (!results) return;

        const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
        
        let csvContent = "Calculation Details\n";
        csvContent += `Lifter Name,${escapeCsv(lifterName || 'N/A')}\n`;
        csvContent += `Input Weight,${escapeCsv(weight)}\n`;
        csvContent += `Input Reps,${escapeCsv(reps)}\n`;
        csvContent += `Unit,${escapeCsv(unit)}\n`;
        csvContent += `Strength Analytics 1RM,${escapeCsv(formatValue(results.strengthAnalytics1RM))}\n`;
        
        csvContent += "\nTraining Zone Percentages\n";
        
        const tableHeaders = ['Reps', '% of 1RM', `Weight (${unit})`];
        csvContent += tableHeaders.map(escapeCsv).join(',') + '\n';

        results.repTableData.forEach(row => {
            const tableRow = [
                row.reps,
                row.percentage + '%',
                row.weight
            ];
            csvContent += tableRow.map(escapeCsv).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = `${lifterName.replace(/\s+/g, '_') || 'Lifter'}_1RM_Results.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

     const helpContent = (
        <>
            <p className="mb-2">Traditional 1RM calculators rely on a single formula, which can be inaccurate as rep ranges change.</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Our Strength Analytics formula is different.</p>
            <p className="mt-2">It uses a proprietary blended model that intelligently combines the strengths of multiple well-regarded formulas across the entire rep spectrum. This method:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Leverages formulas proven to be accurate at low reps (1-5).</li>
                <li>Transitions to models that perform better in the mid-rep ranges (6-10).</li>
                <li>Uses more conservative estimates for high-rep sets where predictions are less certain.</li>
            </ul>
            <p className="mt-3">This results in a smoother, more reliable 1RM estimate than any single formula can provide on its own.</p>
        </>
    );
    
    const intensityHelpContent = (
        <>
            <p className="mb-2">This feature makes your 1RM estimate more accurate for sets that weren't taken to absolute failure.</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                    <strong>RPE (Rate of Perceived Exertion):</strong> A 1-10 scale of how hard a set felt. RPE 10 is a maximum effort set (0 reps left). RPE 9 means you could have done one more rep.
                </li>
                <li>
                    <strong>RIR (Reps in Reserve):</strong> How many reps you had "left in the tank." RIR 0 is failure (same as RPE 10). RIR 2 means you could have performed two more reps.
                </li>
            </ul>
            <p className="mt-3">
                <strong>Example:</strong> Lifting a weight for 5 reps at RIR 2 is treated by the calculator as if you are capable of doing 7 reps to failure with that weight (5 performed + 2 in reserve).
            </p>
        </>
    );

    const rirOptions = [ { value: 0, text: '0 RIR (Failure)' }, { value: 1, text: '1 RIR' }, { value: 2, text: '2 RIR' }, { value: 3, text: '3 RIR' } ];
    const rpeOptions = [ { value: 10, text: '10 RPE (Max)' }, { value: 9, text: '9 RPE' }, { value: 8, text: '8 RPE' }, { value: 7, text: '7 RPE' } ];
    const effortOptions = effortMode === 'rir' ? rirOptions : rpeOptions;

    const segmentButtonBase = 'px-4 py-1 text-sm font-semibold rounded-md transition-colors';
    const segmentButtonActive = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow';
    const segmentButtonInactive = 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50';

    return (
        <>
            <Popover
                isOpen={isHelpPopoverOpen}
                onClose={() => setIsHelpPopoverOpen(false)}
                title="About the Strength Analytics Formula"
            >
                {helpContent}
            </Popover>
            <Popover
                isOpen={isIntensityHelpOpen}
                onClose={() => setIsIntensityHelpOpen(false)}
                title="Using Set Intensity (RPE & RIR)"
            >
                {intensityHelpContent}
            </Popover>
            <div className="animate-fadeIn max-w-3xl mx-auto">
                <div className="mb-6 flex justify-center">
                    <ModeToggle
                        modes={[
                            { key: 'oneRepMax', label: '1RM Calculator' },
                            { key: 'trainingLoad', label: 'Training Load' }
                        ]}
                        activeMode={mode}
                        onToggle={(newMode) => setMode(newMode as 'oneRepMax' | 'trainingLoad')}
                    />
                </div>

                {mode === 'oneRepMax' ? (
                    <>
                        <Section title="1RM Calculator" onHelpClick={() => setIsHelpPopoverOpen(true)}>
                            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                {/* Input Fields */}
                                <div className="flex flex-col">
                                    <label htmlFor="weight-lifted" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Weight Lifted</label>
                                    <input
                                        id="weight-lifted"
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder={`e.g., 100`}
                                        className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400 text-lg"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="reps-performed" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Reps Performed</label>
                                    <input
                                        id="reps-performed"
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        placeholder="e.g., 5"
                                        className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400 text-lg"
                                    />
                                </div>
                                {/* Unit Toggle & Reset */}
                                <div className="flex justify-center items-center pb-2 gap-3">
                                    <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex items-center justify-center gap-1">
                                    <button
                                        onClick={() => handleUnitChange('kg')}
                                        className={`${segmentButtonBase} ${unit === 'kg' ? segmentButtonActive : segmentButtonInactive}`}
                                    >
                                        kg
                                    </button>
                                    <button
                                        onClick={() => handleUnitChange('lbs')}
                                        className={`${segmentButtonBase} ${unit === 'lbs' ? segmentButtonActive : segmentButtonInactive}`}
                                    >
                                        lbs
                                    </button>
                                    </div>
                                    <IconButton
                                        onClick={handleReset}
                                        variant="secondary"
                                        disabled={!weight && !reps}
                                        className="!py-2 !px-3"
                                    >
                                    Reset
                                    </IconButton>
                                </div>
                            </div>
                             <div className="md:col-span-2 lg:col-span-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600 flex flex-col items-center gap-2">
                                <div className="flex items-center justify-center gap-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Set Intensity</label>
                                    <InfoIcon onClick={() => setIsIntensityHelpOpen(true)} />
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex items-center justify-center gap-1">
                                        <button onClick={() => setEffortMode('rir')} className={`${segmentButtonBase} ${effortMode === 'rir' ? segmentButtonActive : segmentButtonInactive}`}>RIR</button>
                                        <button onClick={() => setEffortMode('rpe')} className={`${segmentButtonBase} ${effortMode === 'rpe' ? segmentButtonActive : segmentButtonInactive}`}>RPE</button>
                                    </div>
                                    <select
                                        value={effortValue}
                                        onChange={e => setEffortValue(Number(e.target.value))}
                                        className="p-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50"
                                        aria-label="Set intensity value"
                                    >
                                        {effortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Section>
                        
                        <div className="mt-8">
                            {results ? (
                                <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md animate-fadeIn">
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Estimated 1RM Results</h3>
                                    
                                    <div className="text-center bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Strength Analytics 1RM</p>
                                        <p className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                            {formatValue(results.strengthAnalytics1RM)} <span className="text-2xl text-slate-400 dark:text-slate-500">{unit}</span>
                                        </p>
                                    </div>

                                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                                        <button
                                            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                                            className="w-full flex justify-between items-center text-left text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none"
                                            aria-expanded={isDetailsVisible}
                                        >
                                            <span>View detailed formula comparison</span>
                                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${isDetailsVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDetailsVisible ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {results.allCalculations.map((result, index) => {
                                                const isPrimary = result.name === 'Strength Analytics Formula';
                                                return (
                                                    <div key={index} className={`flex justify-between items-center p-3 rounded-md ${isPrimary ? 'bg-sky-100 dark:bg-sky-900/40 md:col-span-2 ring-2 ring-sky-300 dark:ring-sky-700' : 'bg-slate-50 dark:bg-slate-600/50'}`}>
                                                        <span className={`text-sm font-medium ${isPrimary ? 'text-sky-800 dark:text-sky-200 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{result.name}</span>
                                                        <span className={`text-lg font-bold ${isPrimary ? 'text-sky-900 dark:text-sky-100' : 'text-slate-800 dark:text-slate-100'}`}>{formatValue(result.value)} {unit}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                    <p>Enter weight and reps to see your estimated 1RM.</p>
                                </div>
                            )}
                        </div>

                        {results && (
                            <div className="mt-8 bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md animate-fadeIn">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Training Zone Percentages</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-center">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-600">
                                                <th className="py-2 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Reps</th>
                                                <th className="py-2 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">% of 1RM</th>
                                                <th className="py-2 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Weight ({unit})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.repTableData.map(row => (
                                                <tr key={row.reps} className="border-b border-slate-100 dark:border-slate-800">
                                                    <td className="py-2 px-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{row.reps}</td>
                                                    <td className="py-2 px-1 text-sm text-slate-600 dark:text-slate-300">{row.percentage}%</td>
                                                    <td className="py-2 px-1 text-sm font-bold text-slate-800 dark:text-slate-100">{row.weight}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {results && (
                            <div className="mt-8 bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md animate-fadeIn">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Export & Share Results</h3>
                                <div className="max-w-sm mx-auto mb-4">
                                    <label htmlFor="1rm-lifter-name" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center block">Lifter Name (for PDF)</label>
                                    <input
                                        id="1rm-lifter-name"
                                        type="text"
                                        value={lifterName}
                                        onChange={(e) => setLifterName(e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <button onClick={handleExportCsv} className="w-full sm:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to CSV</button>
                                    <button onClick={() => handleExportPdf(false)} className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export PDF (Desktop)</button>
                                    <button onClick={() => handleExportPdf(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export PDF (Mobile)</button>
                                    {canShare && <button onClick={handleSharePdf} className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Share Mobile PDF</button>}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <TrainingLoadCalculator />
                )}
            </div>
        </>
    );
};

export default OneRepMaxCalculator;