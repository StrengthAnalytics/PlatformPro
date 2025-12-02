# Platform Coach Documentation

This directory contains comprehensive documentation for the Platform Coach application, designed to facilitate the rebuild of features in Next.js as part of a larger coaching platform.

## Directory Structure

```
/docs
├── features/                    # Feature specifications and user stories
│   └── competition-planner.md  # Core planning feature
├── architecture/                # Technical architecture documentation
├── business-logic/              # Core algorithms and calculations
│   ├── attempt-calculations.md # Attempt strategy algorithms
│   └── warmup-generation.md    # Warmup progression logic
├── api-specs/                   # Data structures and interface definitions
│   └── types-overview.md       # Complete TypeScript type system
├── decisions/                   # Architecture Decision Records (ADRs)
│   ├── 001-safari-file-download-handling.md
│   └── 002-plp-file-upload-accept-attribute.md
├── AI-AGENT-GUIDE.md           # Guide for AI-assisted migration
├── TEMPLATES.md                # Documentation templates
└── README.md                   # This file
```

## Documentation Philosophy

This documentation is designed to be:
1. **Living** - Updated as features are added or modified
2. **Framework-agnostic** - Focuses on business logic and requirements, not implementation details
3. **Migration-friendly** - Structured to support rebuilding in Next.js
4. **Comprehensive** - Captures both "what" and "why"

## How to Use This Documentation

### For Current Development
- Update relevant docs when making changes
- Add new features to `/features` directory
- Document architectural decisions in `/decisions`

### For Next.js Migration
1. Start with `/features` to understand user-facing functionality
2. Review `/business-logic` for core algorithms to port
3. Check `/api-specs` for data structures and types
4. Reference `/architecture` for system design patterns
5. Read `/decisions` for context on technical choices

## Documentation Standards

### Feature Documentation
Each feature should document:
- **Purpose** - What problem does it solve?
- **User Stories** - Who uses it and how?
- **Acceptance Criteria** - What defines "done"?
- **Edge Cases** - What special scenarios exist?
- **Dependencies** - What other features does it rely on?
- **Technical Notes** - Implementation details worth preserving

### Business Logic Documentation
Core algorithms should include:
- **Formula/Algorithm** - Mathematical or logical definition
- **Inputs/Outputs** - What goes in, what comes out
- **Edge Cases** - Boundary conditions and special cases
- **Examples** - Sample calculations
- **References** - Any external sources or standards

### Architecture Decision Records (ADRs)
Document key decisions using this format:
- **Title** - Short descriptive name
- **Status** - Proposed, Accepted, Deprecated, Superseded
- **Context** - What problem are we solving?
- **Decision** - What did we decide?
- **Consequences** - What are the trade-offs?
- **Date** - When was this decided?

## Current Documentation Status

### ✅ Completed
- **AI Agent Guide** - Complete guide for Claude Code during migration
- **Documentation Templates** - Templates for features and business logic
- **Type System** - Full TypeScript type documentation
- **ADRs** - Safari download and file upload decisions
- **Core Business Logic:**
  - Attempt calculations with all three strategies
  - Warmup generation (default and dynamic)
- **Major Features:**
  - Competition Planner (complete specification)

### 📝 To Be Documented
- **Features:**
  - Game Day Mode
  - 1RM Calculator
  - Warmup Generator (standalone)
  - Velocity Profile Generator
  - Technique Score Calculator
  - Workout Timer
- **Business Logic:**
  - Plate breakdown calculations
  - Scoring formulas (IPF GL, Wilks, DOTS)
  - Record lookup and comparison
  - Unit conversions
- **Architecture:**
  - Component structure
  - State management patterns
  - PDF generation architecture
  - Authentication flow (Clerk)

## Quick Links

### Documentation Files
- [AI Agent Guide](AI-AGENT-GUIDE.md) - **START HERE** for Next.js migration
- [Templates](TEMPLATES.md) - Use these when adding documentation
- [CHANGELOG.md](../CHANGELOG.md) - Version history and bug fixes

### Feature Specifications
- [Competition Planner](features/competition-planner.md) - Core planning feature

### Business Logic
- [Attempt Calculations](business-logic/attempt-calculations.md) - How attempts are calculated
- [Warmup Generation](business-logic/warmup-generation.md) - Warmup progression algorithms

### Technical References
- [Type System Overview](api-specs/types-overview.md) - All TypeScript types
- [ADR 001: Safari Downloads](decisions/001-safari-file-download-handling.md)
- [ADR 002: File Upload](decisions/002-plp-file-upload-accept-attribute.md)

### Project Files
- [README.md](../README.md) - Main project README
- [USER_GUIDE.md](../USER_GUIDE.md) - End-user documentation

## Contributing to Documentation

When making code changes:
1. Update CHANGELOG.md with user-facing changes
2. Update relevant feature documentation if behavior changes
3. Add new features to `/features` directory
4. Document architectural decisions in `/decisions`
5. Update business logic docs if calculations change

## Next.js Migration Checklist

Use this checklist when porting features:
- [ ] Read feature specification
- [ ] Review business logic documentation
- [ ] Check data structures in api-specs
- [ ] Review architectural decisions
- [ ] Identify Next.js-specific optimizations (SSR, API routes, etc.)
- [ ] Port TypeScript types
- [ ] Implement server-side logic (if needed)
- [ ] Implement client-side components
- [ ] Add tests
- [ ] Update documentation with any changes
