import React from 'react';
import { PricingTable } from '@clerk/clerk-react';

interface PricingPageProps {
  onClose?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Upgrade Your Training
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include full access to our powerlifting toolkit.
        </p>
      </div>

      {/* Clerk Billing Pricing Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        <PricingTable />
      </div>

      {onClose && (
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-300 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
