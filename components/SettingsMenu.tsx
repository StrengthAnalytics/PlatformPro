import React, { useState, useRef, useEffect } from 'react';
import { ScoringFormula } from '../types';

interface SettingsMenuProps {
    onBrandingClick: () => void;
    onToggleDarkMode: () => void;
    onToolsClick: () => void;
    isDarkMode: boolean;
    planAttemptsInLbs: boolean;
    onTogglePlanAttemptsInLbs: () => void;
    onSaveSettings: () => void;
    warmupUnit: 'kg' | 'lbs';
    onToggleWarmupUnit: () => void;
    scoringFormula: ScoringFormula;
    onScoringFormulaChange: (formula: ScoringFormula) => void;
    autoGenerateWarmups: boolean;
    onToggleAutoGenerateWarmups: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
    onBrandingClick,
    onToggleDarkMode,
    onToolsClick,
    isDarkMode,
    planAttemptsInLbs,
    onTogglePlanAttemptsInLbs,
    onSaveSettings,
    warmupUnit,
    onToggleWarmupUnit,
    scoringFormula,
    onScoringFormulaChange,
    autoGenerateWarmups,
    onToggleAutoGenerateWarmups
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Open settings menu"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-popIn">
                    <div className="py-1">
                        <button
                            onClick={() => { onToolsClick(); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            Plate Calculator & Tools
                        </button>
                         <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <button
                            onClick={() => { onBrandingClick(); setIsOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            PDF Branding
                        </button>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="px-4 py-3">
                            <label htmlFor="scoringFormulaMenu" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scoring Formula</label>
                            <select
                                id="scoringFormulaMenu"
                                value={scoringFormula}
                                onChange={(e) => onScoringFormulaChange(e.target.value as ScoringFormula)}
                                className="w-full text-left p-2 border border-slate-200 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                            >
                                <option value="ipfgl">IPF GL Points</option>
                                <option value="dots">DOTS</option>
                                <option value="wilks">Wilks</option>
                            </select>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-slate-700 dark:text-slate-200">Plan Attempts in lbs</span>
                            <button
                                onClick={onTogglePlanAttemptsInLbs}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 ${planAttemptsInLbs ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={planAttemptsInLbs}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${planAttemptsInLbs ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-slate-700 dark:text-slate-200">Auto-Generate Warm-ups</span>
                            <button
                                onClick={onToggleAutoGenerateWarmups}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 ${autoGenerateWarmups ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={autoGenerateWarmups}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoGenerateWarmups ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                         <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-slate-700 dark:text-slate-200">Warm-Ups in lbs</span>
                            <button
                                onClick={onToggleWarmupUnit}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 ${warmupUnit === 'lbs' ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={warmupUnit === 'lbs'}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${warmupUnit === 'lbs' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-slate-700 dark:text-slate-200">Dark Mode</span>
                            <button
                                onClick={onToggleDarkMode}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                role="switch"
                                aria-checked={isDarkMode}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700"></div>
                    <div className="p-2 space-y-2">
                        <button
                            onClick={() => {
                                window.open('https://www.strengthanalytics.co.uk/contact', '_blank');
                                setIsOpen(false);
                            }}
                            className="w-full text-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                            🐛 Report a Bug
                        </button>
                        <button
                            onClick={() => { onSaveSettings(); setIsOpen(false); }}
                            className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-md transition-colors"
                        >
                            Save All Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsMenu;