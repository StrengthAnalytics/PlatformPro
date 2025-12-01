# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed .plp file download issue on Safari mobile browsers
  - Added explicit download attribute for better Safari compatibility
  - Added 100ms delay before cleanup to ensure Safari processes the download
  - Set link display to none for cleaner DOM manipulation
  - Affects both .plp plan exports and PDF exports
  - Files: `App.tsx`, `utils/exportHandler.ts`

- Fixed .plp file import restriction across all browsers
  - Changed file input accept attribute from `.plp,.json,application/json` to `*` (all files)
  - Previous implementation with MIME type was too restrictive and filtered out .plp files
  - Security maintained through content validation in `handleImportPlan()` function
  - File validation uses JSON parsing and `isPlanData()` type checking
  - Files: `App.tsx`

## [1.0.0] - 2024-12-01

### Initial Release
- Competition Meet Planner with full planning capabilities
- Workout Timer
- 1RM Calculator
- Warmup Generator
- Velocity Profile Generator
- Technique Score Calculator
- Game Day Mode for competition execution
- PDF export (desktop and mobile optimized)
- CSV export
- Plan import/export (.plp files)
- Personal bests tracking
- Records comparison (British Powerlifting IPF)
- Clerk authentication and subscription management
- Freemium architecture with upgrade paths
- PWA support for offline usage
- Dark mode support
- Responsive design for all devices

---

## Documentation Notes for Next.js Migration

When rebuilding features in Next.js, refer to:
- `/docs/features/` - Feature specifications and user stories
- `/docs/business-logic/` - Core algorithms and calculations
- `/docs/api-specs/` - Data structures and TypeScript types
- `/docs/architecture/` - Technical architecture decisions
- `/docs/decisions/` - Architecture Decision Records (ADRs)

### Key Technical Considerations for Migration
- File download/upload patterns need Safari-specific handling (see fixes above)
- .plp files use JSON format but require custom extension handling
- Client-side state management currently uses React hooks
- PDF generation uses jsPDF library
- All calculations are client-side (no backend required)
