import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingPlanNames: string[];
}

const SaveAsModal: React.FC<SaveAsModalProps> = ({ isOpen, onClose, onSave, existingPlanNames }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Plan name cannot be empty.');
      return;
    }
    if (existingPlanNames.includes(name.trim())) {
      setError('A plan with this name already exists. Please choose a different name.');
      return;
    }
    onSave(name.trim());
    onClose();
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Save Plan As...</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">Please enter a name for this competition plan.</p>
        <div>
          <label htmlFor="newPlanName" className="sr-only">Plan Name</label>
          <input
            id="newPlanName"
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., Nationals Prep 2024"
            className={`w-full text-center p-2 border rounded-md shadow-sm focus:ring-1 bg-slate-50 text-slate-900 dark:bg-slate-700 dark:text-slate-50 ${error ? 'border-red-500 ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500'}`}
            autoFocus
          />
          {error && <p className="text-red-600 text-xs mt-1 text-center">{error}</p>}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-100">Cancel</button>
          <IconButton onClick={handleSave}>Save</IconButton>
        </div>
      </div>
    </div>
  );
};

export default SaveAsModal;