# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Confectionery CRM — a single-user business management app for a home-based confectionery (chocolate-covered strawberries, etc.). Tracks purchases, inventory, recipes, production, orders, clients, expenses, write-offs, and profit/loss. UI is in Russian.

## Commands

- `npm run build` — build for production (also serves as type-check)
- `npm run lint` — run ESLint
- `npm run dev` — start dev server (do NOT run unless explicitly asked)

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **React 19**, **TypeScript 5** (strict mode)
- **Supabase** — PostgreSQL with RLS, Auth (magic link OTP)
- **shadcn/ui** (new-york style) + **Tailwind CSS v4** + **Radix UI**
- **zod** for validation, **react-hook-form** for forms
- **sonner** for toast notifications
- **date-fns** for date utilities
- Path alias: `@/*` → `./src/*`

## Architecture

### Route Groups

- `src/app/(dashboard)/` — all authenticated pages, wrapped in sidebar layout
- `src/app/login/` — magic link login page
- `src/app/auth/callback/` — Supabase auth callback handler

### Data Flow Pattern

All data mutations follow a consistent pattern:
1. **Server Actions** in `src/lib/actions/<entity>.ts` — marked `'use server'`, each file exports `get*`, `create*`, `delete*`, and sometimes `update*` functions
2. Actions create a Supabase server client, check auth via `supabase.auth.getUser()`, perform DB operations, and return `ActionResult` (`{ success: boolean, error?: string }`)
3. After mutations, actions call `revalidatePath()` for affected routes
4. Dashboard page (`src/app/(dashboard)/page.tsx`) is a Server Component that fetches data directly

### Supabase Integration

- **Server client**: `src/lib/supabase/server.ts` — uses cookies, for Server Components and Server Actions
- **Browser client**: `src/lib/supabase/client.ts` — for client components (login page)
- **Middleware**: `src/lib/supabase/middleware.ts` — refreshes session, redirects unauthenticated users to `/login`
- **RPC functions**: `create_purchase`, `create_production`, `create_write_off`, and `delete_write_off` are PostgreSQL functions for transactional operations (stock adjustments)
- **Schema**: `supabase/schema.sql` — full DDL with RLS policies
- **Seed data**: `supabase/seed.sql`
- Env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Model (key relationships)

- `ingredients` ← `purchases` (purchase increases stock_qty)
- `ingredients` ← `write_offs` (write-off deducts stock_qty and calculates estimated cost from latest purchase price)
- `recipes` → `recipe_items` → `ingredients` (bill of materials)
- `production` → `production_items` → `ingredients` (deducts stock_qty)
- `orders` → `order_items` → `recipes`, `orders` → `clients`
- `expenses` — standalone (advertising, delivery, other costs)
- All tables have `user_id` with RLS policies for row-level isolation
- Orders do NOT deduct inventory; only production and write-offs do

### Page Structure

Each dashboard section (`/orders`, `/inventory`, `/clients`, `/write-offs`, etc.) follows the same pattern:
- `page.tsx` — Server Component, fetches data and renders table + form dialog
- `*-form.tsx` — Client Component (`'use client'`), dialog form for creating entities
- Some have additional client components (e.g., `order-status.tsx` for status dropdown)

### UI Components

- `src/components/ui/` — shadcn/ui components (do not manually edit, use `npx shadcn@latest add <component>`)
- `src/components/app-sidebar.tsx` — navigation sidebar with menu items
- `src/components/logout-button.tsx` — auth logout

### Types

All entity types are defined in `src/lib/types.ts` — manually written (not auto-generated from Supabase).
