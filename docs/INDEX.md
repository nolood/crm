# Documentation Index

Complete documentation for the Confectionery CRM system.

## Quick Links

- [Main README](../README.md) - Project overview and quick start
- [Database Schema](./architecture/database-schema.md) - Complete database reference
- [Latest Feature: DataTable Component System](./features/data-table.md)

## Structure

```
docs/
├── INDEX.md (this file)
├── architecture/         # System design and technical architecture
│   └── database-schema.md
├── features/            # Feature documentation
│   ├── data-table.md
│   └── purchase-edit-with-history.md
├── decisions/           # Architecture Decision Records (ADRs)
│   ├── 001-fix-double-expense-submission.md
│   └── 002-purchase-edit-history-architecture.md
└── plans/              # Project planning and design documents
    ├── 2026-02-13-confectionery-crm-design.md
    └── 2026-02-13-confectionery-crm-implementation.md
```

## By Topic

### Architecture & Design
- [Database Schema](./architecture/database-schema.md) - Entity relationships, tables, constraints, RLS policies
- [ADR 002: Purchase Edit History Architecture](./decisions/002-purchase-edit-history-architecture.md) - Why snapshot history, atomic RPC, graceful deletion handling

### Features
- [DataTable Component System](./features/data-table.md) - Generic reusable table with sorting, filtering, search
  - Type-safe column definitions
  - Client-side processing pipeline
  - Custom filter matching
  - Used across all 7 CRM tables
- [Purchase Edit with History](./features/purchase-edit-with-history.md) - Edit purchases with audit trail
  - User flow, components, server actions
  - Stock adjustment logic
  - History viewing

### Patterns & Best Practices
- [ADR 001: Fix Double Expense Submission](./decisions/001-fix-double-expense-submission.md) - React 19 `useFormStatus` pattern
  - Prevent duplicate submissions
  - Loading state management
  - Server Actions with form actions

### Planning
- [Project Design](./plans/2026-02-13-confectionery-crm-design.md) - Initial design document
- [Implementation Plan](./plans/2026-02-13-confectionery-crm-implementation.md) - Development roadmap

## Common Tasks

### Adding a New Feature
1. Design the feature (consider creating a plan document)
2. Make architectural decisions (create ADR if significant)
3. Implement the feature
4. Document in `features/` directory
5. Update this index and main README

### Making an Architectural Decision
1. Copy ADR template from existing ADR
2. Fill in: Context, Problem, Decision, Consequences
3. Add to `decisions/` directory
4. Link from relevant feature docs

### Updating Database Schema
1. Modify `supabase/schema.sql`
2. Update [Database Schema](./architecture/database-schema.md) documentation
3. Document reason in ADR if significant change
4. Update affected feature documentation

## Documentation Standards

### File Naming
- Features: `feature-name.md` (kebab-case)
- ADRs: `NNN-title.md` (numbered, kebab-case)
- Plans: `YYYY-MM-DD-title.md` (dated, kebab-case)

### ADR Format
```markdown
# NNN. Title
Date: YYYY-MM-DD | Status: accepted|rejected|superseded

## Context
[problem description]

## Decision
[chosen solution]

## Consequences
[positive and negative outcomes]
```

### Feature Documentation Format
```markdown
# Feature Name
Date: YYYY-MM-DD | Status: Implemented|Planned

## Overview
[brief description]

## Key Features
[bullet points]

## Architecture
[components, data flow, technical details]

## Related Documentation
[links to ADRs, schema, etc]
```

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: React 19 + shadcn/ui + Tailwind CSS
- **State**: Server Actions + revalidation (no client state management library)

## Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [React 19 Documentation](https://react.dev)

## Contributing to Docs

When adding documentation:
1. Use the appropriate directory (`architecture/`, `features/`, `decisions/`, `plans/`)
2. Follow existing format and naming conventions
3. Include code references with file paths and line numbers
4. Add cross-links to related documents
5. Update this index and main README
6. Use mermaid diagrams for visual explanations
7. Include practical examples and code snippets

## Recent Updates

- **2026-02-13**: Added DataTable component system documentation
  - Feature guide: `features/data-table.md`
  - Generic type-safe table component with sorting, filtering, search
  - Covers implementation across all 7 tables + recipes grid
  - Client-side processing pipeline with custom filter matching
- **2026-02-13**: Added Purchase Edit with History feature documentation
  - Feature guide: `features/purchase-edit-with-history.md`
  - Architecture decisions: `decisions/002-purchase-edit-history-architecture.md`
  - Database schema: `architecture/database-schema.md`
