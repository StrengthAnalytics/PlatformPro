import React from 'react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requiredTier: 'pro' | 'enterprise';
  onUpgrade: () => void;
}

/**
 * Component that gates features behind a subscription tier
 * Shows an upgrade prompt if the user doesn't have the required subscription
 */
const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  requiredTier,
  onUpgrade
}) => {
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {requiredTier === 'pro' ? 'Pro Feature' : 'Enterprise Feature'}
          </h3>

          <p className="text-slate-600 dark:text-slate-300 mb-6">
            This feature requires a {requiredTier === 'pro' ? 'Pro' : 'Enterprise'} subscription.
            Upgrade now to unlock this and many other powerful features.
          </p>

          <button
            onClick={onUpgrade}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Upgrade to {requiredTier === 'pro' ? 'Pro' : 'Enterprise'}
          </button>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
