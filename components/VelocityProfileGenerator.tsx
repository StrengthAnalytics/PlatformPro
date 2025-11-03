import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Section from './Section';
import IconButton from './IconButton';
import { roundToNearest2point5, generateCustomWarmups } from '../utils/calculator';
import { BrandingState, WarmupSet } from '../types';

interface VelocityProfileGeneratorProps {
    branding: BrandingState;
    mode: 'generate' | 'test';
    onHelpClick: (mode: 'generate' | 'test') => void;
    onTriggerImport: (accept: string, callback: (e: React.ChangeEvent<HTMLInputElement>) => void) => void;
}

type VelocityData = Record<number, Record<number, string>>;
type RIRVelocities = Record<number, number[]>;
type Profile = Record<string, string>;
interface VbtTestData {
    dataType: 'VBT_Profile_Test_Data';
    version: 1;
    lifterName: string;
    exercise: string;
    oneRM: string;
    oneRMVelocity: string;
    sets: Record<string, { weight: string; velocities: string[] }>;
}

const isVbtTestData = (data: any): data is VbtTestData => {
    return data?.dataType === 'VBT_Profile_Test_Data' && typeof data.sets === 'object';
};


const VelocityProfileGenerator: React.FC<VelocityProfileGeneratorProps> = ({ branding, mode, onHelpClick, onTriggerImport }) => {
    // State for Generate Profile mode
    const [generateStep, setGenerateStep] = useState(1);
    const [name, setName] = useState('');
    const [exercise, setExercise] = useState('');
    const [oneRM, setOneRM] = useState('');
    const [oneRMVelocity, setOneRMVelocity] = useState('');
    const [weights, setWeights] = useState<Record<number, number>>({});
    const [reps, setReps] = useState<Record<number, number>>({ 90: 0, 85: 0, 80: 0, 75: 0 });
    const [velocities, setVelocities] = useState<VelocityData>({ 90: {}, 85: {}, 80: {}, 75: {} });
    const [profile, setProfile] = useState<Profile | null>(null);

    // State for Complete Test mode
    const [testStep, setTestStep] = useState(1);
    const [testName, setTestName] = useState('');
    const [testExercise, setTestExercise] = useState('');
    const [testEstOneRM, setTestEstOneRM] = useState('');
    const [testHeavySingleWeight, setTestHeavySingleWeight] = useState('');
    const [testHeavySingleVelocity, setTestHeavySingleVelocity] = useState('');
    const [testCalculatedWeights, setTestCalculatedWeights] = useState<Record<number, number>>({});
    const [testVelocities, setTestVelocities] = useState<Record<number, string[]>>({ 90: [], 85: [], 80: [], 75: [] });
    const [testWarmupPlan, setTestWarmupPlan] = useState<WarmupSet[] | null>(null);

    useEffect(() => {
        const estRM = parseFloat(testEstOneRM);
        if (mode === 'test' && !isNaN(estRM) && estRM > 20) {
            // As per user request, use the bench press warm-up table logic.
            const plan = generateCustomWarmups({
                targetWeight: estRM,
                targetReps: 1, // The target is a single rep
                unit: 'kg', // All inputs are in kg
                liftType: 'bench',
            });
            setTestWarmupPlan(plan);
        } else {
            setTestWarmupPlan(null); // Clear plan if input is invalid
        }
    }, [testEstOneRM, mode]);


    const handleCalculateWeights = () => {
        const oneRMValue = parseFloat(oneRM);
        if (isNaN(oneRMValue) || oneRMValue <= 0) {
            alert("Please enter a valid 1RM weight.");
            return;
        }
        setWeights({
            90: roundToNearest2point5(oneRMValue * 0.9),
            85: roundToNearest2point5(oneRMValue * 0.85),
            80: roundToNearest2point5(oneRMValue * 0.8),
            75: roundToNearest2point5(oneRMValue * 0.75),
        });
        setGenerateStep(2);
    };

    const handleRepsChange = (percentage: number, value: string) => {
        const numReps = parseInt(value, 10);
        setReps(prev => ({ ...prev, [percentage]: isNaN(numReps) ? 0 : Math.min(Math.max(numReps, 0), 12) }));
    };

    const handleVelocityChange = (percentage: number, repIndex: number, value: string) => {
        setVelocities(prev => ({
            ...prev,
            [percentage]: {
                ...prev[percentage],
                [repIndex]: value
            }
        }));
    };

    const generateProfile = () => {
        const oneRMVelValue = parseFloat(oneRMVelocity);
        if (isNaN(oneRMVelValue) || oneRMVelValue <= 0) {
            alert("Please enter a valid 1RM velocity.");
            return;
        }

        const rirVelocities: RIRVelocities = { 0: [oneRMVelValue], 1: [], 2: [], 3: [], 4: [], 5: [] };
        
        [90, 85, 80, 75].forEach(p => {
            const numReps = reps[p];
            if (numReps > 0) {
                for (let i = 1; i <= numReps; i++) {
                    const vel = parseFloat(velocities[p]?.[i - 1]);
                    if (!isNaN(vel)) {
                        const rir = numReps - i;
                        if (rir in rirVelocities) {
                            rirVelocities[rir].push(vel);
                        }
                    }
                }
            }
        });

        const calculateAverage = (arr: number[]) => {
            if (arr.length === 0) return 'N/A';
            const sum = arr.reduce((a, b) => a + b, 0);
            return (sum / arr.length).toFixed(2);
        };
        
        const rir2plus = [...(rirVelocities[3] || []), ...(rirVelocities[4] || []), ...(rirVelocities[5] || [])];

        setProfile({
            rir0: calculateAverage(rirVelocities[0]),
            rir1: calculateAverage(rirVelocities[1]),
            rir2: calculateAverage(rirVelocities[2]),
            rir2plus: calculateAverage(rir2plus),
        });

        setGenerateStep(3);
    };

    const handleReset = () => {
        setGenerateStep(1);
        setName('');
        setExercise('');
        setOneRM('');
        setOneRMVelocity('');
        setWeights({});
        setReps({ 90: 0, 85: 0, 80: 0, 75: 0 });
        setVelocities({ 90: {}, 85: {}, 80: {}, 75: {} });
        setProfile(null);
    };

    const handleExportPDF = () => {
        if (!profile) return;
        const doc = new jsPDF('p', 'mm', 'a4');
        const date = new Date().toLocaleDateString();

        // Header
        const primaryColor = branding.primaryColor || '#1e3c72';
        doc.setFillColor(primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('VELOCITY-BASED TRAINING PROFILE', 105, 18, { align: 'center' });

        // Lifter Info
        let y = 45;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(16);
        doc.text('Lifter Information', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${name || 'N/A'}`, 14, y);
        doc.text(`1RM: ${oneRM} kg`, 110, y);
        y += 7;
        doc.text(`Exercise: ${exercise || 'N/A'}`, 14, y);
        doc.text(`1RM Velocity: ${oneRMVelocity} m/s`, 110, y);
        y += 7;
        doc.text(`Date: ${date}`, 14, y);
        
        y += 15;
        
        // Results Table
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Velocity Profile Results', 105, y, { align: 'center' });
        y += 10;
        
        const tableData = [
            ['0 RIR', profile.rir0, 'Maximum effort, no reps left in reserve'],
            ['1 RIR', profile.rir1, 'Could do 1 more rep before failure'],
            ['2 RIR', profile.rir2, 'Could do 2 more reps before failure'],
            ['2+ RIR', profile.rir2plus, 'Could do 3-5 more reps before failure']
        ];
        
        autoTable(doc, {
            startY: y,
            head: [['RIR', 'Average Velocity (m/s)', 'Description']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: '#e2e8f0', textColor: '#1e293b', fontStyle: 'bold' },
            styles: { cellPadding: 3, fontSize: 10 },
            columnStyles: { 1: { fontStyle: 'bold', halign: 'center' } }
        });
        
        doc.save(`${name || 'lifter'}_${exercise || 'exercise'}_VBT_Profile.pdf`);
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                if (!isVbtTestData(data)) throw new Error("Invalid test data file.");

                setName(data.lifterName);
                setExercise(data.exercise);
                setOneRM(data.oneRM);
                setOneRMVelocity(data.oneRMVelocity);

                const newReps: Record<number, number> = { 90: 0, 85: 0, 80: 0, 75: 0 };
                const newVelocities: VelocityData = { 90: {}, 85: {}, 80: {}, 75: {} };
                const newWeights: Record<number, number> = {};

                Object.entries(data.sets).forEach(([p, setData]) => {
                    const percentage = parseInt(p, 10);
                    newReps[percentage] = setData.velocities.length;
                    newWeights[percentage] = parseFloat(setData.weight);
                    setData.velocities.forEach((vel, i) => {
                        newVelocities[percentage][i] = vel;
                    });
                });

                setReps(newReps);
                setVelocities(newVelocities);
                setWeights(newWeights);
                setGenerateStep(2); // Go to data review step
            } catch (error) {
                alert(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        reader.readAsText(file);
    };

    // --- "Complete Test" Mode Functions ---
    
    const handleTestReset = () => {
        setTestStep(1);
        setTestName('');
        setTestExercise('');
        setTestEstOneRM('');
        setTestHeavySingleWeight('');
        setTestHeavySingleVelocity('');
        setTestCalculatedWeights({});
        setTestVelocities({ 90: [], 85: [], 80: [], 75: [] });
        setTestWarmupPlan(null);
    };

    const handleTestCalculateWeights = () => {
        const hsWeight = parseFloat(testHeavySingleWeight);
        if (isNaN(hsWeight) || hsWeight <= 0) {
            alert("Please enter a valid weight for your heavy single.");
            return;
        }
        setTestCalculatedWeights({
            90: roundToNearest2point5(hsWeight * 0.9),
            85: roundToNearest2point5(hsWeight * 0.85),
            80: roundToNearest2point5(hsWeight * 0.8),
            75: roundToNearest2point5(hsWeight * 0.75),
        });
        setTestStep(3);
    };

    const handleTestAddRep = (percentage: number) => {
        setTestVelocities(prev => ({
            ...prev,
            [percentage]: [...prev[percentage], '']
        }));
    };

    const handleTestRemoveRep = (percentage: number) => {
        setTestVelocities(prev => ({
            ...prev,
            [percentage]: prev[percentage].slice(0, -1)
        }));
    };
    
    const handleTestVelocityChange = (percentage: number, repIndex: number, value: string) => {
        setTestVelocities(prev => {
            const newVels = [...prev[percentage]];
            newVels[repIndex] = value;
            return { ...prev, [percentage]: newVels };
        });
    };
    
    const handleExportTestResults = () => {
        const data: VbtTestData = {
            dataType: 'VBT_Profile_Test_Data',
            version: 1,
            lifterName: testName,
            exercise: testExercise,
            oneRM: testHeavySingleWeight,
            oneRMVelocity: testHeavySingleVelocity,
            sets: {
                '90': { weight: String(testCalculatedWeights[90]), velocities: testVelocities[90].filter(v => v.trim() !== '') },
                '85': { weight: String(testCalculatedWeights[85]), velocities: testVelocities[85].filter(v => v.trim() !== '') },
                '80': { weight: String(testCalculatedWeights[80]), velocities: testVelocities[80].filter(v => v.trim() !== '') },
                '75': { weight: String(testCalculatedWeights[75]), velocities: testVelocities[75].filter(v => v.trim() !== '') },
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${testName || 'lifter'}_${testExercise || 'exercise'}_VBT_Test.vbt`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- RENDER FUNCTIONS ---
    
    const renderGenerateProfile = () => {
        const inputClasses = "w-full text-center p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600";
        const renderStepOne = () => (
             <Section title="Step 1: Lifter Information & Import" onHelpClick={() => onHelpClick('generate')}>
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Lifter Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter lifter's name" className={inputClasses} />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Exercise</label>
                        <input type="text" value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="e.g., Squat, Bench Press" className={inputClasses} />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Tested 1RM (kg)</label>
                        <input type="number" value={oneRM} onChange={(e) => setOneRM(e.target.value)} placeholder="Enter tested 1RM" className={inputClasses} />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">1RM Velocity (m/s)</label>
                        <input type="number" step="0.01" value={oneRMVelocity} onChange={(e) => setOneRMVelocity(e.target.value)} placeholder="Enter velocity of 1RM rep" className={inputClasses} />
                    </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3 mt-6 flex justify-center gap-4">
                    <IconButton onClick={() => onTriggerImport('.vbt', handleImportFile)} variant="info" className="py-3 px-6 text-sm sm:text-base">Import Test Results</IconButton>
                    <IconButton onClick={handleCalculateWeights} variant="success" className="py-3 px-6 text-sm sm:text-base leading-tight">Manually Input Data</IconButton>
                </div>
            </Section>
        );

        const renderStepTwo = () => (
             <Section title="Step 2: Training Data Collection / Review">
                <div className="md:col-span-2 lg:col-span-3 space-y-6">
                    {[90, 85, 80, 75].map(p => (
                        <div key={p} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">{p}% of 1RM ({weights[p]} kg)</h4>
                            <div className="flex items-center gap-4 mb-4">
                                <label className="font-medium text-slate-700 dark:text-slate-300">Reps Completed:</label>
                                <input type="number" value={reps[p]} onChange={(e) => handleRepsChange(p, e.target.value)} min="0" max="12" className={`w-20 text-center p-2 border rounded-md ${inputClasses}`} />
                            </div>
                            {reps[p] > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                    {Array.from({ length: reps[p] }).map((_, i) => {
                                        const rir = reps[p] - (i + 1);
                                        return (
                                            <div key={i} className="flex flex-col items-center">
                                                <label className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Rep {i + 1}</label>
                                                <input type="number" step="0.01" value={velocities[p]?.[i] || ''} onChange={(e) => handleVelocityChange(p, i, e.target.value)} className={`w-20 text-center p-2 border rounded-md ${inputClasses}`} placeholder="m/s"/>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{rir} RIR</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-4 pt-4">
                        <IconButton 
                          onClick={generateProfile} 
                          className="!text-lg !py-3 !px-8 w-full sm:w-auto"
                        >
                            Generate Velocity Profile
                        </IconButton>
                        <div className="flex justify-center gap-4">
                            <IconButton onClick={() => setGenerateStep(1)} variant="secondary" className="!text-lg !py-3 !px-8">Back</IconButton>
                            <IconButton onClick={handleReset} variant="danger" className="!text-lg !py-3 !px-8">Reset</IconButton>
                        </div>
                    </div>
                </div>
            </Section>
        );
        
        const renderStepThree = () => (
            <Section title="Step 3: Velocity Profile Results">
                <div className="md:col-span-2 lg:col-span-3">
                     <div className="text-center mb-6 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{name || 'Lifter'} - {exercise || 'Exercise'}</h4>
                        <p className="text-slate-600 dark:text-slate-400">Tested 1RM: {oneRM} kg on {new Date().toLocaleDateString()}</p>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="p-3 border text-left font-semibold text-slate-700 dark:text-slate-200">RIR</th>
                                <th className="p-3 border text-center font-semibold text-slate-700 dark:text-slate-200">Average Velocity (m/s)</th>
                                <th className="p-3 border text-left font-semibold text-slate-700 dark:text-slate-200">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profile && Object.entries(profile).map(([key, value]) => {
                                const labels: Record<string, string> = { rir0: '0 RIR', rir1: '1 RIR', rir2: '2 RIR', rir2plus: '2+ RIR' };
                                const descs: Record<string, string> = { rir0: 'Maximum effort, no reps left.', rir1: 'Could do 1 more rep.', rir2: 'Could do 2 more reps.', rir2plus: 'Could do 3-5 more reps.' };
                                return (
                                    <tr key={key}>
                                        <td className="p-3 border font-medium text-slate-800 dark:text-slate-100">{labels[key]}</td>
                                        <td className="p-3 border text-center font-bold text-lg text-slate-800 dark:text-slate-50">{value}</td>
                                        <td className="p-3 border text-sm text-slate-600 dark:text-slate-400">{descs[key]}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     <div className="flex justify-center gap-4 mt-8">
                         <IconButton onClick={handleReset} variant="secondary" className="!text-lg !py-3 !px-8">Create New Profile</IconButton>
                        <IconButton onClick={handleExportPDF} variant="info" className="!text-lg !py-3 !px-8">Export as PDF</IconButton>
                    </div>
                </div>
            </Section>
        );

        return (
            <div className="animate-fadeIn max-w-4xl mx-auto">
                {generateStep === 1 && renderStepOne()}
                {generateStep === 2 && renderStepTwo()}
                {generateStep === 3 && renderStepThree()}
            </div>
        )
    };

    const renderCompleteTest = () => {
         const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600";
         const renderTestStepOne = () => (
            <Section title="Step 1: Test Setup" onHelpClick={() => onHelpClick('test')}>
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Your Name</label>
                        <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Enter your name" className={inputClasses} />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Exercise</label>
                        <input type="text" value={testExercise} onChange={(e) => setTestExercise(e.target.value)} placeholder="Bench Press Variation, e.g. Paused" className={inputClasses} />
                    </div>
                </div>
                 <div className="md:col-span-2 lg:col-span-3 mt-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Estimated 1RM (kg)</label>
                        <input type="number" value={testEstOneRM} onChange={(e) => setTestEstOneRM(e.target.value)} placeholder="Your best guess for today's 1RM" className={inputClasses} />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use this to generate a warm-up plan to prepare for your heavy single.</p>
                    </div>

                    {testWarmupPlan && (
                        <div className="mt-6 animate-fadeIn">
                            <details className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 open:shadow-lg transition-all">
                                <summary className="p-4 font-bold text-slate-700 dark:text-slate-200 cursor-pointer list-item">
                                    View Recommended Warm-up Plan
                                </summary>
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {testWarmupPlan.map((set, index) => (
                                            <li key={index} className="py-2 flex justify-between items-center px-2">
                                                <span className="font-semibold text-slate-500 dark:text-slate-400">Set {index + 1}</span>
                                                <div>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{set.weight} kg</span>
                                                    <span className="text-slate-500 dark:text-slate-400 mx-2">x</span>
                                                    <span className="text-slate-600 dark:text-slate-300">{set.reps} reps</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 lg:col-span-3 mt-6 flex justify-center">
                    <IconButton onClick={() => setTestStep(2)} className="!text-lg !py-3 !px-10" disabled={!testName || !testExercise || !testEstOneRM}>Proceed to Heavy Single</IconButton>
                </div>
            </Section>
        );
        
        const renderTestStepTwo = () => (
            <Section title="Step 2: Record Heavy Single">
                 <div className="md:col-span-2 lg:col-span-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-slate-700 dark:text-slate-300">After your warm-up, perform a heavy single rep to technical failure (0 RIR). It doesn't need to be a true max, just the heaviest you can lift with perfect form today. Record the weight and velocity below.</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Heavy Single Weight (kg)</label>
                        <input type="number" value={testHeavySingleWeight} onChange={(e) => setTestHeavySingleWeight(e.target.value)} placeholder="e.g., 152.5" className={inputClasses} />
                    </div>
                     <div className="flex flex-col">
                        <label className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Heavy Single Velocity (m/s)</label>
                        <input type="number" step="0.01" value={testHeavySingleVelocity} onChange={(e) => setTestHeavySingleVelocity(e.target.value)} placeholder="e.g., 0.31" className={inputClasses} />
                    </div>
                </div>
                 <div className="md:col-span-2 lg:col-span-3 mt-6 flex justify-center gap-4">
                    <IconButton onClick={() => setTestStep(1)} variant="secondary">Back</IconButton>
                    <IconButton onClick={handleTestCalculateWeights} disabled={!testHeavySingleWeight || !testHeavySingleVelocity}>Calculate Back-off Sets</IconButton>
                </div>
            </Section>
        );

        const renderTestStepThree = () => (
             <Section title="Step 3: Record Back-off Sets">
                <div className="md:col-span-2 lg:col-span-3 space-y-4">
                    {[90, 85, 80, 75].map(p => (
                        <div key={p} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <h4 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">{p}% Set: {testCalculatedWeights[p]} kg</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Perform as many reps as possible to technical failure. Record the velocity for each rep.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {testVelocities[p].map((vel, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rep {i + 1}:</label>
                                        <input type="number" step="0.01" value={vel} onChange={(e) => handleTestVelocityChange(p, i, e.target.value)} placeholder="m/s" className="w-full p-1 border rounded-md text-center bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-slate-300 dark:border-slate-600" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-3">
                                <IconButton onClick={() => handleTestAddRep(p)} variant="success" className="!py-1 !px-3 !text-sm">+ Rep</IconButton>
                                {testVelocities[p].length > 0 && <IconButton onClick={() => handleTestRemoveRep(p)} variant="danger" className="!py-1 !px-3 !text-sm">-</IconButton>}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center gap-4 pt-4">
                        <IconButton onClick={() => setTestStep(2)} variant="secondary">Back</IconButton>
                        <IconButton onClick={() => setTestStep(4)}>Review & Export</IconButton>
                    </div>
                </div>
             </Section>
        );

        const renderTestStepFour = () => (
            <Section title="Step 4: Review and Export">
                <div className="md:col-span-2 lg:col-span-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4 text-slate-700 dark:text-slate-300">
                        <p><strong>Lifter:</strong> {testName}</p>
                        <p><strong>Exercise:</strong> {testExercise}</p>
                        <p><strong>Heavy Single:</strong> {testHeavySingleWeight} kg @ {testHeavySingleVelocity} m/s</p>
                    </div>
                    <p className="mb-4 text-slate-700 dark:text-slate-300">Review your data below. If everything is correct, export the results and send the `.vbt` file to your coach.</p>
                    <div className="flex justify-center gap-4">
                        <IconButton onClick={() => setTestStep(3)} variant="secondary">Back to Edit</IconButton>
                        <IconButton onClick={handleExportTestResults} variant="info">Export Results (.vbt)</IconButton>
                    </div>
                </div>
            </Section>
        );

        return (
            <div className="animate-fadeIn max-w-4xl mx-auto">
                 <div className="flex justify-end mb-4">
                    <IconButton onClick={handleTestReset} variant="danger">
                        Reset Test
                    </IconButton>
                </div>
                {testStep === 1 && renderTestStepOne()}
                {testStep === 2 && renderTestStepTwo()}
                {testStep === 3 && renderTestStepThree()}
                {testStep === 4 && renderTestStepFour()}
            </div>
        )
    };

    return (
        <>
            {mode === 'generate' ? renderGenerateProfile() : renderCompleteTest()}
        </>
    );
};

export default VelocityProfileGenerator;