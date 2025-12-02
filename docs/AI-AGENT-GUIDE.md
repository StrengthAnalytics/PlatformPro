# AI Agent Guide for Next.js Migration

This guide is specifically for Claude Code Agent (or other AI agents) to use when rebuilding Platform Coach features in Next.js.

## How to Use This Documentation

### Step 1: Understand the Feature
1. Read the feature documentation in `/docs/features/[feature-name].md`
2. Identify user stories and acceptance criteria
3. Note edge cases and validation rules

### Step 2: Review Business Logic
1. Check `/docs/business-logic/` for algorithms used by the feature
2. Review input/output types
3. Understand edge cases and validation
4. Study example calculations

### Step 3: Check Type Definitions
1. Read `/docs/api-specs/` for data structures
2. Understand relationships between types
3. Note which types are shared across features

### Step 4: Review Architectural Decisions
1. Check `/docs/decisions/` for relevant ADRs
2. Understand why certain approaches were chosen
3. Note any platform-specific handling (like Safari fixes)

### Step 5: Plan Next.js Implementation
1. Decide Server Component vs Client Component
2. Identify API Routes needed
3. Plan state management approach
4. Consider Next.js-specific optimizations

## Key Principles for Migration

### 1. Preserve Business Logic
- Business logic should remain identical
- Copy algorithms directly, don't rewrite them
- Maintain the same validation rules
- Keep the same edge case handling

### 2. Enhance with Next.js Features
- Use Server Components where possible for better performance
- Implement API Routes for backend operations
- Optimize with Server-Side Rendering where beneficial
- Use Next.js caching strategies

### 3. Improve User Experience
- Maintain all current functionality
- Add loading states with Suspense
- Implement optimistic updates where appropriate
- Consider progressive enhancement

### 4. Type Safety
- Port all TypeScript types
- Use Zod for runtime validation
- Maintain strict type checking
- Document type relationships

## Migration Checklist for Each Feature

Use this checklist when implementing a feature:

### Planning Phase
- [ ] Read feature documentation completely
- [ ] Review all business logic used by the feature
- [ ] Identify all data structures/types
- [ ] List all dependencies (features, libraries)
- [ ] Note any special handling (browser-specific, etc.)
- [ ] Decide on Server/Client component strategy

### Implementation Phase
- [ ] Create necessary types in appropriate files
- [ ] Implement business logic (copy from current implementation)
- [ ] Create Server Components for static parts
- [ ] Create Client Components for interactive parts
- [ ] Implement API Routes if needed
- [ ] Add validation (server and client)
- [ ] Implement error handling
- [ ] Add loading states

### Testing Phase
- [ ] Test all user stories
- [ ] Test all edge cases
- [ ] Verify validation rules
- [ ] Test error scenarios
- [ ] Check browser compatibility (especially Safari)
- [ ] Test mobile responsiveness

### Documentation Phase
- [ ] Update feature documentation if behavior changed
- [ ] Document any new architectural decisions
- [ ] Note any deviations from original
- [ ] Update CHANGELOG.md

## Common Patterns

### Pattern 1: Client-Side Calculation
When a feature does client-side calculations (like warmup generation):

```typescript
// app/components/WarmupGenerator.tsx
'use client';

import { generateWarmups } from '@/lib/calculations/warmups';

export function WarmupGenerator() {
  const [result, setResult] = useState<WarmupSet[]>([]);

  const handleGenerate = (opener: number) => {
    // Business logic from docs/business-logic/warmup-generation.md
    const warmups = generateWarmups(opener, strategy, settings, unit);
    setResult(warmups);
  };

  return (/* UI */);
}
```

### Pattern 2: Form with Server Action
When a feature saves data:

```typescript
// app/actions/save-plan.ts
'use server';

import { z } from 'zod';
import { PlanSchema } from '@/lib/schemas';

export async function savePlan(formData: FormData) {
  const validated = PlanSchema.parse({
    // validation from docs/api-specs/plan-data.md
  });

  // Save to database
  await db.plan.create({ data: validated });

  return { success: true };
}
```

### Pattern 3: File Download (Safari-Compatible)
When implementing file downloads:

```typescript
// Based on ADR 001: Safari file download handling
'use client';

export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.setAttribute('download', fileName); // Safari compatibility
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Delay cleanup for Safari
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
```

### Pattern 4: File Upload with Validation
When implementing file uploads:

```typescript
// Based on ADR 002: .plp file upload
'use client';

export function FileUpload() {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure (from docs/api-specs/)
    if (!isPlanData(data)) {
      throw new Error('Invalid file format');
    }

    // Process valid data
  };

  return (
    <input
      type="file"
      accept="*" // Accept all, validate content
      onChange={handleUpload}
    />
  );
}
```

## Important Considerations

### Browser Compatibility
- **Safari**: Requires special handling for downloads (see ADR 001)
- **Mobile Safari**: Test file uploads/downloads thoroughly
- **File APIs**: Use FileReader API for client-side file processing

### State Management
- Use React Context for shared state
- Consider Zustand for complex state
- Server state with TanStack Query
- Form state with React Hook Form

### Performance
- Use Server Components by default
- Client Components only when needed (interactivity, browser APIs)
- Implement proper loading states
- Use Suspense boundaries

### Security
- Validate all inputs (client AND server)
- Use Zod schemas for runtime validation
- Sanitize user-generated content
- Don't trust client-side validation alone

### Type Safety
- Import types from `/lib/types/`
- Use Zod for schema validation
- Avoid `any` types
- Use strict TypeScript config

## File Organization for Next.js

```
/app
  /components       # React components
  /actions          # Server actions
  /(routes)         # Route handlers

/lib
  /calculations     # Business logic (from docs/business-logic/)
  /types           # TypeScript types (from docs/api-specs/)
  /schemas         # Zod schemas
  /utils           # Utility functions
  /constants       # Constants and config
```

## When You Get Stuck

1. **Re-read the documentation**: Feature docs, business logic, types
2. **Check ADRs**: See if there's a decision record about this
3. **Look at examples**: Review example code in the docs
4. **Check current implementation**: The React app files are the source of truth
5. **Ask for clarification**: Request more documentation if needed

## Validation Strategy

For every feature, implement validation at multiple levels:

1. **TypeScript types**: Compile-time type safety
2. **Zod schemas**: Runtime validation
3. **Client-side validation**: Immediate user feedback
4. **Server-side validation**: Security and data integrity

Example:
```typescript
// lib/schemas/plan.ts
import { z } from 'zod';

export const PlanSchema = z.object({
  details: z.object({
    lifterName: z.string().min(1, 'Name required'),
    weightClass: z.string(),
    // ... from docs/api-specs/plan-data.md
  }),
  equipment: z.object({
    // ... from docs/api-specs/equipment-settings.md
  }),
  lifts: z.object({
    // ... from docs/api-specs/lift-state.md
  })
});

export type Plan = z.infer<typeof PlanSchema>;
```

## Testing Approach

1. **Unit tests**: For business logic functions
2. **Integration tests**: For API routes
3. **E2E tests**: For critical user flows
4. **Visual tests**: For UI components

Focus testing on:
- All edge cases documented in feature specs
- All validation rules
- Error handling
- Browser-specific issues (Safari)

## Remember

- **Preserve functionality**: Don't change behavior unless improving it
- **Maintain types**: Port TypeScript types exactly
- **Copy business logic**: Don't rewrite algorithms
- **Test thoroughly**: Especially edge cases and Safari compatibility
- **Document changes**: Update docs if you deviate from original
- **Ask questions**: Request more documentation if anything is unclear

## Quick Start Example

When asked to implement "Competition Planner":

1. Read `/docs/features/competition-planner.md`
2. Review `/docs/business-logic/attempt-calculations.md`
3. Review `/docs/business-logic/warmup-generation.md`
4. Check `/docs/api-specs/app-state.md` for data structures
5. Review `/docs/decisions/` for relevant ADRs
6. Follow migration checklist above
7. Implement using Next.js patterns
8. Test all scenarios from docs
9. Update CHANGELOG.md

This systematic approach ensures complete, correct implementation.
