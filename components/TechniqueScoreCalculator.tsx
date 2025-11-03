import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import Section from './Section';
import IconButton from './IconButton';
import Popover from './Popover';
import InfoIcon from './InfoIcon';
import { BrandingState } from '../types';

interface TechniqueScoreCalculatorProps {
    branding: BrandingState;
}

interface Results {
    cv: number;
    mean: number;
    stdDev: number;
    category: 'Excellent' | 'Good' | 'Needs Improvement';
    implication: string;
}

const TechniqueScoreCalculator: React.FC<TechniqueScoreCalculatorProps> = ({ branding }) => {
    const [lifterName, setLifterName] = useState('');
    const [exercise, setExercise] = useState('');
    const [numSingles, setNumSingles] = useState<number>(5);
    const [velocities, setVelocities] = useState<string[]>(Array(5).fill(''));
    const [results, setResults] = useState<Results | null>(null);
    const [error, setError] = useState('');
    const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
    const [isSinglesHelpOpen, setIsSinglesHelpOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (results && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [results]);

    const handleVelocityChange = (index: number, value: string) => {
        const newVelocities = [...velocities];
        newVelocities[index] = value;
        setVelocities(newVelocities);
    };

    const isCalculateReady = useMemo(() => {
        const relevantVelocities = velocities.slice(0, numSingles);
        if (relevantVelocities.length < numSingles) return false;
        return relevantVelocities.every(v => v.trim() !== '' && !isNaN(parseFloat(v)) && parseFloat(v) > 0);
    }, [velocities, numSingles]);

    const handleCalculate = () => {
        const relevantVelocities = velocities.slice(0, numSingles);
        const parsedVelocities = relevantVelocities.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);

        if (parsedVelocities.length !== numSingles) {
            setError(`Please enter ${numSingles} valid velocity values (m/s).`);
            setResults(null);
            return;
        }

        setError('');

        const mean = parsedVelocities.reduce((sum, v) => sum + v, 0) / parsedVelocities.length;
        const stdDev = Math.sqrt(parsedVelocities.map(v => Math.pow(v - mean, 2)).reduce((sum, v) => sum + v, 0) / parsedVelocities.length);
        const cv = (stdDev / mean) * 100;

        let category: Results['category'];
        let implication: string;

        if (cv < 5) {
            category = 'Excellent';
            implication = "Focus on force production and power development. The lifter can be pushed harder due to their solid technique foundation.";
        } else if (cv >= 5 && cv <= 10) {
            category = 'Good';
            implication = "Maintain technical practice while also pushing intensity. Balance technique work with progressive overload.";
        } else {
            category = 'Needs Improvement';
            implication = "Prioritise technique work. Reduce or maintain loading until execution improves. Avoid reinforcing bad patterns with heavy weight.";
        }

        setResults({ cv, mean, stdDev, category, implication });
    };

    const handleReset = () => {
        setLifterName('');
        setExercise('');
        setNumSingles(5);
        setVelocities(Array(5).fill(''));
        setResults(null);
        setError('');
    };

    const handleExportPDF = () => {
        if (!results) return;
        const doc = new jsPDF('p', 'mm', 'a4');
        const date = new Date().toLocaleDateString();
        const { cv, mean, stdDev, category, implication } = results;

        // Header
        const primaryColor = branding.primaryColor || '#1e3c72';
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('TECHNICAL EXECUTION SCORE', 105, 18, { align: 'center' });

        // Lifter Info
        let y = 45;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(16);
        doc.text('Test Information', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Lifter Name: ${lifterName || 'N/A'}`, 14, y);
        y += 7;
        doc.text(`Exercise: ${exercise || 'N/A'}`, 14, y);
        y += 7;
        doc.text(`Date: ${date}`, 14, y);
        y += 7;
        doc.text(`Number of Singles: ${numSingles}`, 14, y);
        
        y += 15;

        // Results Section
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Results', 105, y, { align: 'center' });
        y += 12;

        const scoreColor: [number, number, number] = category === 'Excellent' ? [4, 120, 87] : category === 'Good' ? [202, 138, 4] : [220, 38, 38];
        const cvText = `${cv.toFixed(2)}%`;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(48);
        const cvTextWidth = doc.getTextWidth(cvText);

        doc.setFontSize(22);
        const categoryTextWidth = doc.getTextWidth(category);
        
        const gap = 8;
        const totalWidth = cvTextWidth + categoryTextWidth + gap;
        const startX = (210 - totalWidth) / 2; // Center the block on the page
        
        // Draw CV%
        doc.setFontSize(48);
        doc.setTextColor(...scoreColor);
        doc.text(cvText, startX, y, { baseline: 'middle' });
        
        // Draw Category
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text(category, startX + cvTextWidth + gap, y, { baseline: 'middle' });
        
        y += 15;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Training Implications:', 14, y);
        y+= 6;
        doc.setFont('helvetica', 'normal');
        const implicationLines = doc.splitTextToSize(implication, 182);
        doc.text(implicationLines, 14, y);

        y += implicationLines.length * 5 + 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Data Breakdown', 14, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mean Velocity: ${mean.toFixed(3)} m/s`, 14, y);
        y += 6;
        doc.text(`Standard Deviation: ${stdDev.toFixed(3)} m/s`, 14, y);

        doc.save(`${lifterName || 'lifter'}_${exercise || 'exercise'}_Technique_Score.pdf`);
    };

    const categoryStyles = {
        Excellent: {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-300',
            badge: 'bg-green-600',
            border: 'border-green-300 dark:border-green-700',
        },
        Good: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-300',
            badge: 'bg-amber-500',
            border: 'border-amber-300 dark:border-amber-700',
        },
        'Needs Improvement': {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-300',
            badge: 'bg-red-600',
            border: 'border-red-300 dark:border-red-700',
        },
    };
    
    const segmentButtonBase = 'px-4 py-1 text-sm font-semibold rounded-md transition-colors';
    const segmentButtonActive = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow';
    const segmentButtonInactive = 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50';

    const helpContent = (
      <>
        <p className="mb-3 text-slate-600 dark:text-slate-300">
            This tool measures technical consistency using the <strong>Coefficient of Variation (CV%)</strong>. It analyzes the velocity of 3-5 heavy single reps (typically 80-90% 1RM) to quantify how much an athlete's technique varies under load.
        </p>
        <div className="space-y-3">
            <div>
                <h4 className="font-bold text-green-700 dark:text-green-400">&lt; 5% CV (Excellent)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Indicates very high technical consistency. The lifter's movement is stable and repeatable. <br/><strong>Implication:</strong> Focus on force production and power development. The lifter can be pushed harder due to their solid foundation.</p>
            </div>
            <div>
                <h4 className="font-bold text-amber-600 dark:text-amber-400">5-10% CV (Good)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Indicates good consistency with some room for improvement. The lifter has a solid base but may have minor variations. <br/><strong>Implication:</strong> Maintain technical practice while also pushing intensity. Balance technique work with progressive overload.</p>
            </div>
            <div>
                <h4 className="font-bold text-red-600 dark:text-red-400">&gt; 10% CV (Needs Improvement)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Indicates significant technical inconsistency. The lifter's execution varies considerably between reps. <br/><strong>Implication:</strong> Prioritise technique work. Reduce or maintain loading until execution improves. Avoid reinforcing poor motor patterns with heavy weight.</p>
            </div>
        </div>
      </>
    );

    const singlesHelpContent = (
        <>
            <p>The number of heavy single reps to analyze.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong>More singles provide a more accurate score.</strong> 5 reps is recommended for the most reliable data.</li>
                <li><strong>Adequate rest is crucial.</strong> Ensure full recovery (3-5 minutes) between each single to get a true measure of technical consistency, not fatigue.</li>
            </ul>
        </>
    );

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto">
            <Popover 
                isOpen={isHelpPopoverOpen}
                onClose={() => setIsHelpPopoverOpen(false)}
                title="Technique Score Protocol (CV%)"
            >
                {helpContent}
            </Popover>
             <Popover 
                isOpen={isSinglesHelpOpen}
                onClose={() => setIsSinglesHelpOpen(false)}
                title="About Number of Singles"
            >
                {singlesHelpContent}
            </Popover>
            <Section title="Data Input" onHelpClick={() => setIsHelpPopoverOpen(true)}>
                <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm">
                        Based on the <strong>Strength Analytics Protocol:</strong> 3-5 single reps at 80-90% 1RM with full recovery.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Lifter Name</label>
                            <input type="text" value={lifterName} onChange={(e) => setLifterName(e.target.value)} placeholder="e.g., Jane Doe" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Exercise</label>
                            <input type="text" value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="e.g., Competition Squat" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600" />
                        </div>
                    </div>
                     <div className="mb-6 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                           <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Number of Singles</label>
                           <InfoIcon onClick={() => setIsSinglesHelpOpen(true)} />
                        </div>
                        <div className="bg-slate-200 dark:bg-slate-600 p-1 rounded-lg flex gap-1">
                            {[3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setNumSingles(num)}
                                    className={`${segmentButtonBase} ${numSingles === num ? segmentButtonActive : segmentButtonInactive}`}
                                >
                                    {num} Singles
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        {Array.from({ length: numSingles }).map((_, index) => (
                            <div key={index} className="flex flex-col w-32">
                                <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Rep {index + 1} Velocity</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={velocities[index]}
                                    onChange={(e) => handleVelocityChange(index, e.target.value)}
                                    placeholder="m/s"
                                    className="w-full text-center p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600"
                                />
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                    <div className="flex justify-center gap-4 mt-8">
                        <IconButton onClick={handleReset} variant="secondary" className="!text-lg !py-3 !px-10">Reset</IconButton>
                        <IconButton 
                            onClick={handleCalculate}
                            variant={isCalculateReady ? 'success' : 'primary'}
                            disabled={!isCalculateReady}
                            className="!text-lg !py-3 !px-10"
                        >
                            Calculate Score
                        </IconButton>
                    </div>
                </div>
            </Section>

            {results && (
                <div ref={resultsRef} className={`mt-8 animate-fadeIn border-t-4 p-6 rounded-lg shadow-md ${categoryStyles[results.category].bg} ${categoryStyles[results.category].border}`}>
                    <h3 className="text-2xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100">Technique Score Results</h3>
                    <div className="text-center mb-6">
                        <div className="inline-block relative">
                             <p className={`text-7xl font-extrabold tracking-tighter ${categoryStyles[results.category].text}`}>
                                {results.cv.toFixed(2)}<span className="text-5xl">%</span>
                            </p>
                        </div>
                        <p className={`inline-flex items-center px-4 py-1 text-lg font-bold text-white rounded-full ml-4 ${categoryStyles[results.category].badge}`}>
                            {results.category}
                        </p>
                    </div>
                    <div className="max-w-2xl mx-auto">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Training Implications:</h4>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">{results.implication}</p>
                    </div>
                    <div className="flex justify-center mt-8">
                        <IconButton onClick={handleExportPDF} variant="info">Export as PDF</IconButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechniqueScoreCalculator;