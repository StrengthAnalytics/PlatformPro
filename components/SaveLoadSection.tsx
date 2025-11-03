import React from 'react';
import type { AppState } from '../types';
import IconButton from './IconButton';

interface SaveLoadSectionProps {
  currentPlanName: string;
  isDirty: boolean;
  savedPlans: Record<string, AppState>;
  feedbackMessage: string;
  onSelectAndLoadPlan: (name: string) => void;
  onUpdatePlan: () => void;
  onOpenSaveAsModal: () => void;
  onDeletePlan: (name: string) => void;
  onExportPlan: () => void;
  onImportPlanClick: () => void;
}

const SaveLoadSection: React.FC<SaveLoadSectionProps> = ({
  currentPlanName,
  isDirty,
  savedPlans,
  feedbackMessage,
  onSelectAndLoadPlan,
  onUpdatePlan,
  onOpenSaveAsModal,
  onDeletePlan,
  onExportPlan,
  onImportPlanClick,
}) => {
  
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Load Plan */}
        <div className="flex flex-col gap-2">
            <label htmlFor="selectPlan" className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Load Saved Plan</label>
            <select
                id="selectPlan"
                value={currentPlanName}
                onChange={e => onSelectAndLoadPlan(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
            >
                <option value="">-- New Plan --</option>
                {Object.keys(savedPlans).length > 0 ? (
                Object.keys(savedPlans).sort().map(name => <option key={name} value={name}>{name}</option>)
                ) : (
                <option disabled>No saved plans found</option>
                )}
            </select>
        </div>

        {/* Delete Plan */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Actions</label>
            <IconButton
                onClick={() => onDeletePlan(currentPlanName)}
                variant="danger"
                disabled={!currentPlanName}
                aria-label="Delete the currently loaded plan"
            >
                Delete Current Plan
            </IconButton>
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-600 my-2"></div>
      
      {/* Save Actions */}
      <div className="flex flex-col gap-2">
        <div className="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Currently editing:
          </span>
          <span className="ml-1 font-bold text-slate-800 dark:text-slate-100">
            {currentPlanName || 'Unsaved Plan'}
            {isDirty && <span className="text-amber-600 ml-1">*</span>}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-2">
            <IconButton
              onClick={onUpdatePlan}
              variant="info"
              className="flex-1"
              disabled={!isDirty || !currentPlanName}
              aria-label={!isDirty ? 'No changes to save' : `Update the ${currentPlanName} plan`}
            >
              Save Changes
            </IconButton>
            <IconButton
                onClick={onOpenSaveAsModal}
                className="flex-1"
                aria-label="Save the current configuration as a new plan"
            >
                Save As...
            </IconButton>
        </div>
      </div>


      {/* Feedback Message */}
      {feedbackMessage &&
        <div className="text-center text-green-700 dark:text-green-400 font-semibold transition-opacity duration-300 mt-2">
          {feedbackMessage}
        </div>
      }

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-600 my-4"></div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <IconButton
          onClick={onImportPlanClick}
          variant="secondary"
          className="flex-1"
          aria-label="Import a plan from a .plp file"
        >
          Import Plan...
        </IconButton>
        <IconButton
          onClick={onExportPlan}
          variant="secondary"
          className="flex-1"
          aria-label="Export the current plan to a .plp file"
        >
          Export Plan
        </IconButton>
      </div>
    </div>
  );
};

export default SaveLoadSection;