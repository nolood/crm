# Documentation Index

Complete documentation for the Confectionery CRM system.

## Quick Links

- [Main README](../README.md) - Project overview and quick start
- [Database Schema](./architecture/database-schema.md) - Complete database reference
- [Latest Feature: Analytics Page](./features/analytics-page.md)

## Structure

```
docs/
├── INDEX.md (this file)
├── architecture/         # System design and technical architecture
│   └── database-schema.md
├── features/            # Feature documentation
│   ├── analytics-page.md
│   ├── dashboard-redesign.md
│   ├── data-table.md
│   ├── ingredient-unit-display.md
│   ├── order-delivery-time.md
│   ├── order-form-enhancements.md
│   ├── orders-kanban-edit.md
│   ├── purchase-edit-with-history.md
│   └── recipe-edit.md
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
- [Analytics Page](./features/analytics-page.md) - Comprehensive analytics dashboard with 6 tabbed sections
  - Financial overview with KPIs and monthly trends (bar chart)
  - Recipe profitability analysis with margin calculation
  - Client analytics with revenue rankings (bar chart)
  - Order analytics with status distribution (pie chart) and top recipes
  - Expense breakdown by category (pie chart)
  - Inventory valuation with stock value chart
  - URL-based period filtering (week, month, quarter, year, all-time)
  - Parallel data fetching via 7 server actions
  - recharts + shadcn chart wrapper for consistent styling
- [Dashboard Redesign](./features/dashboard-redesign.md) - Operational dashboard with quick actions and upcoming orders
  - Removed inventory table for faster loading
  - 4 quick action buttons for common tasks
  - 3-day upcoming orders view with status badges
  - DB-level filtering for active orders only
- [DataTable Component System](./features/data-table.md) - Generic reusable table with sorting, filtering, search
  - Type-safe column definitions
  - Client-side processing pipeline
  - Custom filter matching
  - Used across all 7 CRM tables
- [Ingredient Unit Display](./features/ingredient-unit-display.md) - Auto-display units in forms
  - Units shown in ingredient dropdowns and as input suffixes
  - Controlled Select pattern with derived unit lookup
  - Consistent across purchases, production, write-offs
- [Order Delivery Time](./features/order-delivery-time.md) - Optional delivery time for precise scheduling
  - Native HTML5 time input with clear button
  - Separate nullable `delivery_time` column for minimal migration risk
  - Unified `formatOrderDate()` helper for consistent display
  - Smart sorting: timed orders before untimed within each day
- [Order Form Enhancements](./features/order-form-enhancements.md) - Streamlined order entry UX
  - Searchable client combobox with auto-creation
  - Quick date selection buttons (today, tomorrow, day after tomorrow)
  - Recipe default price auto-fill
- [Orders Kanban View and Editing](./features/orders-kanban-edit.md) - Dual-view orders management
  - Table/Kanban toggle with shadcn Tabs
  - Drag-and-drop status changes using @dnd-kit/core
  - Edit orders from both views
  - Dual-mode OrderForm (create/edit)
- [Purchase Edit with History](./features/purchase-edit-with-history.md) - Edit purchases with audit trail
  - User flow, components, server actions
  - Stock adjustment logic
  - History viewing
- [Recipe Edit](./features/recipe-edit.md) - Edit recipes from grid view
  - Dual-mode RecipeForm (create/edit)
  - Delete-and-reinsert pattern for recipe_items
  - Controlled dialog with useEffect population
  - Key prop for remount on recipe change

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

- **2026-02-13**: Added Order Delivery Time feature documentation
  - Feature guide: `features/order-delivery-time.md`
  - Optional delivery time (HH:mm) for orders — nullable `delivery_time text` column
  - Native HTML5 `<input type="time">` with clear button
  - New utility: `formatOrderDate()` in `src/lib/utils.ts` for consistent date+time display
  - Dashboard sorts timed orders before untimed within each day
  - Display across all views: dashboard upcoming orders, orders table, kanban cards
- **2026-02-13**: Added Analytics Page feature documentation
  - Feature guide: `features/analytics-page.md`
  - Comprehensive analytics with 6 tabbed sections: Финансы, Рентабельность, Клиенты, Заказы, Расходы, Склад
  - URL-based period filtering (week, month, quarter, year, all-time)
  - 7 server actions in `src/lib/actions/analytics.ts`: financial overview, recipe profitability, client analytics, order analytics, expense breakdown, inventory analytics, production summary
  - 10+ new analytics types in `src/lib/types.ts`
  - 11 new component files in `src/app/(dashboard)/analytics/`
  - recharts + shadcn chart wrapper for visualizations (bar charts, pie charts)
  - Parallel data fetching via `Promise.all()` for optimal performance
  - JS-side aggregation (acceptable for single-user app)
  - Added `revalidatePath('/analytics')` to 5 mutation actions (orders, purchases, expenses, production, write-offs)
- **2026-02-13**: Added Dashboard Redesign feature documentation
  - Feature guide: `features/dashboard-redesign.md`
  - Removed inventory table from dashboard for faster loading
  - Added 4 quick action buttons (new order, purchase, expense, write-off)
  - Added 3-day upcoming orders section with status badges
  - New server action: `getUpcomingOrders()` with DB-level filtering
  - New type: `UpcomingOrder` for minimal dashboard data
  - New constant: `ORDER_STATUS_BADGE_VARIANT` for status styling
- **2026-02-13**: Added Orders Kanban View and Editing feature documentation
  - Feature guide: `features/orders-kanban-edit.md`
  - Dual-view toggle (Table/Kanban) with shadcn Tabs
  - Drag-and-drop status changes using @dnd-kit/core (React 19 compatible)
  - Edit orders from both table and kanban views
  - Dual-mode OrderForm component (create/edit)
  - New server actions: updateOrder, enhanced updateOrderStatus
  - Shared ORDER_STATUSES constants in `src/lib/constants.ts`
- **2026-02-13**: Added Order Form Enhancements feature documentation
  - Feature guide: `features/order-form-enhancements.md`
  - Searchable client combobox with auto-creation workflow
  - Quick date buttons for common dates (today/tomorrow/day-after-tomorrow)
  - Recipe default price auto-fill with manual override
  - Database schema change: nullable `price` column on recipes table
- **2026-02-13**: Added Ingredient Unit Display pattern documentation
  - Feature guide: `features/ingredient-unit-display.md`
  - Controlled Select pattern for auto-displaying units in forms
  - Unit shown in ingredient dropdowns and as quantity input suffix
  - Implemented in write-offs, production, and purchases forms
- **2026-02-13**: Added DataTable component system documentation
  - Feature guide: `features/data-table.md`
  - Generic type-safe table component with sorting, filtering, search
  - Covers implementation across all 7 tables + recipes grid
  - Client-side processing pipeline with custom filter matching
- **2026-02-13**: Added Purchase Edit with History feature documentation
  - Feature guide: `features/purchase-edit-with-history.md`
  - Architecture decisions: `decisions/002-purchase-edit-history-architecture.md`
  - Database schema: `architecture/database-schema.md`
