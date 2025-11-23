/**
 * Powerlifting Records Lookup Utilities
 *
 * Provides search, filter, and comparison utilities for powerlifting records
 */

import type { PowerliftingRecord, RecordLookupParams, RecordComparison } from '../types';
import { getRecordsData } from './recordsData';

// Cache for lazy loading
let recordsCache: PowerliftingRecord[] | null = null;

/**
 * Get all records (lazy-loaded)
 */
export function getRecords(): PowerliftingRecord[] {
  if (recordsCache === null) {
    recordsCache = getRecordsData();
  }
  return recordsCache;
}

/**
 * Convert PlatformPro lift names to records format
 */
function normalizeLift(lift: string): string {
  const liftMap: Record<string, string> = {
    squat: 'squat',
    bench: 'bench_press',
    bench_press: 'bench_press',
    deadlift: 'deadlift',
    total: 'total',
  };
  return liftMap[lift.toLowerCase()] || lift;
}

/**
 * Convert PlatformPro gender to records format
 */
function normalizeGender(gender: string): 'M' | 'F' | undefined {
  const genderLower = gender.toLowerCase();
  if (genderLower === 'male' || genderLower === 'm') return 'M';
  if (genderLower === 'female' || genderLower === 'f') return 'F';
  return undefined;
}

/**
 * Normalize equipment format
 */
function normalizeEquipment(equipment: string): 'equipped' | 'unequipped' | undefined {
  const equipLower = equipment.toLowerCase();
  if (equipLower === 'equipped' || equipLower === 'raw') return 'equipped';
  if (equipLower === 'unequipped' || equipLower === 'classic') return 'unequipped';
  return undefined;
}

/**
 * Parse weight class to numeric value for comparison
 */
function parseWeightClass(weightClass: string): number {
  const match = weightClass.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Check if a weight class matches a filter
 * For records display, we want exact matches only
 */
function matchesWeightClass(recordClass: string, filterClass: string): boolean {
  // Exact match only - show only records from the specific weight class selected
  return recordClass === filterClass;
}

/**
 * Normalize age category for flexible matching
 */
function normalizeAgeCategory(category: string): string {
  const categoryUpper = category.toUpperCase().trim();

  // Normalize common variations
  const categoryMap: Record<string, string> = {
    OPEN: 'Open',
    O: 'Open',  // Scottish data uses 'O' for Open
    JUNIOR: 'J',
    JR: 'J',
    'SUB-JUNIOR': 'SJ',
    SUBJUNIOR: 'SJ',
    'U-23': 'U23',
    'UNDER 23': 'U23',
    'U-18': 'U18',
    'UNDER 18': 'U18',
    'U-16': 'U16',
    'UNDER 16': 'U16',
  };

  return categoryMap[categoryUpper] || categoryUpper;
}

/**
 * Filter records by lookup parameters
 */
export function findRecords(params: RecordLookupParams): PowerliftingRecord[] {
  const records = getRecords();

  return records.filter((record) => {
    // Gender filter
    if (params.gender) {
      const normalizedGender = normalizeGender(params.gender);
      if (normalizedGender && record.gender !== normalizedGender) {
        return false;
      }
    }

    // Weight class filter
    if (params.weightClass && !matchesWeightClass(record.weightClass, params.weightClass)) {
      return false;
    }

    // Lift filter
    if (params.lift) {
      const normalizedLift = normalizeLift(params.lift);
      if (record.lift !== normalizedLift) {
        return false;
      }
    }

    // Age category filter
    if (params.ageCategory) {
      const normalizedCategory = normalizeAgeCategory(params.ageCategory);
      const recordCategory = normalizeAgeCategory(record.ageCategory);
      if (recordCategory !== normalizedCategory) {
        return false;
      }
    }

    // Equipment filter
    if (params.equipment) {
      const normalizedEquipment = normalizeEquipment(params.equipment);
      if (normalizedEquipment && record.equipment !== normalizedEquipment) {
        return false;
      }
    }

    // Region filter
    if (params.region && record.region !== params.region) {
      return false;
    }

    return true;
  });
}

/**
 * Find the highest record matching the criteria
 */
export function findTopRecord(params: RecordLookupParams): PowerliftingRecord | null {
  const matchingRecords = findRecords(params);

  if (matchingRecords.length === 0) {
    return null;
  }

  // Sort by record value descending and return the highest
  return matchingRecords.reduce((highest, current) => {
    return current.record > highest.record ? current : highest;
  });
}

/**
 * Compare a weight to matching records
 */
export function compareToRecords(
  weight: number,
  params: RecordLookupParams
): RecordComparison[] {
  const matchingRecords = findRecords(params);

  return matchingRecords.map((record) => {
    const difference = weight - record.record;
    const percentageOfRecord = (weight / record.record) * 100;

    return {
      record,
      difference,
      percentageOfRecord,
    };
  });
}

/**
 * Find all lift records for a lifter profile
 */
export function findRecordsForProfile(
  gender: string,
  weightClass: string,
  ageCategory: string,
  equipment: string,
  region: string
): Record<string, PowerliftingRecord | null> {
  const normalizedGender = normalizeGender(gender);
  const normalizedEquipment = normalizeEquipment(equipment);

  if (!normalizedGender || !normalizedEquipment) {
    return {
      squat: null,
      bench_press: null,
      deadlift: null,
      total: null,
    };
  }

  const baseParams: RecordLookupParams = {
    gender: normalizedGender,
    weightClass,
    ageCategory,
    equipment: normalizedEquipment,
    region,
  };

  return {
    squat: findTopRecord({ ...baseParams, lift: 'squat' }),
    bench_press: findTopRecord({ ...baseParams, lift: 'bench_press' }),
    deadlift: findTopRecord({ ...baseParams, lift: 'deadlift' }),
    total: findTopRecord({ ...baseParams, lift: 'total' }),
  };
}

/**
 * Get a human-readable proximity message
 */
export function getRecordProximityMessage(
  weight: number,
  record: PowerliftingRecord
): string {
  const difference = weight - record.record;
  const absDifference = Math.abs(difference);

  if (difference > 0) {
    return `${absDifference.toFixed(1)}kg above the record`;
  } else if (difference < 0) {
    return `${absDifference.toFixed(1)}kg from the record`;
  } else {
    return 'Equals the record!';
  }
}

/**
 * Check if a weight would be a new record
 */
export function wouldBeRecord(weight: number, params: RecordLookupParams): boolean {
  const topRecord = findTopRecord(params);

  if (!topRecord) {
    // No existing record found
    return false;
  }

  return weight > topRecord.record;
}

/**
 * Get records statistics
 */
export function getRecordsStats() {
  const records = getRecords();

  const stats = {
    total: records.length,
    byRegion: {} as Record<string, number>,
    byGender: {} as Record<string, number>,
    byLift: {} as Record<string, number>,
    byEquipment: {} as Record<string, number>,
  };

  records.forEach((record) => {
    stats.byRegion[record.region] = (stats.byRegion[record.region] || 0) + 1;
    stats.byGender[record.gender] = (stats.byGender[record.gender] || 0) + 1;
    stats.byLift[record.lift] = (stats.byLift[record.lift] || 0) + 1;
    stats.byEquipment[record.equipment] = (stats.byEquipment[record.equipment] || 0) + 1;
  });

  return stats;
}
