import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, PricingTable } from '@clerk/clerk-react';
import { useSubscription } from './hooks/useSubscription';
import Section from './components/Section';
import PricingPage from './components/PricingPage';
import LiftSection from './components/LiftSection';
import SaveLoadSection from './components/SaveLoadSection';
import BrandingSection from './components/BrandingSection';
import PersonalBestsSection from './components/PersonalBestsSection';
import CollapsibleSection from './components/CollapsibleSection';
import Popover from './components/Popover';
import SummarySidebar from './components/SummarySidebar';
import MobileSummarySheet from './components/MobileSummarySheet';
import GameDayMode from './components/GameDayMode';
import SaveAsModal from './components/SaveAsModal';
import SettingsModal from './components/SettingsModal';
import SettingsMenu from './components/SettingsMenu';
import ToolsModal from './components/ToolsModal';
import ViewToggle from './components/ViewToggle';
import LiteModeView from './components/LiteModeView';
import Homescreen from './components/Homescreen';
import OneRepMaxCalculator from './components/OneRepMaxCalculator';
import WarmupGenerator from './components/WarmupGenerator';
import VelocityProfileGenerator from './components/VelocityProfileGenerator';
import TechniqueScoreCalculator from './components/TechniqueScoreCalculator';
import WorkoutTimer from './components/WorkoutTimer';
import ModeToggle from './components/ModeToggle';
import InfoIcon from './components/InfoIcon';
import { calculateAttempts, generateWarmups, calculateScore } from './utils/calculator';
import { exportToCSV, exportToPDF, exportToMobilePDF, savePdf, sharePdf } from './utils/exportHandler';
import { IPF_WEIGHT_CLASSES } from './constants';
import { initialAppState, deriveGameDayStateFromLifts } from './state';
import { migrateState } from './utils/migration';
import type { AppState, LiftType, LiftState, CompetitionDetails, EquipmentSettings, BrandingState, WarmupStrategy, GameDayLiftState, LiftsState, PlanData, ScoringFormula, AttemptStrategy } from './types';

const isPlanData = (data: any): data is PlanData => {
  return (
    data &&
    typeof data.details === 'object' &&
    typeof data.equipment === 'object' &&
    typeof data.lifts === 'object' &&
    'squat' in data.lifts &&
    'eventName' in data.details
  );
};

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};


const helpContent = {
    lifterName: { title: 'Lifter Name', content: <p>Enter the name of the lifter this plan is for. This name is the primary identifier and will be prominently displayed on all PDF and CSV exports.</p> },
    details: { title: 'Competition Details', content: <><p className="mb-2">Enter the main details for your competition here. This information will be displayed at the top of your exported PDF plan.</p><ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1"><li><strong>Event Name:</strong> The name of the powerlifting meet.</li><li><strong>Weight Class:</strong> Your registered weight class (e.g., 83kg).</li><li><strong>Competition Date:</strong> Helps you keep track of your plans.</li><li><strong>Weigh-in Time:</strong> Important for your game-day schedule.</li><li><strong>Body Weight & Gender:</strong> Required to calculate your score based on the formula selected in the Tools menu (⚙️).</li></ul></> },
    equipment: { title: 'Equipment Settings', content: <p>Note your personal equipment settings here to have everything in one place on meet day. These settings will be listed on your PDF export for quick reference during warm-ups.</p> },
    saveLoad: { title: 'Save & Load Plans', content: <><p className="mb-2">This section allows you to save, load, and delete your competition plans.</p><ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2"><li><strong>Load Saved Plan:</strong> Select a plan from the dropdown to immediately load it into the editor. Select "-- New Plan --" to start fresh.</li><li><strong>Save Changes:</strong> This button is only active when you've made changes to a loaded plan (indicated by a <span className="text-amber-600 font-bold">*</span>). It updates the current plan.</li><li><strong>Save As...:</strong> Click this to save the current plan (whether new or existing) under a new name. A modal will ask you for a name.</li><li><strong>Delete Current Plan:</strong> This will delete the plan that is currently loaded in the editor.</li><li><strong>Import/Export Plan:</strong> Share your plan with a coach or athlete by exporting it to a `.plp` file. They can then import this file to view and edit the full plan.</li></ul></> },
    branding: { title: 'Branding & Theming', content: <p>Personalize your exported PDF plan. You can upload your own logo (team, gym, or personal) and choose primary and secondary colors for the PDF headers to match your brand. These settings are saved in your browser for future use.</p> },
    attemptStrategy: { 
        title: 'Attempt Selection Strategy', 
        content: (
            <>
                <p className="mb-3">Choose the strategy for calculating your attempts. This determines the jumps between your opener, second, and third attempts.</p>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Aggressive (Default)</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Maximizes the jumps to aim for the highest possible third attempt. Best for lifters who are confident and performing well.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Stepped</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Uses equal, predictable jumps between all three attempts. A very predictable and stable progression.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Conservative</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Uses smaller, safer jumps, prioritizing making lifts over pushing for a max single. Good for securing a total or if feeling off on meet day.</p>
                    </div>
                </div>
            </>
        ) 
    },
    lifts: { title: 'Lift Attempts & Cues', content: <><p className="mb-2">Plan your competition attempts for this lift:</p><ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2"><li><strong>Enter an Attempt:</strong> Input either your planned <strong>Opener (1st)</strong> or your goal <strong>3rd Attempt</strong>. You can choose to enter in kg or lbs in the settings menu (⚙️).</li><li><strong>Calculate:</strong> Click to automatically fill in the other two attempts based on the selected 'Attempt Selection Strategy'.</li><li><strong>Add Cues:</strong> A space for personal technical cues that will appear on your PDF.</li></ul><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">All warm-up settings and generation are handled in the "Warm-up Strategy" section below.</p></> },
    warmupStrategy: { title: 'Warm-up Strategy', content: <><p className="mb-2">Choose how your warm-up sets are generated based on your opener. You can set the unit (kg/lbs) in the Tools menu (⚙️).</p><ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2"><li><strong>Default (Recommended):</strong> Uses pre-defined warm-up tables based on years of coaching experience. This is a reliable and tested method suitable for most lifters.</li><li><strong>Dynamic:</strong> Provides full control over your warm-up progression. This is great for advanced lifters or coaches who want to tailor the warm-up to specific needs.<ul className="list-['-_'] list-inside ml-4 mt-1 text-sm space-y-1"><li><strong># of Sets:</strong> The total number of warm-up sets you want to perform.</li><li><strong>Start Weight:</strong> The weight for your very first warm-up set (usually the empty bar, 20kg).</li><li><strong>Final WU % of Opener:</strong> Sets your last and heaviest warm-up relative to your opening attempt. A common value is 90-95%.</li></ul></li></ul></> },
    liteMode: { title: 'Lite Mode: Quick Plan Generator', content: <><p className="mb-2">Lite mode is designed to get you a complete, strategic competition plan in seconds.</p><ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1"><li><strong>Enter Your Details:</strong> Just provide a lifter name and your goal 3rd attempt for squat, bench, and deadlift.</li><li><strong>Build Plan:</strong> Click the "Build My Plan" button.</li><li><strong>Get Your Plan:</strong> The app instantly calculates your openers, second attempts, and a full warm-up progression for all three lifts.</li><li><strong>Fine-Tune & Export:</strong> The generated plan is fully editable. You can then export a clean, unbranded PDF for game day.</li></ul></> },
    velocityProfileGenerate: { title: 'How to Generate a Velocity Profile', content: <><p className="mb-2">This tool is for coaches to create a VBT profile using existing test data.</p><ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-2"><li><strong>Lifter Info:</strong> Enter the lifter's name, exercise, their tested 1RM, and the velocity of that 1RM rep.</li><li><strong>Import or Input:</strong><ul className="list-['-_'] list-inside ml-4 mt-1 text-sm space-y-1"><li><strong>Import:</strong> If the athlete completed the test using this app, you can import their <strong>.vbt</strong> file directly.</li><li><strong>Manual Input:</strong> Click to proceed and manually enter the velocities for each rep performed at different percentages.</li></ul></li><li><strong>Generate Profile:</strong> Once all data is entered, click "Generate" to see the full RIR-based velocity profile.</li><li><strong>Export:</strong> You can then export the final profile as a PDF for your records.</li></ol></> },
    velocityProfileTest: { title: 'How to Complete a VBT Test', content: <><p className="mb-2">This guided test helps athletes gather the data needed for a VBT profile.</p><ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-2"><li><strong>Setup:</strong> Enter your name, the specific exercise variation, and your <strong>estimated 1RM for today</strong>. This generates a recommended warm-up plan.</li><li><strong>Heavy Single:</strong> After warming up, work up to a heavy single rep performed with maximum effort and perfect technique. Record the weight and velocity.</li><li><strong>Back-off Sets:</strong> The app will calculate weights for four back-off sets. For each one, perform as many reps as possible (AMRAP) to technical failure, recording the velocity of every rep.</li><li><strong>Export:</strong> Once complete, export your results as a <strong>.vbt file</strong> and send it to your coach for analysis.</li></ol></> }
};

const App: React.FC = () => {
  const subscription = useSubscription();
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [currentView, setCurrentView] = useState<'homescreen' | 'planner' | 'oneRepMax' | 'warmupGenerator' | 'velocityProfile' | 'techniqueScore' | 'workoutTimer' | 'pricing'>('homescreen');
  const [viewMode, setViewMode] = useState<'pro' | 'lite'>('pro');
  const [velocityProfileMode, setVelocityProfileMode] = useState<'generate' | 'test'>('generate');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [showSignUpPricing, setShowSignUpPricing] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Record<string, AppState>>({});
  const [currentPlanName, setCurrentPlanName] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({ isOpen: false, title: '', content: null });
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const [isGameDayModeActive, setIsGameDayModeActive] = useState(false);
  const [activeLiftTab, setActiveLiftTab] = useState<LiftType>('squat');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [planAttemptsInLbs, setPlanAttemptsInLbs] = useState(false);
  const [isCoachingMode, setIsCoachingMode] = useState(false);
  const [autoGenerateWarmups, setAutoGenerateWarmups] = useState(false);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileChangeCallbackRef = useRef<((e: React.ChangeEvent<HTMLInputElement>) => void) | null>(null);


  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('plp_theme') as 'light' | 'dark' | null;
      if (savedTheme) setTheme(savedTheme);

      const savedDetails = localStorage.getItem('plp_details');
      const savedEquipment = localStorage.getItem('plp_equipment');
      const savedBranding = localStorage.getItem('plp_branding');
      const savedPersonalBests = localStorage.getItem('plp_personalBests');
      const allPlansRaw = localStorage.getItem('plp_allPlans');
      const savedPlanInLbs = localStorage.getItem('plp_planInLbs');
      const savedCoachingMode = localStorage.getItem('plp_coachingMode');
      const savedAutoGenerate = localStorage.getItem('plp_autoGenerateWarmups');

      if (savedPlanInLbs) setPlanAttemptsInLbs(JSON.parse(savedPlanInLbs));
      if (savedCoachingMode) setIsCoachingMode(JSON.parse(savedCoachingMode));
      if (savedAutoGenerate) setAutoGenerateWarmups(JSON.parse(savedAutoGenerate));

      const details = savedDetails ? JSON.parse(savedDetails) : initialAppState.details;
      if (!details.unit) details.unit = 'kg';
      if (!details.attemptStrategy) details.attemptStrategy = 'aggressive';

      const equipment = savedEquipment ? JSON.parse(savedEquipment) : initialAppState.equipment;
      const branding = savedBranding ? JSON.parse(savedBranding) : initialAppState.branding;
      const personalBests = savedPersonalBests ? JSON.parse(savedPersonalBests) : initialAppState.personalBests;

      setAppState(prev => ({ ...prev, details, equipment, branding, personalBests }));
      
      if (allPlansRaw) {
        const allPlans = JSON.parse(allPlansRaw);
        const migratedPlans: Record<string, AppState> = {};
        for (const name in allPlans) {
            if (Object.prototype.hasOwnProperty.call(allPlans, name)) {
                migratedPlans[name] = migrateState(allPlans[name]);
            }
        }
        setSavedPlans(migratedPlans);
        localStorage.setItem('plp_allPlans', JSON.stringify(migratedPlans));
      }
      if ('share' in navigator) setCanShare(true);
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    try {
        localStorage.setItem('plp_details', JSON.stringify(appState.details));
        localStorage.setItem('plp_equipment', JSON.stringify(appState.equipment));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  }, [appState.details, appState.equipment]);

  useEffect(() => {
    try {
        localStorage.setItem('plp_personalBests', JSON.stringify(appState.personalBests));
    } catch (error) {
        console.error("Failed to save personal bests to localStorage", error);
    }
  }, [appState.personalBests]);

  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('plp_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (viewMode === 'lite') setVelocityProfileMode('test');
  }, [viewMode]);

  const triggerImport = (accept: string, callback: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    if (fileInputRef.current) {
        fileChangeCallbackRef.current = callback;
        fileInputRef.current.accept = accept;
        fileInputRef.current.click();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (fileChangeCallbackRef.current) {
          fileChangeCallbackRef.current(e);
      }
  };

  const handleToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleTogglePlanAttemptsInLbs = () => {
    setPlanAttemptsInLbs(prev => {
        const newState = !prev;
        localStorage.setItem('plp_planInLbs', JSON.stringify(newState));
        return newState;
    });
  };

  const handleToggleCoachingMode = () => {
    setIsCoachingMode(prev => {
        const newState = !prev;
        localStorage.setItem('plp_coachingMode', JSON.stringify(newState));
        return newState;
    });
  };
  
  const handleToggleAutoGenerateWarmups = () => {
    setAutoGenerateWarmups(prev => {
        const newState = !prev;
        localStorage.setItem('plp_autoGenerateWarmups', JSON.stringify(newState));
        return newState;
    });
  };

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(''), 3000);
  };
  
  const showPopover = (title: string, content: React.ReactNode) => setPopoverState({ isOpen: true, title, content });
  const hidePopover = () => setPopoverState({ isOpen: false, title: '', content: null });

  const handleSelectAndLoadPlan = (name: string) => {
    if (name === '') {
        setAppState(prev => ({ ...initialAppState, branding: prev.branding, details: {...initialAppState.details, unit: prev.details.unit} }));
        setCurrentPlanName('');
        setIsDirty(false);
        showFeedback('New plan started.');
        return;
    }
    const planToLoad = savedPlans[name];
    if (planToLoad) {
      setAppState(planToLoad);
      setCurrentPlanName(name);
      setIsDirty(false);
      showFeedback(`Plan "${name}" loaded.`);
    }
  };

  const handleUpdatePlan = () => {
    if (!currentPlanName) {
        showFeedback('Cannot update an unsaved plan. Use "Save As..." instead.');
        return;
    }
    const newSavedPlans = { ...savedPlans, [currentPlanName]: appState };
    setSavedPlans(newSavedPlans);
    localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
    setIsDirty(false);
    showFeedback(`Plan "${currentPlanName}" updated successfully!`);
  };

  const handleSaveAs = (newName: string) => {
      const newSavedPlans = { ...savedPlans, [newName]: appState };
      setSavedPlans(newSavedPlans);
      localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
      setCurrentPlanName(newName);
      setIsDirty(false);
      setIsSaveAsModalOpen(false);
      showFeedback(`Plan saved as "${newName}".`);
  };

  const handleDeletePlan = (name: string) => {
    if (!name || !savedPlans[name]) {
        showFeedback('No plan selected to delete.');
        return;
    }
    const newSavedPlans = { ...savedPlans };
    delete newSavedPlans[name];
    setSavedPlans(newSavedPlans);
    localStorage.setItem('plp_allPlans', JSON.stringify(newSavedPlans));
    if (name === currentPlanName) {
        setAppState(prev => ({ ...initialAppState, branding: prev.branding, details: {...initialAppState.details, unit: prev.details.unit} }));
        setCurrentPlanName('');
        setIsDirty(false);
    }
    showFeedback(`Plan "${name}" deleted.`);
  };

  const handleDetailChange = (field: keyof CompetitionDetails, value: string | AttemptStrategy) => {
    setAppState(prev => {
      const newDetails = { ...prev.details, [field]: value };
      if (field === 'gender') newDetails.weightClass = '';
      return { ...prev, details: newDetails };
    });
    setIsDirty(true);
  };

  const handleUnitChangeAndRecalculate = (newUnit: 'kg' | 'lbs') => {
    setAppState(prev => {
        let newState = { ...prev, details: { ...prev.details, unit: newUnit }};
        (['squat', 'bench', 'deadlift'] as LiftType[]).forEach(lift => {
            const liftState = newState.lifts[lift];
            const opener = liftState.openerForWarmups;
            if (opener && !isNaN(parseFloat(opener))) {
                const { warmupStrategy, dynamicWarmupSettings } = liftState;
                const newWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings, newUnit);
                if (newWarmups) {
                    newState = resetGameDayForLift(newState, lift, { ...liftState, warmups: newWarmups });
                }
            }
        });
        return newState;
    });
    setIsDirty(true);
  };

  const handleToggleWarmupUnit = () => handleUnitChangeAndRecalculate(appState.details.unit === 'kg' ? 'lbs' : 'kg');
  
  const handleEquipmentChange = (field: keyof EquipmentSettings, value: string) => {
    setAppState(prev => ({ ...prev, equipment: { ...prev.equipment, [field]: value } }));
    setIsDirty(true);
  };

  const handlePersonalBestChange = (lift: LiftType, field: 'weight' | 'date', value: string) => {
    setAppState(prev => ({
      ...prev,
      personalBests: {
        ...prev.personalBests,
        [lift]: { ...prev.personalBests[lift], [field]: value }
      }
    }));
    setIsDirty(true);
  };

  const handleBrandingChange = (field: keyof BrandingState, value: string) => {
    setAppState(prev => ({ ...prev, branding: { ...prev.branding, [field]: value } }));
  };

  const handleSaveSettings = () => {
    try {
        localStorage.setItem('plp_branding', JSON.stringify(appState.branding));
        showFeedback('Settings saved!');
    } catch (error) {
        console.error("Failed to save branding to localStorage", error);
        showFeedback('Error saving settings.');
    }
  };

  const handleResetBranding = () => {
      setAppState(prev => ({ ...prev, branding: initialAppState.branding }));
      localStorage.removeItem('plp_branding');
      showFeedback('Branding reset to defaults.');
  };
  
  const resetGameDayForLift = (prev: AppState, lift: LiftType, updatedLiftState: LiftState): AppState => {
    const newGameDayLiftState: GameDayLiftState = {
        ...updatedLiftState,
        attempts: { ...updatedLiftState.attempts, status: { '1': 'pending', '2': 'pending', '3': 'pending' } },
        warmups: updatedLiftState.warmups.map(w => ({ ...w, completed: false }))
    };
    return { ...prev, lifts: { ...prev.lifts, [lift]: updatedLiftState }, gameDayState: { ...prev.gameDayState, [lift]: newGameDayLiftState } };
  };

  const handleAttemptChange = (lift: LiftType, attempt: '1' | '2' | '3', value: string) => {
    setAppState(prev => {
        let updatedLiftState = { ...prev.lifts[lift], attempts: { ...prev.lifts[lift].attempts, [attempt]: value }, error: false };
        
        if (autoGenerateWarmups && attempt === '1' && value) {
            const opener = value;
            const { warmupStrategy, dynamicWarmupSettings } = prev.lifts[lift];
            const newWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings, prev.details.unit);
            if (newWarmups) {
                updatedLiftState = { ...updatedLiftState, warmups: newWarmups, openerForWarmups: opener };
            }
        }

        return resetGameDayForLift(prev, lift, updatedLiftState);
    });
    setIsDirty(true);
  };
  
  const handleWarmupChange = (lift: LiftType, index: number, field: 'weight' | 'reps', value: string) => {
    setAppState(prev => {
        const newLiftsWarmups = [...prev.lifts[lift].warmups];
        newLiftsWarmups[index] = {...newLiftsWarmups[index], [field]: value};
        const newGameDayWarmups = [...prev.gameDayState[lift].warmups];
        newGameDayWarmups[index] = {...newGameDayWarmups[index], [field]: value};
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], warmups: newLiftsWarmups }}, gameDayState: { ...prev.gameDayState, [lift]: { ...prev.gameDayState[lift], warmups: newGameDayWarmups }}};
    });
    setIsDirty(true);
  };

  const handleCueChange = (lift: LiftType, index: number, value: string) => {
    setAppState(prev => {
        const newCues = [...prev.lifts[lift].cues];
        newCues[index] = value;
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], cues: newCues }}, gameDayState: { ...prev.gameDayState, [lift]: { ...prev.gameDayState[lift], cues: newCues }}};
    });
    setIsDirty(true);
  };

  const handleCoachingNoteChange = (lift: LiftType, value: string) => {
    setAppState(prev => {
        const newLiftState = { ...prev.lifts[lift], coachingNote: value };
        return { ...prev, lifts: { ...prev.lifts, [lift]: newLiftState }, gameDayState: { ...prev.gameDayState, [lift]: { ...prev.gameDayState[lift], coachingNote: value }}};
    });
    setIsDirty(true);
  };

  const handleCollarToggle = (lift: LiftType) => {
    setAppState(prev => ({ ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], includeCollars: !prev.lifts[lift].includeCollars }}, gameDayState: { ...prev.gameDayState, [lift]: { ...prev.gameDayState[lift], includeCollars: !prev.gameDayState[lift].includeCollars }}}));
    setIsDirty(true);
  };

  const handleWarmupStrategyChange = (lift: LiftType, strategy: WarmupStrategy) => {
    setAppState(prev => ({ ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], warmupStrategy: strategy }}}));
    setIsDirty(true);
  };

  const handleDynamicWarmupSettingsChange = (lift: LiftType, field: keyof AppState['lifts'][LiftType]['dynamicWarmupSettings'], value: string) => {
    setAppState(prev => ({ ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], dynamicWarmupSettings: { ...prev.lifts[lift].dynamicWarmupSettings, [field]: value }}}}));
    setIsDirty(true);
  };

  const handleCalculateAttempts = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const newAttempts = calculateAttempts(lift, prev.lifts[lift].attempts, prev.details.attemptStrategy);
      if (!newAttempts) {
        return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
      }
      
      let updatedLiftState = { ...prev.lifts[lift], attempts: newAttempts, error: false };
      
      if (autoGenerateWarmups) {
        const opener = newAttempts['1'];
        if (opener) {
            const { warmupStrategy, dynamicWarmupSettings } = prev.lifts[lift];
            const newWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings, prev.details.unit);
            if (newWarmups) {
                updatedLiftState = { ...updatedLiftState, warmups: newWarmups, openerForWarmups: opener };
            }
        }
      }
      
      return resetGameDayForLift(prev, lift, updatedLiftState);
    });
    setIsDirty(true);
  }, [autoGenerateWarmups]);

  const handleGenerateWarmups = useCallback((lift: LiftType) => {
    setAppState(prev => {
      const { attempts, warmupStrategy, dynamicWarmupSettings } = prev.lifts[lift];
      const opener = attempts['1'];
      if (!opener) return { ...prev, lifts: { ...prev.lifts, [lift]: { ...prev.lifts[lift], error: true } } };
      const newWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings, prev.details.unit);
      if (newWarmups) return resetGameDayForLift(prev, lift, { ...prev.lifts[lift], warmups: newWarmups, error: false, openerForWarmups: opener });
      return prev;
    });
    setIsDirty(true);
  }, []);

  const handleReset = useCallback((lift: LiftType) => {
    setAppState(prev => {
        const initialLiftState = initialAppState.lifts[lift];
        const newGameDayLiftState: GameDayLiftState = { ...initialLiftState, attempts: { ...initialLiftState.attempts, status: { '1': 'pending', '2': 'pending', '3': 'pending' }}, warmups: initialLiftState.warmups.map(w => ({...w, completed: false}))};
        return { ...prev, lifts: { ...prev.lifts, [lift]: initialLiftState }, gameDayState: { ...prev.gameDayState, [lift]: newGameDayLiftState }};
    });
    setIsDirty(true);
  }, []);
  
  const handleFullReset = useCallback(() => {
    const plans = localStorage.getItem('plp_allPlans');
    localStorage.clear();
    if(plans) localStorage.setItem('plp_allPlans', plans);
    setAppState(prev => ({...initialAppState, branding: prev.branding, details: {...initialAppState.details, unit: prev.details.unit } }));
    setCurrentPlanName('');
    setIsDirty(false);
    setIsResetModalOpen(false);
  }, []);

  const handleGameDayUpdate = (newGameDayState: Record<LiftType, GameDayLiftState>) => setAppState(prev => ({ ...prev, gameDayState: newGameDayState }));
  const handleSavePdf = (isMobile: boolean) => savePdf(isMobile ? exportToMobilePDF(appState) : exportToPDF(appState), `${appState.details.lifterName || 'Lifter'}_Competition_Plan${isMobile ? '_Mobile' : ''}.pdf`);
  
  const handleSharePdf = (isMobile: boolean) => {
      const blob = isMobile ? exportToMobilePDF(appState) : exportToPDF(appState);
      const fileName = `${appState.details.lifterName || 'Lifter'}_Competition_Plan${isMobile ? '_Mobile' : ''}.pdf`;
      const title = 'Powerlifting Competition Plan';
      const text = `Here is the competition plan for ${appState.details.lifterName || 'Lifter'}.`;
      sharePdf(blob, fileName, title, text);
  };

  const handleSaveLitePdf = () => {
    const liteState = { ...appState, branding: initialAppState.branding };
    savePdf(exportToPDF(liteState), `${appState.details.lifterName || 'Lifter'}_Competition_Plan.pdf`);
  };

  const handleBuildLitePlan = (name: string, thirds: Record<LiftType, string>) => {
    setAppState(prev => {
        let newLiftsState: LiftsState = JSON.parse(JSON.stringify(initialAppState.lifts));
        (['squat', 'bench', 'deadlift'] as LiftType[]).forEach(lift => {
            const third = thirds[lift];
            if (third && !isNaN(parseFloat(third))) {
                const calculatedAttempts = calculateAttempts(lift, { '1': '', '2': '', '3': third }, 'aggressive'); // Lite mode defaults to aggressive
                if (calculatedAttempts && calculatedAttempts['1']) {
                    const opener = calculatedAttempts['1'];
                    const { warmupStrategy, dynamicWarmupSettings } = initialAppState.lifts[lift];
                    const generatedWarmups = generateWarmups(lift, opener, warmupStrategy, dynamicWarmupSettings, prev.details.unit);
                    newLiftsState[lift] = { ...initialAppState.lifts[lift], attempts: calculatedAttempts, warmups: generatedWarmups || initialAppState.lifts[lift].warmups, openerForWarmups: opener };
                }
            }
        });
        return { ...prev, details: { ...prev.details, lifterName: name }, lifts: newLiftsState, gameDayState: deriveGameDayStateFromLifts(newLiftsState) };
    });
  };

  const handleResetLitePlan = () => {
    setAppState(prev => ({ ...prev, details: { ...prev.details, lifterName: '' }, lifts: initialAppState.lifts, gameDayState: deriveGameDayStateFromLifts(initialAppState.lifts) }));
  };

  const handleExportPlan = () => {
    const planData: PlanData = { details: appState.details, equipment: appState.equipment, lifts: appState.lifts, personalBests: appState.personalBests };
    const jsonString = JSON.stringify({ ...planData, version: appState.version }, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${appState.details.lifterName.replace(/ /g, '_') || 'lifter'}_plan.plp`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('Plan exported successfully!');
  };

  const handleImportPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read as text.");
            const data = JSON.parse(text);
            if (!isPlanData(data)) throw new Error("Invalid plan file format.");
            const migratedData = migrateState(data);
            setAppState(prev => ({ ...prev, ...migratedData, gameDayState: deriveGameDayStateFromLifts(migratedData.lifts) }));
            setCurrentPlanName('');
            setIsDirty(false);
            showFeedback('Plan imported! Use "Save As..." to save it.');
        } catch (error) {
            console.error("Failed to import plan:", error);
            showFeedback('Error: Could not import plan. File may be invalid.');
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handlePlannerImportClick = () => {
    triggerImport('.plp,.json', handleImportPlan);
  };
  
  const exportHelpContent = {
    title: 'Understanding Export Options',
    content: (
      <>
        <p className="mb-3">Choose the best format to save or share your plan:</p>
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Export Plan (.plp)</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">This is the app's native format. Use this to save a complete, editable backup of your plan or to share it with a coach or athlete who also uses this app. They can import the .plp file to load your exact setup.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Export to PDF (Desktop/Mobile)</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Creates a printable, interactive PDF for game day. The 'Desktop' version is a compact A4 layout, while the 'Mobile' version is optimized for phone screens with larger text. Both have checkboxes you can tap to track progress.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Share PDF</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Uses your device's native share function to quickly send the Mobile PDF via text, email, or other apps.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Export to CSV</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Saves your plan as a comma-separated values file, perfect for importing into spreadsheets like Excel or Google Sheets for data analysis.</p>
          </div>
        </div>
      </>
    )
  };
  
  // --- Render authenticated app ---
  const { details, lifts } = appState;

  const isBenchOnly = useMemo(() => {
    const isLiftDataEmpty = (liftState: LiftState): boolean => {
        const attemptsEmpty = Object.values(liftState.attempts).every(a => a.trim() === '');
        const warmupsEmpty = liftState.warmups.every(w => w.weight.trim() === '' && w.reps.trim() === '');
        return attemptsEmpty && warmupsEmpty;
    };
    
    const benchHasData = !isLiftDataEmpty(appState.lifts.bench);
    const squatIsEmpty = isLiftDataEmpty(appState.lifts.squat);
    const deadliftIsEmpty = isLiftDataEmpty(appState.lifts.deadlift);

    return benchHasData && squatIsEmpty && deadliftIsEmpty;
  }, [appState.lifts]);

  const predictedTotal = useMemo(() => {
    const s3 = parseFloat(lifts.squat.attempts['3']);
    const b3 = parseFloat(lifts.bench.attempts['3']);
    const d3 = parseFloat(lifts.deadlift.attempts['3']);
    
    if (isBenchOnly) {
        return isNaN(b3) ? 0 : b3;
    }

    return (isNaN(s3) ? 0 : s3) + (isNaN(b3) ? 0 : b3) + (isNaN(d3) ? 0 : d3);
  }, [lifts, isBenchOnly]);

  const bw = parseFloat(details.bodyWeight);
  const gender = details.gender;
  const score = calculateScore(predictedTotal, bw, gender, details.scoringFormula, isBenchOnly);
  const isAttemptValid = (value: string) => !isNaN(parseFloat(value)) && parseFloat(value) > 0;
  const allNineAttemptsFilled = ['squat', 'bench', 'deadlift'].every(lift => ['1', '2', '3'].every(att => isAttemptValid(lifts[lift as LiftType].attempts[att as '1'|'2'|'3'])));
  const checkLiftCompletion = (liftState: LiftState): boolean => isAttemptValid(liftState.attempts['1']) && isAttemptValid(liftState.attempts['2']) && isAttemptValid(liftState.attempts['3']) && liftState.warmups.some(w => isAttemptValid(w.weight));
  const liftCompletionStatus = { squat: checkLiftCompletion(lifts.squat), bench: checkLiftCompletion(lifts.bench), deadlift: checkLiftCompletion(lifts.deadlift) };
  
  const renderFormGroup = (label: string, id: keyof CompetitionDetails | keyof EquipmentSettings, placeholder: string, type: string = "text") => {
    const value = id in details ? details[id as keyof CompetitionDetails] : appState.equipment[id as keyof EquipmentSettings];
    return <div className="flex flex-col"><label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label><input id={id} type={type} placeholder={placeholder} value={value as string} onChange={e => id in details ? handleDetailChange(id as keyof CompetitionDetails, e.target.value) : handleEquipmentChange(id as keyof EquipmentSettings, e.target.value)} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"/></div>;
  };
  const renderSelectGroup = (label: string, id: keyof EquipmentSettings, options: string[]) => <div className="flex flex-col"><label htmlFor={id} className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{label}</label><select id={id} value={appState.equipment[id]} onChange={e => handleEquipmentChange(id, e.target.value)} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"><option value="">Select option</option>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>;
  const renderMobileScore = () => { if (predictedTotal <= 0) return '--'; if (isNaN(bw) || bw <= 0) return <span className="text-base text-yellow-400">Enter BW</span>; if (!gender) return <span className="text-base text-yellow-400">Select Gender</span>; return score.toFixed(2); };
  if (isGameDayModeActive) return <GameDayMode gameDayState={appState.gameDayState} onGameDayUpdate={handleGameDayUpdate} lifterName={details.lifterName} onExit={() => setIsGameDayModeActive(false)} unit={details.unit} details={details} isBenchOnly={isBenchOnly} />;
  
  const commonSettingsMenuProps = { onBrandingClick: () => setIsBrandingModalOpen(true), onToolsClick: () => setIsToolsModalOpen(true), onToggleDarkMode: handleToggleTheme, isDarkMode: theme === 'dark', planAttemptsInLbs, onTogglePlanAttemptsInLbs: handleTogglePlanAttemptsInLbs, isCoachingMode, onToggleCoachingMode: handleToggleCoachingMode, onSaveSettings: handleSaveSettings, warmupUnit: details.unit, onToggleWarmupUnit: handleToggleWarmupUnit, scoringFormula: details.scoringFormula, onScoringFormulaChange: (value: ScoringFormula) => handleDetailChange('scoringFormula', value), autoGenerateWarmups, onToggleAutoGenerateWarmups: handleToggleAutoGenerateWarmups };
  const headerTitles = { planner: 'Powerlifting Meet Planner', oneRepMax: '1RM Calculator', warmupGenerator: 'Warm-up Generator', velocityProfile: 'Velocity Profile Generator', techniqueScore: 'Technique Score Calculator', workoutTimer: 'Workout Timer', pricing: 'Pricing & Plans', homescreen: 'PLATFORM COACH' };

  return (
    <div className="font-sans bg-gradient-to-br from-[#0066FF] to-[#0044AA] min-h-screen">
      <input type="file" ref={fileInputRef} onChange={onFileInputChange} className="hidden" aria-hidden="true" />
      <header className="bg-slate-900 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          {currentView === 'homescreen' ? (
            <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">{headerTitles.homescreen}</h1>
              <div className="sm:absolute sm:right-0 flex items-center gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  {(subscription.isPro || subscription.isEnterprise) && (
                    <button
                      onClick={() => setCurrentView('pricing')}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-900 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-md shadow-sm"
                    >
                      {subscription.tier?.toUpperCase()}
                    </button>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SettingsMenu {...commonSettingsMenuProps} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-center"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{headerTitles[currentView]}</h1></div>
              <div className="grid grid-cols-3 items-center">
                <div className="flex justify-start"><button onClick={() => setCurrentView('homescreen')} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50" aria-label="Back to toolkit home"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button></div>
                <div className="flex justify-center items-center gap-4">{currentView === 'planner' && <ViewToggle mode={viewMode} onToggle={setViewMode} />}{currentView === 'velocityProfile' && <ModeToggle modes={[{ key: 'generate', label: 'Generate Profile' }, { key: 'test', label: 'Complete Test' }]} activeMode={velocityProfileMode} onToggle={(newMode) => { if (viewMode === 'lite' && newMode === 'generate') { alert("The 'Generate Profile' feature is for coaches in Pro mode. Athletes should use the 'Complete Test' feature."); return; } setVelocityProfileMode(newMode as 'generate' | 'test'); }} disabled={viewMode === 'lite'} />}{(currentView === 'oneRepMax' || currentView === 'warmupGenerator' || currentView === 'techniqueScore' || currentView === 'workoutTimer') && <SettingsMenu {...commonSettingsMenuProps} />}</div>
                <div className="flex justify-end items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    {(subscription.isPro || subscription.isEnterprise) && (
                      <button
                        onClick={() => setCurrentView('pricing')}
                        className="px-2 py-1 text-xs font-semibold text-purple-900 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-md shadow-sm"
                      >
                        {subscription.tier?.toUpperCase()}
                      </button>
                    )}
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                  { (currentView === 'planner' || currentView === 'velocityProfile') && <SettingsMenu {...commonSettingsMenuProps} /> }
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <Popover isOpen={popoverState.isOpen} title={popoverState.title} onClose={hidePopover}>{popoverState.content}</Popover>
      <SettingsModal isOpen={isBrandingModalOpen} onClose={() => setIsBrandingModalOpen(false)} title="PDF Branding & Theming"><BrandingSection branding={appState.branding} onBrandingChange={handleBrandingChange} onSave={() => { handleSaveSettings(); setIsBrandingModalOpen(false); }} onReset={handleResetBranding} /></SettingsModal>
      <ToolsModal isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} />
      {isSaveAsModalOpen && <SaveAsModal isOpen={isSaveAsModalOpen} onClose={() => setIsSaveAsModalOpen(false)} onSave={handleSaveAs} existingPlanNames={Object.keys(savedPlans)} />}

      <SignedOut>
        {!showSignUpPricing ? (
          /* Welcome page with Sign In / Sign Up */
          <div className="max-w-4xl mx-auto p-8 sm:p-12 lg:p-16">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
              <div className="mb-8">
                <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-6">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  Welcome to Platform Coach
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                  The professional powerlifting meet planner and training toolkit for serious athletes and coaches.
                </p>
              </div>

              <div className="space-y-4 mb-12">
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-12 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-all transform hover:scale-105">
                    Sign In
                  </button>
                </SignInButton>
                <div className="text-slate-500 dark:text-slate-400">or</div>
                <button
                  onClick={() => setShowSignUpPricing(true)}
                  className="w-full sm:w-auto px-12 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-lg transition-all transform hover:scale-105"
                >
                  Sign Up
                </button>
              </div>

              <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">Competition Meet Planner</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">Workout Timer</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">1RM Calculator</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">Warmup Generator</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">Velocity Profile Generator</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">Technique Score Calculator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Show pricing table for new signups */
          <div className="max-w-4xl mx-auto p-8 sm:p-12 lg:p-16">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
                Select a plan to get started. You'll create your account as part of the checkout process.
              </p>
            </div>

            {/* Clerk Billing Pricing Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
              <PricingTable />
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setShowSignUpPricing(false)}
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                ← Back to welcome
              </button>
            </div>

            <div className="text-center mt-4 text-slate-400 text-sm">
              Already have an account? <SignInButton mode="modal"><span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">Sign In</span></SignInButton>
            </div>
          </div>
        )}
      </SignedOut>

      <SignedIn>
      {/* Show loading state while checking subscription */}
      {subscription.isLoading ? (
        <div className="max-w-4xl mx-auto p-8 sm:p-12 lg:p-16 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
            <p className="text-lg text-slate-600 dark:text-slate-300">Loading your account...</p>
          </div>
        </div>
      ) : !subscription.isActive || subscription.isFree ? (
        /* User is signed in but doesn't have an active paid subscription - show pricing */
        <div className="max-w-4xl mx-auto p-8 sm:p-12 lg:p-16">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Subscribe to Access Platform Coach
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
              Choose your plan to unlock the complete powerlifting toolkit used by athletes and coaches worldwide.
            </p>
          </div>

          {/* Clerk Billing Pricing Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <PricingTable />
          </div>

          <div className="text-center mt-6 text-slate-300 text-sm">
            Questions? Contact support at your-email@example.com
          </div>
        </div>
      ) : (
        /* User has active paid subscription - show full app */
        <>
      {currentView === 'homescreen' && <Homescreen onNavigateToPlanner={() => { setCurrentView('planner'); setViewMode('pro'); }} onNavigateToOneRepMax={() => setCurrentView('oneRepMax')} onNavigateToWarmupGenerator={() => setCurrentView('warmupGenerator')} onNavigateToVelocityProfile={() => setCurrentView('velocityProfile')} onNavigateToTechniqueScore={() => setCurrentView('techniqueScore')} onNavigateToWorkoutTimer={() => setCurrentView('workoutTimer')} />}
      {currentView === 'oneRepMax' && <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><OneRepMaxCalculator branding={appState.branding} /></div>}
      {currentView === 'warmupGenerator' && <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><WarmupGenerator /></div>}
      {currentView === 'techniqueScore' && <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><TechniqueScoreCalculator branding={appState.branding} /></div>}
      {currentView === 'velocityProfile' && <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><VelocityProfileGenerator 
        branding={appState.branding} 
        mode={velocityProfileMode}
        onHelpClick={(mode) => {
            if (mode === 'generate') {
                showPopover(helpContent.velocityProfileGenerate.title, helpContent.velocityProfileGenerate.content);
            } else {
                showPopover(helpContent.velocityProfileTest.title, helpContent.velocityProfileTest.content);
            }
        }}
        onTriggerImport={triggerImport}
        /></div>}
      {currentView === 'workoutTimer' && <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"><WorkoutTimer /></div>}
      {currentView === 'pricing' && <PricingPage onClose={() => setCurrentView('homescreen')} />}

      {currentView === 'planner' && (
        <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 xl:pb-8">
          {viewMode === 'pro' ? (
          <>
              <main className="flex-1 min-w-0">
                <CollapsibleSection title="Save & Load Plans" onHelpClick={() => showPopover(helpContent.saveLoad.title, helpContent.saveLoad.content)}><SaveLoadSection currentPlanName={currentPlanName} isDirty={isDirty} savedPlans={savedPlans} feedbackMessage={feedbackMessage} onSelectAndLoadPlan={handleSelectAndLoadPlan} onUpdatePlan={handleUpdatePlan} onOpenSaveAsModal={() => setIsSaveAsModalOpen(true)} onDeletePlan={handleDeletePlan} onExportPlan={handleExportPlan} onImportPlanClick={handlePlannerImportClick} /></CollapsibleSection>
                <Section title="Lifter Name" onHelpClick={() => showPopover(helpContent.lifterName.title, helpContent.lifterName.content)} headerAction={<button onClick={() => setIsResetModalOpen(true)} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm transition-colors" aria-label="Clear the entire form">Clear Form</button>}>{renderFormGroup("Lifter Name", "lifterName", "e.g., John Doe", "text")}</Section>
                <CollapsibleSection title="Competition Details" onHelpClick={() => showPopover(helpContent.details.title, helpContent.details.content)}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderFormGroup("Event Name", "eventName", "e.g., National Championships")}<div className="flex flex-col"><label htmlFor="gender" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Gender</label><select id="gender" value={details.gender} onChange={e => handleDetailChange('gender', e.target.value as 'male' | 'female' | '')} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option></select></div><div className="flex flex-col"><label htmlFor="weightClass" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Weight Class</label><input id="weightClass" type="text" list="ipf-weight-classes" placeholder={details.gender ? "Select or type" : "Select gender first"} value={details.weightClass} onChange={e => handleDetailChange('weightClass', e.target.value)} disabled={!details.gender} className="w-full text-center p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400 disabled:bg-slate-200 dark:disabled:bg-slate-800"/>{details.gender && <datalist id="ipf-weight-classes">{(IPF_WEIGHT_CLASSES[details.gender] || []).map(wc => <option key={wc} value={wc} />)}</datalist>}</div>{renderFormGroup("Competition Date", "competitionDate", "YYYY-MM-DD", "date")}{renderFormGroup("Weigh-in Time", "weighInTime", "HH:MM", "time")}{renderFormGroup("Weigh-in Body Weight (kg)", "bodyWeight", "e.g., 82.5", "number")}</div></CollapsibleSection>
                <CollapsibleSection title="Equipment Settings" onHelpClick={() => showPopover(helpContent.equipment.title, helpContent.equipment.content)}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderFormGroup("Squat Rack Height", "squatRackHeight", "e.g., 12")}{renderSelectGroup("Squat Stands", "squatStands", ["In", "Out", "Left In", "Right In"])}{renderFormGroup("Bench Rack Height", "benchRackHeight", "e.g., 8")}{renderSelectGroup("Hand Out", "handOut", ["Self", "Yes"])}{renderFormGroup("Bench Safety Height", "benchSafetyHeight", "e.g., 4")}</div></CollapsibleSection>
                
                <div className="rounded-lg shadow-md mb-8">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-t-lg gap-1" data-tour-id="lift-tabs">{(['squat', 'bench', 'deadlift'] as LiftType[]).map(lift => {
                      const isActive = activeLiftTab === lift;
                      let buttonClasses = 'flex-1 py-3 px-2 text-center font-semibold text-base capitalize transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-indigo-400 rounded-md flex items-center justify-center gap-2 ';

                      if (isBenchOnly && lift === 'bench') {
                        if (isActive) {
                            buttonClasses += 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 shadow-lg ring-2 ring-green-400';
                        } else {
                            buttonClasses += 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 hover:bg-green-200/70 dark:hover:bg-green-800/70';
                        }
                      } else if (isActive) {
                          buttonClasses += 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm';
                      } else {
                          buttonClasses += 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60';
                      }

                      return (
                        <button key={lift} onClick={() => setActiveLiftTab(lift)} className={buttonClasses}>
                            <span>{lift}</span>
                            {liftCompletionStatus[lift] && ! (isBenchOnly && lift === 'bench') && <span className="w-2.5 h-2.5 bg-green-500 rounded-full" title={`${lift} plan complete`}></span>}
                        </button>
                      );
                  })}</div>
                  <div className="bg-white dark:bg-slate-700 rounded-b-lg">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-600 animate-fadeIn">
                      <div className="flex justify-center items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Attempt Selection Strategy</h3>
                        <InfoIcon onClick={() => showPopover(helpContent.attemptStrategy.title, helpContent.attemptStrategy.content)} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center justify-center gap-1 max-w-sm mx-auto">
                        {(['aggressive', 'stepped', 'conservative'] as AttemptStrategy[]).map(strategy => (
                          <button
                            key={strategy}
                            onClick={() => handleDetailChange('attemptStrategy', strategy)}
                            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-700 focus:ring-slate-500 ${
                              details.attemptStrategy === strategy
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                                : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                            }`}
                          >
                            {strategy}
                          </button>
                        ))}
                      </div>
                    </div>
                    <LiftSection key={activeLiftTab} containerClassName="p-6 animate-fadeIn" liftType={activeLiftTab} liftState={lifts[activeLiftTab]} unit={details.unit} planAttemptsInLbs={planAttemptsInLbs} isCoachingMode={isCoachingMode} onAttemptChange={handleAttemptChange} onWarmupChange={handleWarmupChange} onCueChange={handleCueChange} onCoachingNoteChange={handleCoachingNoteChange} onCalculateAttempts={handleCalculateAttempts} onGenerateWarmups={handleGenerateWarmups} onReset={handleReset} onCollarToggle={handleCollarToggle} onHelpClick={() => showPopover(helpContent.lifts.title, helpContent.lifts.content)} onWarmupStrategyChange={handleWarmupStrategyChange} onDynamicWarmupSettingsChange={handleDynamicWarmupSettingsChange} onWarmupHelpClick={() => showPopover(helpContent.warmupStrategy.title, helpContent.warmupStrategy.content)} autoGenerateWarmups={autoGenerateWarmups} />
                  </div>
                </div>

                <div>
                    <CollapsibleSection title="Personal Bests" initiallyOpen={false}>
                        <PersonalBestsSection
                            personalBests={appState.personalBests}
                            unit={details.unit}
                            onChange={handlePersonalBestChange}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Export & Share Plan"
                        initiallyOpen={!isMobile}
                        onHelpClick={() => showPopover(exportHelpContent.title, exportHelpContent.content)}
                    >
                        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
                            <button onClick={handleExportPlan} className="w-full sm:w-auto px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export Plan (.plp)</button>
                            <button onClick={() => exportToCSV(appState)} className="w-full sm:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export to CSV</button>
                            <button onClick={() => handleSavePdf(false)} className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export PDF (Desktop)</button>
                            <button onClick={() => handleSavePdf(true)} className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Export PDF (Mobile)</button>
                            {canShare && <button onClick={() => handleSharePdf(true)} className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105">Share PDF</button>}
                        </div>
                    </CollapsibleSection>
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold mb-2">Ready for the Platform?</h3>
                        <p className="text-orange-100 mb-4">Switch to a simplified, high-contrast view for use during the competition.</p>
                        <button onClick={() => setIsGameDayModeActive(true)} className="px-8 py-4 bg-white hover:bg-orange-50 text-orange-600 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-xl" aria-label="Enter Game Day Mode">🚀 Launch Game Day Mode</button>
                    </div>
                </div>
              </main>
              <aside className="hidden xl:block w-full xl:w-96 xl:sticky xl:top-8 self-start"><SummarySidebar lifterName={details.lifterName} total={predictedTotal} score={score} lifts={lifts} bodyWeight={details.bodyWeight} gender={details.gender} allAttemptsFilled={allNineAttemptsFilled} scoringFormula={details.scoringFormula} /></aside>
          </>
          ) : ( <LiteModeView appState={appState} onBuildPlan={handleBuildLitePlan} onLifterNameChange={(name) => handleDetailChange('lifterName', name)} onAttemptChange={handleAttemptChange} onWarmupChange={handleWarmupChange} onResetPlan={handleResetLitePlan} onLaunchGameDay={() => setIsGameDayModeActive(true)} onSaveLitePDF={handleSaveLitePdf} onImportPlanClick={handlePlannerImportClick} onHelpClick={() => showPopover(helpContent.liteMode.title, helpContent.liteMode.content)} /> )}
        </div>
      )}

      {currentView === 'planner' && viewMode === 'pro' && (
        <div className="block xl:hidden">
            <button onClick={() => setIsSummarySheetOpen(true)} className="fixed bottom-0 left-0 right-0 w-full h-16 bg-slate-900/80 backdrop-blur-sm text-white p-2 shadow-lg flex justify-between items-center z-30" aria-label="Open plan summary"><div className="flex-1 text-center"><p className="text-xs font-medium text-slate-300">Total</p><p className={`text-xl font-bold tracking-tight ${predictedTotal > 0 && !allNineAttemptsFilled ? 'text-yellow-400' : ''}`}>{predictedTotal > 0 ? `${predictedTotal} kg` : '--'}</p></div><div className="border-l border-slate-600 h-3/5"></div><div className="flex-1 text-center"><p className="text-xs font-medium text-slate-300">Score</p><p className="text-xl font-bold tracking-tight">{renderMobileScore()}</p></div><div className="px-4 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7-7" /></svg></div></button>
            <MobileSummarySheet isOpen={isSummarySheetOpen} onClose={() => setIsSummarySheetOpen(false)} lifterName={details.lifterName} total={predictedTotal} score={score} lifts={lifts} bodyWeight={details.bodyWeight} gender={details.gender} allAttemptsFilled={allNineAttemptsFilled} scoringFormula={details.scoringFormula} />
        </div>
      )}

      {isResetModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white dark:bg-slate-700 p-8 rounded-lg shadow-2xl max-w-sm w-full"><h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Confirm Clear Form</h3><p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to clear the form? This will remove all details and equipment settings, but will not delete your saved plans.</p><div className="flex justify-end gap-4"><button onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100">Cancel</button><button onClick={handleFullReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors">Yes, Clear Form</button></div></div></div>}
        </>
      )}
      </SignedIn>
    </div>
  );
};

export default App;