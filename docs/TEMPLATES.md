# Documentation Templates

Use these templates when documenting new features or business logic.

## Feature Documentation Template

Create a new file in `/docs/features/` using this structure:

```markdown
# Feature: [Feature Name]

## Overview
Brief 1-2 sentence description of what this feature does.

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## UI/UX Details
### Layout
Description of how the feature appears in the UI

### User Flow
1. User does X
2. System responds with Y
3. User sees Z

### Validation & Error States
- **Validation Rule 1**: Error message shown
- **Validation Rule 2**: Error message shown

## Technical Implementation

### Current Implementation (React)
**Files:**
- `path/to/component.tsx` - Component description
- `path/to/util.ts` - Utility description

**Key Functions:**
- `functionName()` - Purpose and behavior

**State Management:**
- State variables used
- How state is updated

**Props/Inputs:**
```typescript
interface Props {
  prop1: string;
  prop2: number;
}
```

### Data Structures
```typescript
interface DataStructure {
  field1: string;
  field2: number;
}
```

## Edge Cases & Special Scenarios
1. **Edge Case 1**: Description
   - Expected behavior: ...
   - Example: ...

2. **Edge Case 2**: Description
   - Expected behavior: ...
   - Example: ...

## Test Scenarios
### Happy Path
1. Given [initial state]
2. When [action]
3. Then [expected result]

### Error Cases
1. Given [error condition]
2. When [action]
3. Then [error handling]

## Dependencies
- **Features**: Other features this depends on
- **External Libraries**: Third-party dependencies
- **APIs**: External services used

## Next.js Migration Notes

### Approach
- Use Server Component / Client Component?
- API Routes needed?
- Special considerations

### Migration Checklist
- [ ] Extract types
- [ ] Implement server-side logic
- [ ] Implement client components
- [ ] Add validation
- [ ] Add tests
- [ ] Update documentation

### Code Hints for AI Agent
```typescript
// Example pattern to follow
// Key implementation details
```

## Screenshots / Examples
[Add screenshots or examples if helpful]

## Related Documentation
- Link to business logic docs
- Link to API specs
- Link to ADRs
```

---

## Business Logic Documentation Template

Create a new file in `/docs/business-logic/` using this structure:

```markdown
# Business Logic: [Algorithm/Calculation Name]

## Purpose
What problem does this solve? What does it calculate or process?

## Algorithm Overview
High-level description of the approach

## Inputs
```typescript
interface Inputs {
  input1: string;  // Description
  input2: number;  // Description
}
```

## Outputs
```typescript
interface Outputs {
  output1: string;  // Description
  output2: number;  // Description
}
```

## Mathematical Formula / Logic
```
Mathematical notation or pseudocode:
result = (input1 * factor) + offset
where factor = ...
```

## Implementation Details

### Current Implementation (React)
**File:** `path/to/file.ts`
**Function:** `functionName()`

```typescript
// Current implementation
export const functionName = (params: Inputs): Outputs => {
  // Implementation
};
```

### Step-by-Step Logic
1. **Step 1**: Description
   ```typescript
   // Code example
   ```

2. **Step 2**: Description
   ```typescript
   // Code example
   ```

## Edge Cases & Boundary Conditions

| Condition | Input Example | Expected Output | Notes |
|-----------|--------------|-----------------|-------|
| Zero value | `x = 0` | `result = 0` | Special handling |
| Negative value | `x = -5` | `error` | Invalid input |
| Maximum value | `x = 1000` | `result = ...` | Capped at max |

## Examples

### Example 1: Typical Use Case
**Input:**
```typescript
{
  input1: "value",
  input2: 100
}
```

**Output:**
```typescript
{
  output1: "result",
  output2: 150
}
```

**Explanation:** Step-by-step walkthrough

### Example 2: Edge Case
**Input:**
```typescript
{
  input1: "",
  input2: 0
}
```

**Output:**
```typescript
{
  output1: "default",
  output2: 0
}
```

**Explanation:** How edge case is handled

## Validation Rules
1. **Rule 1**: Description
   - Valid: example
   - Invalid: example

2. **Rule 2**: Description
   - Valid: example
   - Invalid: example

## Constants & Configuration
```typescript
const CONSTANT_1 = 100;  // Description
const CONSTANT_2 = "value";  // Description

const CONFIG = {
  option1: true,
  option2: "setting"
};
```

## Dependencies
- **External Libraries**: None / List them
- **Other Business Logic**: References to other algorithms
- **Data Sources**: Where data comes from

## Testing Strategy
### Unit Tests
```typescript
describe('functionName', () => {
  it('should handle typical input', () => {
    expect(functionName({...})).toEqual({...});
  });

  it('should handle edge case', () => {
    expect(functionName({...})).toEqual({...});
  });
});
```

## Next.js Migration Notes

### Implementation Approach
- Server-side or client-side?
- Any Next.js-specific optimizations?

### Code Template for AI Agent
```typescript
// Next.js implementation pattern
// Key considerations
```

### Validation in Next.js
```typescript
// Zod schema or other validation approach
```

## References
- External documentation
- Research papers
- Standards used

## Change History
- **2024-12-01**: Initial documentation
- **Date**: Change description
```

---

## Quick Reference: When to Use Each Template

- **Feature Template**: For user-facing functionality (Competition Planner, Game Day Mode, etc.)
- **Business Logic Template**: For calculations, algorithms, data processing (warmup generation, attempt calculations, scoring, etc.)
- **ADR Template**: For architectural decisions (see `/docs/decisions/` for examples)
