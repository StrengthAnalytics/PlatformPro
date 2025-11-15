import React from 'react';
import { UPGRADE_URL, BRANDING } from '../config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

/**
 * Modal component shown to free users when they attempt to access pro features
 * Redirects to the paid version's pricing page
 */
const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  featureDescription
}) => {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    window.location.href = UPGRADE_URL;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-popIn">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">
          Upgrade to Platform Coach
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-center mb-4">
          <span className="font-semibold text-orange-600 dark:text-orange-400">{featureName}</span> is a premium feature available in Platform Coach.
        </p>
        {featureDescription && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
            {featureDescription}
          </p>
        )}

        {/* Benefits */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Unlock with Platform Coach:</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save & load unlimited competition plans</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Export to PDF & CSV</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Game Day Mode for competition</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Advanced VBT tools & analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Full training load calculator</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors"
          >
            Continue with Free Version
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Try free tools now, upgrade when you're ready
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;
