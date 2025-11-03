import { LiftType, Attempt, WarmupSet, Plate, DynamicWarmupSettings, ScoringFormula, CustomWarmupParams, AttemptStrategy } from '../types';
import { 
    ATTEMPT_STRATEGIES, 
    SQUAT_WARMUPS, BENCH_WARMUPS, DEADLIFT_WARMUPS,
    SQUAT_REP_SCHEMES, BENCH_REP_SCHEMES, DEADLIFT_REP_SCHEMES 
} from '../constants';

export const roundToNearest2point5 = (value: number): number => {
  return Math.round(value / 2.5) * 2.5;
};

export const roundToNearest5 = (value: number): number => {
  return Math.round(value / 5) * 5;
};

export const roundToNearest10 = (value: number): number => {
  return Math.round(value / 10) * 10;
};

export const kgToLbs = (kg: number): number => {
    if (isNaN(kg) || kg <= 0) return 0;
    return roundToNearest5(kg * 2.20462);
};

export const lbsToKg = (lbs: number): number => {
    if (isNaN(lbs) || lbs <= 0) return 0;
    return roundToNearest2point5(lbs / 2.20462);
};

export const calculateAttempts = (liftType: LiftType, attempts: Attempt, strategy: AttemptStrategy): Attempt | null => {
  const opener = parseFloat(attempts['1']);
  const third = parseFloat(attempts['3']);

  if (!opener && !third) {
    return null;
  }

  const newAttempts: Attempt = { ...attempts };

  // Perform strategy-based calculations first
  if (strategy === 'stepped') {
    const percentages = ATTEMPT_STRATEGIES[strategy][liftType];
    if (third && !opener) {
      const secondAttempt = roundToNearest2point5(third * percentages.fromThird.second);
      const jump = third - secondAttempt;
      const firstAttempt = secondAttempt - jump;
      newAttempts['1'] = roundToNearest2point5(firstAttempt).toString();
      newAttempts['2'] = secondAttempt.toString();
    } else if (opener) {
      const secondAttempt = roundToNearest2point5(opener * percentages.fromOpener.second);
      const jump = secondAttempt - opener;
      const thirdAttempt = secondAttempt + jump;
      newAttempts['2'] = secondAttempt.toString();
      newAttempts['3'] = roundToNearest2point5(thirdAttempt).toString();
    }
  } else { // 'aggressive' and 'conservative' strategies
    const percentages = ATTEMPT_STRATEGIES[strategy][liftType];
    if (third && !opener) {
      newAttempts['1'] = roundToNearest2point5(third * percentages.fromThird.first).toString();
      newAttempts['2'] = roundToNearest2point5(third * percentages.fromThird.second).toString();
    } else if (opener) {
      newAttempts['2'] = roundToNearest2point5(opener * percentages.fromOpener.second).toString();
      newAttempts['3'] = roundToNearest2point5(opener * percentages.fromOpener.third).toString();
    }
  }

  // Post-calculation validation and enforcement of global rules
  const finalA1Num = parseFloat(newAttempts['1']);
  const finalA2Num = parseFloat(newAttempts['2']);
  const finalA3Num = parseFloat(newAttempts['3']);

  // Only proceed if all three attempts are valid numbers after initial calculation
  if (!isNaN(finalA1Num) && !isNaN(finalA2Num) && !isNaN(finalA3Num)) {
    let a1 = finalA1Num;
    let a2 = finalA2Num;
    let a3 = finalA3Num;

    if (opener && !third) { // Anchor was the opener
      // Rule 1: Enforce strictly increasing attempts (no duplicates)
      if (a2 <= a1) a2 = a1 + 2.5;
      if (a3 <= a2) a3 = a2 + 2.5;

      // Rule 2: Enforce jump rule (jump1 >= jump2)
      const jump1 = a2 - a1;
      const jump2 = a3 - a2;
      if (jump1 < jump2) {
        a3 = a2 + jump1; // Adjust 3rd to make jumps equal or decreasing
      }
    } else if (third && !opener) { // Anchor was the third attempt
      // Rule 1: Enforce strictly increasing attempts (no duplicates)
      if (a2 >= a3) a2 = a3 - 2.5;
      if (a1 >= a2) a1 = a2 - 2.5;
      
      // Rule 2: Enforce jump rule (jump1 >= jump2)
      const jump1 = a2 - a1;
      const jump2 = a3 - a2;
      if (jump1 < jump2) {
        a1 = a2 - jump2; // Adjust 1st to make jumps equal or decreasing
      }
    }
    
    // Final rounding and conversion back to string to ensure loadable weights
    newAttempts['1'] = roundToNearest2point5(a1).toString();
    newAttempts['2'] = roundToNearest2point5(a2).toString();
    newAttempts['3'] = roundToNearest2point5(a3).toString();
  }

  return newAttempts;
};


export const generateDynamicWarmups = (liftType: LiftType, openerValue: number, settings: DynamicWarmupSettings, unit: 'kg' | 'lbs'): WarmupSet[] => {
    const numSets = parseInt(settings.numSets, 10);
    const startWeightKg = parseFloat(settings.startWeight);
    const finalWarmupPercent = parseFloat(settings.finalWarmupPercent) / 100;

    const emptyResult = () => Array(8).fill({ weight: '', reps: '' });

    if (isNaN(numSets) || isNaN(startWeightKg) || isNaN(finalWarmupPercent) || numSets < 2) {
        return emptyResult();
    }

    const targetFinalWarmup = openerValue * finalWarmupPercent;
    const weightRange = targetFinalWarmup - startWeightKg;
    
    if (weightRange <= 0) {
        return emptyResult();
    }

    const numJumps = numSets - 1;
    const jumpWeights = Array.from({ length: numJumps }, (_, i) => numJumps - i);
    const totalParts = jumpWeights.reduce((sum, part) => sum + part, 0);

    const partSize = weightRange / totalParts;

    const warmupsKg: number[] = [startWeightKg];
    let currentWeight = startWeightKg;

    for (let i = 0; i < numJumps; i++) {
        const jumpSize = jumpWeights[i] * partSize;
        currentWeight += jumpSize;
        warmupsKg.push(currentWeight);
    }
    
    const roundedWarmupsKg = warmupsKg.map(w => roundToNearest2point5(w));

    const finalWarmupValues = unit === 'lbs'
      ? roundedWarmupsKg.map(w => roundToNearest5(w * 2.20462))
      : roundedWarmupsKg;

    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];

    const reps = repSchemes[finalWarmupValues.length] || [];

    const result: WarmupSet[] = [];
    for (let i = 0; i < 8; i++) {
        if (i < finalWarmupValues.length) {
            result.push({
                weight: finalWarmupValues[i].toString(),
                reps: (reps[i] !== undefined ? reps[i].toString() : '1')
            });
        } else {
            result.push({ weight: '', reps: '' });
        }
    }
    return result;
};


export const generateWarmups = (
    liftType: LiftType, 
    opener: string, 
    strategy: 'default' | 'dynamic',
    dynamicSettings: DynamicWarmupSettings,
    unit: 'kg' | 'lbs' = 'kg'
): WarmupSet[] | null => {
    const openerValue = parseFloat(opener);
    if (isNaN(openerValue)) {
        return null;
    }

    if (strategy === 'dynamic') {
        return generateDynamicWarmups(liftType, openerValue, dynamicSettings, unit);
    }

    // Default strategy
    const roundedOpener = roundToNearest2point5(openerValue);

    const lookup: Record<number, number[]> = {
        squat: SQUAT_WARMUPS,
        bench: BENCH_WARMUPS,
        deadlift: DEADLIFT_WARMUPS
    }[liftType];

    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];

    const warmupsKg = lookup[roundedOpener];
    if (!warmupsKg) {
        return [];
    }

    const finalWarmupValues = unit === 'lbs' 
      ? warmupsKg.map(w => roundToNearest5(w * 2.20462)) 
      : warmupsKg;
      
    const reps = repSchemes[warmupsKg.length] || [];

    const result: WarmupSet[] = [];
    for(let i=0; i<8; i++){
        if(i < finalWarmupValues.length) {
            result.push({
                weight: finalWarmupValues[i].toString(),
                reps: (reps[i] || '').toString()
            });
        } else {
             result.push({ weight: '', reps: '' });
        }
    }
    return result;
};


export const getPlateBreakdown = (
  totalKg: number, 
  includeCollars: boolean,
  plateType: '20kg' | '25kg' = '25kg'
): string => {
  const barWeight = 20;
  const collarWeight = includeCollars ? 5 : 0;
  const plateSet = plateType === '20kg'
    ? [20, 15, 10, 5, 2.5, 1.25]
    : [25, 20, 15, 10, 5, 2.5, 1.25];
  
  const totalWeightIncludingBar = barWeight + collarWeight;
  if (isNaN(totalKg) || totalKg < barWeight) {
      return 'Invalid weight';
  }
  
  if (totalKg < totalWeightIncludingBar) {
      if (totalKg === barWeight) return 'None';
      return 'Invalid weight'; // e.g. 22.5kg with collars is impossible
  }

  let weightPerSide = (totalKg - barWeight) / 2;
  if(includeCollars) {
      weightPerSide -= 2.5;
  }

  if (weightPerSide < 0) return 'None'; // Should be covered by above checks, but for safety
  if (weightPerSide > 0 && weightPerSide < 1.25) return 'Unloadable';

  const breakdown: string[] = [];
  let remainingWeight = weightPerSide;

  for (const plate of plateSet) {
    const count = Math.floor(remainingWeight / plate);
    if (count > 0) {
      breakdown.push(`${count}×${plate}kg`);
      remainingWeight -= count * plate;
    }
  }

  return breakdown.length ? breakdown.join(' + ') : `None`;
};

export const getLbsPlateBreakdown = (totalLbs: number): string => {
  const barWeight = 45;
  // Common lb plates, collars are not typically factored in this way
  const plateSet = [45, 35, 25, 10, 5, 2.5]; 
  
  if (isNaN(totalLbs) || totalLbs < barWeight) {
    return totalLbs === barWeight ? `Bar only (${barWeight}lbs)` : '';
  }
  
  let weightPerSide = (totalLbs - barWeight) / 2;

  if (weightPerSide < 0) return `Bar only (${barWeight}lbs)`;

  const breakdown: string[] = [];
  let remainingWeight = weightPerSide;

  for (const plate of plateSet) {
    const count = Math.floor(remainingWeight / plate);
    if (count > 0) {
      breakdown.push(`${count}×${plate}lbs`);
      remainingWeight -= count * plate;
    }
  }

  const breakdownText = breakdown.join(' + ');
  return breakdown.length ? `Bar + ${breakdownText}` : `Bar only (${barWeight}lbs)`;
};

export const getLbsPlateBreakdownPerSide = (totalLbs: number): string => {
    const barWeight = 45;
    const plateSet = [45, 35, 25, 10, 5, 2.5]; 
    
    if (isNaN(totalLbs) || totalLbs < barWeight) {
        return totalLbs === barWeight ? `None` : 'Invalid weight';
    }
    
    let weightPerSide = (totalLbs - barWeight) / 2;

    if (weightPerSide <= 0) return `None`;

    const breakdown: string[] = [];
    let remainingWeight = weightPerSide;

    for (const plate of plateSet) {
        const count = Math.floor(remainingWeight / plate);
        if (count > 0) {
        breakdown.push(`${count}×${plate}lbs`);
        remainingWeight -= count * plate;
        }
    }

    return breakdown.length ? breakdown.join(' + ') : `None`;
};

export const PLATE_COLORS: Record<number, string> = {
    25: 'bg-red-500',
    20: 'bg-blue-600',
    15: 'bg-yellow-400',
    10: 'bg-green-500',
    5: 'bg-slate-100 border-2 border-slate-400',
    2.5: 'bg-slate-800',
    1.25: 'bg-slate-400',
    0.5: 'bg-slate-300',
    0.25: 'bg-slate-200',
};

export const PLATE_SIZES: Record<number, string> = {
    25: 'h-10 w-3',
    20: 'h-10 w-2.5',
    15: 'h-9 w-2.5',
    10: 'h-9 w-2',
    5: 'h-8 w-2',
    2.5: 'h-7 w-1.5',
    1.25: 'h-6 w-1',
    0.5: 'h-5 w-1',
    0.25: 'h-4 w-1',
};

const PLATE_SIZES_LARGE: Record<number, string> = {
    25: 'h-14 w-5',
    20: 'h-14 w-4',
    15: 'h-12 w-4',
    10: 'h-12 w-3',
    5: 'h-11 w-3',
    2.5: 'h-10 w-2',
    1.25: 'h-8 w-2',
    0.5: 'h-7 w-2',
    0.25: 'h-6 w-2',
};

export const LBS_PLATE_COLORS: Record<number, string> = {
    45: 'bg-red-500',
    35: 'bg-blue-600',
    25: 'bg-green-500',
    10: 'bg-slate-100 border-2 border-slate-400',
    5: 'bg-yellow-400',
    2.5: 'bg-slate-800',
};

export const LBS_PLATE_SIZES: Record<number, string> = {
    45: 'h-10 w-3',
    35: 'h-10 w-2.5',
    25: 'h-9 w-2.5',
    10: 'h-9 w-2',
    5: 'h-8 w-2',
    2.5: 'h-7 w-1.5',
};

const LBS_PLATE_SIZES_LARGE: Record<number, string> = {
    45: 'h-14 w-5',
    35: 'h-14 w-4',
    25: 'h-12 w-4',
    10: 'h-12 w-3',
    5: 'h-11 w-3',
    2.5: 'h-10 w-2',
};

export const getPlatesForDisplay = (
    totalKg: number, 
    includeCollars: boolean, 
    size: 'sm' | 'lg' = 'sm',
    plateType: '20kg' | '25kg' = '25kg'
): Plate[] => {
    const barWeight = 20;
    
    if (isNaN(totalKg) || totalKg < barWeight) {
        return [];
    }

    let weightPerSide = (totalKg - barWeight) / 2;

    if (includeCollars) {
        weightPerSide -= 2.5; // Account for one collar on one side
    }

    if (weightPerSide < 0) {
        return []; // Not possible to load this with collars
    }
    
    const plateSet = plateType === '20kg'
      ? [20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25]
      : [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
      
    const plates: Plate[] = [];
    const plateSizeMap = size === 'lg' ? PLATE_SIZES_LARGE : PLATE_SIZES;

    for (const plateWeight of plateSet) {
        // Use a tolerance for floating point issues
        const count = Math.floor(weightPerSide / plateWeight + 1e-9);
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                plates.push({
                    weight: plateWeight,
                    color: PLATE_COLORS[plateWeight] || '',
                    size: plateSizeMap[plateWeight] || '',
                });
            }
            weightPerSide -= count * plateWeight;
        }
    }
    return plates;
};

export const getLbsPlatesForDisplay = (
    totalLbs: number, 
    size: 'sm' | 'lg' = 'sm'
): Plate[] => {
    const barWeight = 45;
    
    if (isNaN(totalLbs) || totalLbs < barWeight) {
        return [];
    }

    let weightPerSide = (totalLbs - barWeight) / 2;
    
    if (weightPerSide < 0) {
        return [];
    }
    
    const plateSet = [45, 35, 25, 10, 5, 2.5];
      
    const plates: Plate[] = [];
    const plateSizeMap = size === 'lg' ? LBS_PLATE_SIZES_LARGE : LBS_PLATE_SIZES;

    for (const plateWeight of plateSet) {
        const count = Math.floor(weightPerSide / plateWeight + 1e-9);
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                plates.push({
                    weight: plateWeight,
                    color: LBS_PLATE_COLORS[plateWeight] || '',
                    size: plateSizeMap[plateWeight] || '',
                });
            }
            weightPerSide -= count * plateWeight;
        }
    }
    return plates;
};


const WILKS_COEFFICIENTS = {
    male: { a: -216.0475144, b: 16.2606339, c: -0.002388645, d: -0.00113732, e: 7.01863e-6, f: -1.291e-8 },
    female: { a: 594.31747775582, b: -27.23842536447, c: 0.82112226871, d: -0.00930733913, e: 4.731582e-5, f: -9.054e-8 }
};

const DOTS_COEFFICIENTS = {
    male: { a: -0.0000010930, b: 0.0007391293, c: -0.0017887, d: 0.0737973, e: -3.80172, f: 521.6422 },
    female: { a: -0.0000010192, b: 0.0005158589, c: -0.0011363, d: 0.0315354, e: -2.3444, f: 409.5093 }
};

const calculateIPFGLScore = (total: number, bodyWeight: number, gender: 'male' | 'female', type: '3-lift' | 'bench-only' = '3-lift'): number => {
    // Per the reference implementation, the formula is not valid for bodyweights under 35kg.
    if (bodyWeight < 35) {
        return 0;
    }

    // Coefficients for RAW lifts, sourced from the OpenPowerlifting calculator.
    const params = {
        '3-lift': {
            male: { A: 1199.72839, B: 1025.18162, C: 0.009210 },
            female: { A: 610.32796, B: 1045.59282, C: 0.03048 }
        },
        'bench-only': {
            male: { A: 320.98041, B: 281.40258, C: 0.01008 },
            female: { A: 142.40398, B: 442.52671, C: 0.04724 }
        }
    };
    
    const { A, B, C } = params[type][gender];
    
    const denominator = A - B * Math.exp(-C * bodyWeight);

    // The formula is (100 / denominator) * total.
    // Avoid division by zero and return 0 if the result is invalid.
    if (denominator <= 0) {
        return 0;
    }
    
    return (100 / denominator) * total;
};

const calculateWilksScore = (total: number, bodyWeight: number, gender: 'male' | 'female'): number => {
    const { a, b, c, d, e, f } = WILKS_COEFFICIENTS[gender];
    const denominator = a + (b * bodyWeight) + (c * Math.pow(bodyWeight, 2)) + (d * Math.pow(bodyWeight, 3)) + (e * Math.pow(bodyWeight, 4)) + (f * Math.pow(bodyWeight, 5));
    return total * (500 / denominator);
};

const calculateDOTSScore = (total: number, bodyWeight: number, gender: 'male' | 'female'): number => {
    const { a, b, c, d, e, f } = DOTS_COEFFICIENTS[gender];
    const denominator = (a * Math.pow(bodyWeight, 5)) + (b * Math.pow(bodyWeight, 4)) + (c * Math.pow(bodyWeight, 3)) + (d * Math.pow(bodyWeight, 2)) + (e * bodyWeight) + f;
    return total * (500 / denominator);
};

export const calculateScore = (total: number, bodyWeight: number, gender: 'male' | 'female' | '', formula: ScoringFormula, isBenchOnly: boolean = false): number => {
    if (total <= 0 || bodyWeight <= 0 || !gender) {
        return 0;
    }

    let score: number;
    switch (formula) {
        case 'wilks':
            score = calculateWilksScore(total, bodyWeight, gender);
            break;
        case 'dots':
            score = calculateDOTSScore(total, bodyWeight, gender);
            break;
        case 'ipfgl':
        default:
            score = calculateIPFGLScore(total, bodyWeight, gender, isBenchOnly ? 'bench-only' : '3-lift');
            break;
    }
    
    if (isNaN(score) || !isFinite(score)) {
        return 0;
    }
    
    return parseFloat(score.toFixed(2));
};

export const generateCustomWarmups = (params: CustomWarmupParams): WarmupSet[] | null => {
    const { targetWeight, liftType, unit } = params;

    if (targetWeight <= 20) return null;

    const workingSetKg = unit === 'lbs' ? lbsToKg(targetWeight) : targetWeight;

    // 1. Select the correct, pre-defined warm-up table
    const lookup: Record<number, number[]> = {
        squat: SQUAT_WARMUPS,
        bench: BENCH_WARMUPS,
        deadlift: DEADLIFT_WARMUPS
    }[liftType];

    // 2. Find the closest matching plan from the table
    const availableKeys = Object.keys(lookup).map(parseFloat);
    const closestKey = availableKeys.reduce((prev, curr) => {
        return (Math.abs(curr - workingSetKg) < Math.abs(prev - workingSetKg) ? curr : prev);
    });

    const warmupsKg = lookup[closestKey];
    if (!warmupsKg) {
        return []; // Should not happen if lookup is valid
    }

    // 3. Determine the rep scheme based on the number of sets in the chosen plan
    const repSchemes: Record<number, number[]> = {
        squat: SQUAT_REP_SCHEMES,
        bench: BENCH_REP_SCHEMES,
        deadlift: DEADLIFT_REP_SCHEMES
    }[liftType];
    const reps = repSchemes[warmupsKg.length] || [];

    // 4. Format the weights for display, converting to lbs if necessary
    const finalWarmupValues = unit === 'lbs' 
      ? warmupsKg.map(w => roundToNearest5(w * 2.20462)) 
      : warmupsKg;

    // 5. Build the final WarmupSet array
    const result: WarmupSet[] = finalWarmupValues.map((weight, index) => ({
        weight: String(weight),
        reps: (reps[index] !== undefined ? String(reps[index]) : '1'), // Fallback rep
    }));
    
    return result;
};