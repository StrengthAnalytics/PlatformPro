# Platform Coach Documentation

This directory contains comprehensive documentation for the Platform Coach application, designed to facilitate the rebuild of features in Next.js as part of a larger coaching platform.

## Directory Structure

```
/docs
├── features/          # Feature specifications and user stories
├── architecture/      # Technical architecture documentation
├── business-logic/    # Core algorithms and calculations
├── api-specs/         # Data structures and interface definitions
├── decisions/         # Architecture Decision Records (ADRs)
└── README.md         # This file
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

## Quick Links

- [CHANGELOG.md](../CHANGELOG.md) - Version history and bug fixes
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
