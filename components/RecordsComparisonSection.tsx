import React, { useMemo } from 'react';
import { findTopRecord } from '../utils/recordsLookup';
import type { RecordLookupParams } from '../types';

interface RecordsComparisonSectionProps {
  region: string;
  weightClass: string;
  ageCategory: string;
  equipment: 'equipped' | 'unequipped';
  onRegionChange: (region: string) => void;
  onAgeCategoryChange: (ageCategory: string) => void;
  onEquipmentChange: (equipment: 'equipped' | 'unequipped') => void;
  gender: 'male' | 'female' | '';
}

const RecordsComparisonSection: React.FC<RecordsComparisonSectionProps> = ({
  region,
  weightClass,
  ageCategory,
  equipment,
  onRegionChange,
  onAgeCategoryChange,
  onEquipmentChange,
  gender,
}) => {
  // Common regions
  const regions = [
    'British',
    'England',
    'Wales',
    'Scotland',
    'Northern Ireland',
    'Yorkshire & North East',
    'North West',
    'North Midlands',
    'East Midlands',
    'West Midlands',
    'Greater London',
    'South West',
    'South Midlands',
    'South East',
    'British Universities',
  ];

  // Age categories
  const ageCategories = ['Open', 'J', 'U23', 'U18', 'U16', 'SJ', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  // Weight classes (IPF)
  const maleWeightClasses = ['53kg', '59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120+kg'];
  const femaleWeightClasses = ['43kg', '47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84+kg'];

  const weightClasses = gender === 'male' ? maleWeightClasses : gender === 'female' ? femaleWeightClasses : [];

  // Convert gender to records format
  const genderForRecords = gender === 'male' ? 'M' : gender === 'female' ? 'F' : undefined;

  // Fetch records for each lift
  const records = useMemo(() => {
    if (!region || !weightClass || !ageCategory || !equipment || !genderForRecords) {
      return null;
    }

    const params: RecordLookupParams = {
      gender: genderForRecords,
      weightClass,
      ageCategory,
      equipment,
      region,
    };

    return {
      squat: findTopRecord({ ...params, lift: 'squat' }),
      bench: findTopRecord({ ...params, lift: 'bench_press' }),
      deadlift: findTopRecord({ ...params, lift: 'deadlift' }),
      total: findTopRecord({ ...params, lift: 'total' }),
      benchAC: findTopRecord({ ...params, lift: 'bench_press_ac' }),
    };
  }, [region, weightClass, ageCategory, equipment, genderForRecords]);

  const lifts = [
    { key: 'squat', label: 'Squat', record: records?.squat },
    { key: 'bench', label: 'Bench Press', record: records?.bench },
    { key: 'deadlift', label: 'Deadlift', record: records?.deadlift },
    { key: 'total', label: 'Total', record: records?.total },
    { key: 'benchAC', label: 'Bench Press A/C', record: records?.benchAC },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Compare your planned attempts against powerlifting records. Select your region, weight class, age category, and equipment type.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="records-region" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Region
          </label>
          <select
            id="records-region"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Select Region</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="records-weight-class" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Weight Class
          </label>
          <select
            id="records-weight-class"
            value={weightClass}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 cursor-not-allowed opacity-75"
            disabled
          >
            <option value="">{weightClass || 'Set in Competition Details'}</option>
            {weightClass && weightClasses.map((wc) => (
              <option key={wc} value={wc}>
                {wc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="records-age-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Age Category
          </label>
          <select
            id="records-age-category"
            value={ageCategory}
            onChange={(e) => onAgeCategoryChange(e.target.value)}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Select Age Category</option>
            {ageCategories.map((ac) => (
              <option key={ac} value={ac}>
                {ac}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="records-equipment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Equipment
          </label>
          <select
            id="records-equipment"
            value={equipment}
            onChange={(e) => onEquipmentChange(e.target.value as 'equipped' | 'unequipped')}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="unequipped">Unequipped</option>
            <option value="equipped">Equipped</option>
          </select>
        </div>
      </div>

      {/* Records Display */}
      {records && region && weightClass && ageCategory && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {lifts.map(({ key, label, record }) => (
            <div
              key={key}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
            >
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {label}
              </h4>

              {record ? (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {record.record}kg
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {record.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(record.dateSet).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No record found
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(!region || !weightClass || !ageCategory) && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          Select region, weight class, and age category to view records
        </div>
      )}
    </div>
  );
};

export default RecordsComparisonSection;
