import React from 'react';

interface TrialBannerProps {
  daysRemaining: number;
}

// TODO: Replace this placeholder with your actual Kajabi subscription page URL when ready.
const KAJABI_UPGRADE_URL = '#';

const TrialBanner: React.FC<TrialBannerProps> = ({ daysRemaining }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg shadow-md mb-8 max-w-7xl mx-auto text-center animate-fadeIn">
      <p className="font-semibold">
        ✨ You're on a Pro trial! You have{' '}
        <span className="font-bold text-lg">{daysRemaining}</span> day{daysRemaining !== 1 ? 's' : ''} left.{' '}
        <a 
          href={KAJABI_UPGRADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
        >
          Upgrade Now
        </a>
      </p>
    </div>
  );
};

export default TrialBanner;
