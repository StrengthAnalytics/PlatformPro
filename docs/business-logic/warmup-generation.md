# Business Logic: Warmup Generation

## Purpose
Generates competition warmup sets based on the lifter's opener. Supports two strategies:
1. **Default**: Uses predefined warmup tables based on coaching experience
2. **Dynamic**: User-configured progression with custom parameters

## Algorithm Overview

### Default Strategy
1. Round opener to nearest 2.5kg
2. Look up warmup weights from predefined tables
3. Apply appropriate rep schemes
4. Convert to lbs if needed
5. Return 8-slot array (some may be empty)

### Dynamic Strategy
1. Parse user settings (num sets, start weight, final warmup %)
2. Calculate target final warmup (opener × final warmup %)
3. Generate progressive weight increases using weighted jumps
4. Apply rep schemes based on number of sets
5. Convert to lbs if needed
6. Return 8-slot array

## Implementation

**File:** `utils/calculator.ts`
**Functions:**
- `generateWarmups()` - Main function
- `generateDynamicWarmups()` - Dynamic strategy implementation

```typescript
export const generateWarmups = (
  liftType: LiftType,
  opener: string,
  strategy: 'default' | 'dynamic',
  dynamicSettings: DynamicWarmupSettings,
  unit: 'kg' | 'lbs' = 'kg'
): WarmupSet[] | null
```

## Inputs

```typescript
interface Inputs {
  liftType: 'squat' | 'bench' | 'deadlift';
  opener: string;  // Numeric string (kg)
  strategy: 'default' | 'dynamic';
  dynamicSettings: {
    numSets: string;           // "3" to "8"
    startWeight: string;       // Usually "20" (empty bar)
    finalWarmupPercent: string; // "85" to "95" (percent of opener)
  };
  unit: 'kg' | 'lbs';
}
```

## Outputs

```typescript
interface Outputs {
  // Returns null if opener is invalid
  // Returns array of 8 WarmupSet objects
  warmups: Array<{
    weight: string;  // Weight for this set
    reps: string;    // Number of reps
  }>;
}
```

Always returns 8 slots. Unused slots have empty strings for weight and reps.

## Default Strategy Details

### Warmup Tables

Predefined tables map opener weights to warmup progressions:

**Squat Example (70kg opener):**
```typescript
SQUAT_WARMUPS[70] = [20, 40, 50, 55, 60]
// 5 warmup sets before 70kg opener
```

**Bench Example (90kg opener):**
```typescript
BENCH_WARMUPS[90] = [20, 30, 40, 50, 60, 70, 80]
// 7 warmup sets before 90kg opener
```

**Deadlift Example (180kg opener):**
```typescript
DEADLIFT_WARMUPS[180] = [60, 80, 100, 120, 140, 160]
// 6 warmup sets before 180kg opener
```

### Rep Schemes

Rep schemes vary by lift and number of warmup sets:

**Squat (5 sets):**
```typescript
SQUAT_REP_SCHEMES[5] = [5, 5, 3, 2, 1]
```

**Bench (7 sets):**
```typescript
BENCH_REP_SCHEMES[7] = [10, 8, 5, 3, 2, 1, 1]
```

**Deadlift (6 sets):**
```typescript
DEADLIFT_REP_SCHEMES[6] = [5, 3, 3, 2, 1, 1]
```

### Lookup Logic

1. Round opener to nearest 2.5kg
2. Find warmup array in lookup table
3. If exact match not found, returns empty array
4. Pair each weight with corresponding rep from rep scheme

## Dynamic Strategy Details

### Algorithm Steps

1. **Parse settings:**
   ```typescript
   numSets = parseInt(numSets, 10);
   startWeightKg = parseFloat(startWeight);
   finalWarmupPercent = parseFloat(finalWarmupPercent) / 100;
   ```

2. **Calculate target:**
   ```typescript
   targetFinalWarmup = opener × finalWarmupPercent;
   weightRange = targetFinalWarmup - startWeightKg;
   ```

3. **Generate weighted jumps:**
   ```typescript
   // For 5 sets: jumps are weighted [4, 3, 2, 1]
   jumpWeights = [numSets-1, numSets-2, ..., 1];
   totalParts = sum(jumpWeights);
   partSize = weightRange / totalParts;
   ```

4. **Calculate progressive weights:**
   ```typescript
   weights = [startWeight];
   currentWeight = startWeight;
   for each jump:
     jumpSize = jumpWeight × partSize;
     currentWeight += jumpSize;
     weights.push(currentWeight);
   ```

5. **Round and apply reps:**
   - Round each weight to nearest 2.5kg
   - Apply rep scheme for that number of sets

### Weighted Jump Rationale

Weighted jumps create larger jumps early, smaller jumps as you approach the opener:
- More gradual progression near working weight
- Faster progression through lighter weights
- Mimics natural warmup pattern

## Examples

### Example 1: Default Strategy - Squat 150kg Opener

**Input:**
```typescript
{
  liftType: 'squat',
  opener: '150',
  strategy: 'default',
  unit: 'kg'
}
```

**Lookup:**
```typescript
SQUAT_WARMUPS[150] = [20, 60, 80, 100, 120, 135]
SQUAT_REP_SCHEMES[6] = [5, 5, 3, 3, 2, 1]
```

**Output:**
```typescript
[
  { weight: '20', reps: '5' },
  { weight: '60', reps: '5' },
  { weight: '80', reps: '3' },
  { weight: '100', reps: '3' },
  { weight: '120', reps: '2' },
  { weight: '135', reps: '1' },
  { weight: '', reps: '' },
  { weight: '', reps: '' }
]
```

### Example 2: Dynamic Strategy - Bench 100kg Opener

**Input:**
```typescript
{
  liftType: 'bench',
  opener: '100',
  strategy: 'dynamic',
  dynamicSettings: {
    numSets: '5',
    startWeight: '20',
    finalWarmupPercent: '90'
  },
  unit: 'kg'
}
```

**Calculation:**
```typescript
targetFinalWarmup = 100 × 0.90 = 90kg
weightRange = 90 - 20 = 70kg
jumpWeights = [4, 3, 2, 1]  // For 5 sets
totalParts = 4 + 3 + 2 + 1 = 10
partSize = 70 / 10 = 7kg

weights:
  Set 1: 20kg (start)
  Set 2: 20 + (4 × 7) = 48kg
  Set 3: 48 + (3 × 7) = 69kg
  Set 4: 69 + (2 × 7) = 83kg
  Set 5: 83 + (1 × 7) = 90kg

Rounded to 2.5kg:
  [20, 50, 70, 82.5, 90]

Reps (from BENCH_REP_SCHEMES[5]):
  [10, 5, 3, 2, 1]
```

**Output:**
```typescript
[
  { weight: '20', reps: '10' },
  { weight: '50', reps: '5' },
  { weight: '70', reps: '3' },
  { weight: '82.5', reps: '2' },
  { weight: '90', reps: '1' },
  { weight: '', reps: '' },
  { weight: '', reps: '' },
  { weight: '', reps: '' }
]
```

### Example 3: Unit Conversion (lbs)

**Input:**
```typescript
{
  liftType: 'squat',
  opener: '150',
  strategy: 'default',
  unit: 'lbs'
}
```

**Process:**
1. Lookup warmups in kg: [20, 60, 80, 100, 120, 135]
2. Convert each to lbs: [44, 132, 176, 220, 265, 298]
3. Round to nearest 5 lbs: [45, 130, 175, 220, 265, 295]

**Output:**
```typescript
[
  { weight: '45', reps: '5' },
  { weight: '130', reps: '5' },
  { weight: '175', reps: '3' },
  { weight: '220', reps: '3' },
  { weight: '265', reps: '2' },
  { weight: '295', reps: '1' },
  { weight: '', reps: '' },
  { weight: '', reps: '' }
]
```

## Edge Cases

### Edge Case 1: Invalid Opener
**Input:** `opener = "abc"`
**Output:** `null`

### Edge Case 2: Opener Not in Lookup Table (Default Strategy)
**Input:** `opener = "73"` (not in table)
**Behavior:** Rounds to 72.5kg, looks up, returns empty array if not found

### Edge Case 3: Invalid Dynamic Settings
**Input:**
```typescript
{
  numSets: "0",
  startWeight: "100",
  finalWarmupPercent: "90"
}
```
**Behavior:** Returns 8 empty warmup sets (numSets < 2)

### Edge Case 4: Negative Weight Range (Dynamic)
**Scenario:** Start weight > final warmup target
**Behavior:** Returns 8 empty warmup sets

### Edge Case 5: Very High Opener
**Input:** `opener = "400"` (not in default table)
**Behavior:** Returns empty warmup sets for default strategy

## Validation Rules

### Default Strategy
1. Opener must be parseable as number
2. Opener should exist in warmup lookup table
3. If not found, returns empty warmup array

### Dynamic Strategy
1. `numSets` ≥ 2
2. `startWeight` > 0
3. `finalWarmupPercent` > 0 (typically 85-95%)
4. `startWeight` < `opener × finalWarmupPercent`

## Constants Used

From `constants.ts`:
```typescript
// Warmup lookup tables
export const SQUAT_WARMUPS: Record<number, number[]> = { ... };
export const BENCH_WARMUPS: Record<number, number[]> = { ... };
export const DEADLIFT_WARMUPS: Record<number, number[]> = { ... };

// Rep schemes
export const SQUAT_REP_SCHEMES: Record<number, number[]> = { ... };
export const BENCH_REP_SCHEMES: Record<number, number[]> = { ... };
export const DEADLIFT_REP_SCHEMES: Record<number, number[]> = { ... };
```

## Unit Conversion

### KG to LBS
```typescript
export const kgToLbs = (kg: number): number => {
  if (isNaN(kg) || kg <= 0) return 0;
  return roundToNearest5(kg * 2.20462);
};
```

### Rounding Rules
- **KG:** Round to nearest 2.5kg
- **LBS:** Round to nearest 5 lbs

## Next.js Migration Notes

### Implementation Approach
- Pure functions, no side effects
- Can run client-side or server-side
- Consider caching warmup tables

### Suggested Location
```
/lib/calculations/warmups.ts
/lib/constants/warmup-tables.ts
```

### Optimization Opportunities
```typescript
// Memoize warmup generation for same inputs
import { memoize } from 'lodash';

const generateWarmupsMemoized = memoize(
  generateWarmups,
  (liftType, opener, strategy, settings, unit) =>
    `${liftType}-${opener}-${strategy}-${JSON.stringify(settings)}-${unit}`
);
```

### Testing Strategy
```typescript
describe('generateWarmups', () => {
  describe('default strategy', () => {
    it('should generate warmups from lookup table', () => {
      const result = generateWarmups('squat', '150', 'default', {}, 'kg');
      expect(result).toHaveLength(8);
      expect(result[0]).toEqual({ weight: '20', reps: '5' });
    });

    it('should convert to lbs correctly', () => {
      const result = generateWarmups('squat', '150', 'default', {}, 'lbs');
      expect(result[0].weight).toBe('45');  // 20kg → 45lbs
    });
  });

  describe('dynamic strategy', () => {
    it('should generate progressive warmups', () => {
      const settings = {
        numSets: '5',
        startWeight: '20',
        finalWarmupPercent: '90'
      };
      const result = generateWarmups('bench', '100', 'dynamic', settings, 'kg');

      // Verify progressive loading
      const weights = result
        .filter(s => s.weight !== '')
        .map(s => parseFloat(s.weight));

      for (let i = 1; i < weights.length; i++) {
        expect(weights[i]).toBeGreaterThan(weights[i-1]);
      }
    });

    it('should handle invalid settings gracefully', () => {
      const settings = {
        numSets: '1',
        startWeight: '100',
        finalWarmupPercent: '90'
      };
      const result = generateWarmups('squat', '150', 'dynamic', settings, 'kg');
      expect(result.every(s => s.weight === '')).toBe(true);
    });
  });
});
```

## Performance Considerations

- Warmup table lookups are O(1) for default strategy
- Dynamic calculation is O(n) where n = numSets
- Both are very fast (<1ms typically)

## References

- **Source files:** `utils/calculator.ts` lines 112-228
- **Constants:** `constants.ts` - warmup tables and rep schemes
- **Used by:** Competition Planner, Warmup Generator
- **Related:** Triggered when opener changes or strategy changes
