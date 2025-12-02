# Business Logic: Attempt Calculations

## Purpose
Calculates the three competition attempts (opener, second, third) based on either:
- Known opener → calculate second and third
- Known third attempt → calculate opener and second

Uses configurable strategies: aggressive, stepped, or conservative.

## Algorithm Overview
1. Parse input (either attempt 1 or attempt 3)
2. Apply strategy-specific percentages to calculate missing attempts
3. Enforce powerlifting rules (increasing attempts, jump size constraints)
4. Round to loadable weights (nearest 2.5kg)

## Implementation

**File:** `utils/calculator.ts`
**Function:** `calculateAttempts(liftType, attempts, strategy)`

```typescript
export const calculateAttempts = (
  liftType: LiftType,
  attempts: Attempt,
  strategy: AttemptStrategy
): Attempt | null
```

## Inputs

```typescript
interface Inputs {
  liftType: 'squat' | 'bench' | 'deadlift';
  attempts: {
    '1': string;  // Opener (may be empty)
    '2': string;  // Second (may be empty)
    '3': string;  // Third (may be empty)
  };
  strategy: 'aggressive' | 'stepped' | 'conservative';
}
```

## Outputs

```typescript
interface Outputs {
  // Returns null if no valid input
  // Returns Attempt object with all three attempts calculated
  '1': string;  // Opener (kg, rounded to 2.5)
  '2': string;  // Second attempt (kg, rounded to 2.5)
  '3': string;  // Third attempt (kg, rounded to 2.5)
}
```

## Strategy Percentages

### Aggressive Strategy
**Squat:**
- From opener: 2nd = 102.5%, 3rd = 105%
- From third: 1st = 95.24%, 2nd = 97.62%

**Bench Press:**
- From opener: 2nd = 105%, 3rd = 110%
- From third: 1st = 90.91%, 2nd = 95.45%

**Deadlift:**
- From opener: 2nd = 102.5%, 3rd = 105%
- From third: 1st = 95.24%, 2nd = 97.62%

### Stepped Strategy
Equal jumps between all three attempts.

**Logic:**
- From third: Calculate 2nd at percentage, then make 1st with equal jump backward
- From opener: Calculate 2nd at percentage, then make 3rd with equal jump forward

**Percentages:**
- Squat: 2nd from 3rd = 96.67%, 2nd from opener = 103.33%
- Bench: 2nd from 3rd = 93.33%, 2nd from opener = 106.67%
- Deadlift: 2nd from 3rd = 96.67%, 2nd from opener = 103.33%

### Conservative Strategy
**Squat:**
- From opener: 2nd = 105%, 3rd = 110%
- From third: 1st = 90.91%, 2nd = 95.45%

**Bench Press:**
- From opener: 2nd = 107.5%, 3rd = 115%
- From third: 1st = 86.96%, 2nd = 93.48%

**Deadlift:**
- From opener: 2nd = 105%, 3rd = 110%
- From third: 1st = 90.91%, 2nd = 95.45%

## Powerlifting Rules Enforced

### Rule 1: Strictly Increasing Attempts
Attempts must be strictly increasing (no duplicates).

```typescript
if (a2 <= a1) a2 = a1 + 2.5;
if (a3 <= a2) a3 = a2 + 2.5;
```

### Rule 2: Jump Size Constraint
First jump (1→2) must be ≥ second jump (2→3).

```typescript
const jump1 = a2 - a1;
const jump2 = a3 - a2;
if (jump1 < jump2) {
  // Adjust to make jumps equal or decreasing
}
```

**Rationale:** In powerlifting, you typically want larger jumps early when fresh, smaller jumps as fatigue sets in.

## Examples

### Example 1: Aggressive Strategy from Opener (Squat)

**Input:**
```typescript
{
  liftType: 'squat',
  attempts: { '1': '150', '2': '', '3': '' },
  strategy: 'aggressive'
}
```

**Calculation:**
1. Opener = 150kg
2. Second = 150 × 1.025 = 153.75 → 155kg (rounded)
3. Third = 150 × 1.05 = 157.5 → 157.5kg
4. Check rules:
   - Jump 1: 155 - 150 = 5kg
   - Jump 2: 157.5 - 155 = 2.5kg
   - ✓ Jump 1 ≥ Jump 2

**Output:**
```typescript
{
  '1': '150',
  '2': '155',
  '3': '157.5'
}
```

### Example 2: Conservative Strategy from Third (Deadlift)

**Input:**
```typescript
{
  liftType: 'deadlift',
  attempts: { '1': '', '2': '', '3': '220' },
  strategy: 'conservative'
}
```

**Calculation:**
1. Third = 220kg
2. Opener = 220 × 0.9091 = 200kg (rounded)
3. Second = 220 × 0.9545 = 210kg (rounded)
4. Check rules:
   - Jump 1: 210 - 200 = 10kg
   - Jump 2: 220 - 210 = 10kg
   - ✓ Jump 1 ≥ Jump 2

**Output:**
```typescript
{
  '1': '200',
  '2': '210',
  '3': '220'
}
```

### Example 3: Stepped Strategy from Opener (Bench)

**Input:**
```typescript
{
  liftType: 'bench',
  attempts: { '1': '100', '2': '', '3': '' },
  strategy: 'stepped'
}
```

**Calculation:**
1. Opener = 100kg
2. Second = 100 × 1.0667 = 106.67 → 107.5kg (rounded)
3. Jump = 107.5 - 100 = 7.5kg
4. Third = 107.5 + 7.5 = 115kg

**Output:**
```typescript
{
  '1': '100',
  '2': '107.5',
  '3': '115'
}
```

## Edge Cases

### Edge Case 1: Both Opener and Third Provided
**Behavior:** Calculation proceeds using opener as anchor, ignoring third.

### Edge Case 2: Neither Provided
**Behavior:** Returns `null` (no calculation possible)

### Edge Case 3: Invalid Numbers
**Behavior:** Returns `null`

### Edge Case 4: Rule Violations Requiring Adjustment

**Scenario:** Opener = 100kg, Strategy percentages produce decreasing jumps

**Before adjustment:**
- 1st: 100kg
- 2nd: 105kg (jump = 5kg)
- 3rd: 107.5kg (jump = 2.5kg)

**After rule enforcement:**
- Jump 1 (5kg) ≥ Jump 2 (2.5kg) ✓
- No adjustment needed

## Validation Rules

1. **Input validation:**
   - At least one attempt (1 or 3) must be provided
   - Values must be parseable as numbers
   - Values should be > 0

2. **Output validation:**
   - All attempts are strictly increasing
   - Jump 1 ≥ Jump 2
   - All values rounded to nearest 2.5kg

## Constants Used

From `constants.ts`:
```typescript
export const ATTEMPT_STRATEGIES = {
  aggressive: {
    squat: {
      fromOpener: { second: 1.025, third: 1.05 },
      fromThird: { first: 0.9524, second: 0.9762 }
    },
    bench: {
      fromOpener: { second: 1.05, third: 1.10 },
      fromThird: { first: 0.9091, second: 0.9545 }
    },
    deadlift: {
      fromOpener: { second: 1.025, third: 1.05 },
      fromThird: { first: 0.9524, second: 0.9762 }
    }
  },
  // ... similar for stepped and conservative
};
```

## Next.js Migration Notes

### Implementation Approach
- Pure function, can run client-side or server-side
- No state, no side effects
- Deterministic output for given input

### Suggested Location
```
/lib/calculations/attempts.ts
```

### Zod Schema for Validation
```typescript
import { z } from 'zod';

const AttemptInputSchema = z.object({
  liftType: z.enum(['squat', 'bench', 'deadlift']),
  attempts: z.object({
    '1': z.string(),
    '2': z.string(),
    '3': z.string()
  }),
  strategy: z.enum(['aggressive', 'stepped', 'conservative'])
});
```

### Testing Strategy
```typescript
describe('calculateAttempts', () => {
  it('should calculate from opener with aggressive strategy', () => {
    const result = calculateAttempts('squat',
      { '1': '150', '2': '', '3': '' },
      'aggressive'
    );
    expect(result).toEqual({
      '1': '150',
      '2': '155',
      '3': '157.5'
    });
  });

  it('should enforce jump rules', () => {
    // Test that jump1 >= jump2 is enforced
  });

  it('should return null for invalid input', () => {
    const result = calculateAttempts('squat',
      { '1': '', '2': '', '3': '' },
      'aggressive'
    );
    expect(result).toBeNull();
  });
});
```

## References

- **Source file:** `utils/calculator.ts` lines 30-109
- **Constants:** `constants.ts` - `ATTEMPT_STRATEGIES`
- **Used by:** Competition Planner, Lite Mode
- **Related:** Warmup generation uses opener from this calculation
