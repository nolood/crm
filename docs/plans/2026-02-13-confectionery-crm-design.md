# Confectionery CRM — Design Document

## Overview

Simple CRM for a home-based confectionery business (chocolate-covered strawberries, etc.). Full tracking of purchases, inventory, production, orders, clients, and profit/loss.

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **Supabase** — PostgreSQL, Auth (magic link), RLS
- **shadcn/ui** + **Tailwind CSS** — adaptive UI
- **TypeScript**
- **zod** — form validation

## Users

Single user. Minimal auth via Supabase magic link email.

## Project Structure

```
src/
  app/
    (auth)/login/
    (dashboard)/
      page.tsx            — dashboard
      purchases/          — raw material purchases
      inventory/          — ingredient stock
      recipes/            — product recipes (BOM)
      production/         — production records
      orders/             — customer orders
      clients/            — client database
    layout.tsx            — sidebar layout
  components/ui/          — shadcn components
  lib/
    supabase/             — Supabase client (server/client)
    actions/              — Server Actions per entity
    types.ts
```

## Data Model

### ingredients
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | uuid (PK) | Primary key              |
| name       | text      | Ingredient name          |
| unit       | text      | Unit of measure (g, ml, pcs) |
| stock_qty  | numeric   | Current stock quantity   |
| created_at | timestamp | Creation timestamp       |

### purchases
| Column         | Type      | Description              |
|----------------|-----------|--------------------------|
| id             | uuid (PK) | Primary key              |
| ingredient_id  | uuid (FK) | → ingredients.id         |
| quantity       | numeric   | Quantity purchased       |
| price_per_unit | numeric   | Price per unit           |
| total_price    | numeric   | Total cost               |
| date           | date      | Purchase date            |
| created_at     | timestamp | Creation timestamp       |

### recipes
| Column          | Type      | Description              |
|-----------------|-----------|--------------------------|
| id              | uuid (PK) | Primary key              |
| name            | text      | Product name             |
| output_quantity | numeric   | Output quantity per batch |
| unit            | text      | Output unit              |
| created_at      | timestamp | Creation timestamp       |

### recipe_items
| Column        | Type      | Description              |
|---------------|-----------|--------------------------|
| id            | uuid (PK) | Primary key              |
| recipe_id     | uuid (FK) | → recipes.id             |
| ingredient_id | uuid (FK) | → ingredients.id         |
| quantity      | numeric   | Quantity per batch       |

### production
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | uuid (PK) | Primary key              |
| recipe_id  | uuid (FK) | → recipes.id             |
| quantity   | numeric   | Number of batches        |
| total_cost | numeric   | Calculated production cost |
| date       | date      | Production date          |
| created_at | timestamp | Creation timestamp       |

### production_items
| Column        | Type      | Description              |
|---------------|-----------|--------------------------|
| id            | uuid (PK) | Primary key              |
| production_id | uuid (FK) | → production.id          |
| ingredient_id | uuid (FK) | → ingredients.id         |
| quantity_used | numeric   | Actual quantity consumed  |

### clients
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | uuid (PK) | Primary key              |
| name       | text      | Client name              |
| phone      | text      | Phone number             |
| instagram  | text      | Instagram handle         |
| notes      | text      | Notes                    |
| created_at | timestamp | Creation timestamp       |

### orders
| Column      | Type      | Description              |
|-------------|-----------|--------------------------|
| id          | uuid (PK) | Primary key              |
| client_id   | uuid (FK) | → clients.id             |
| status      | text      | new/in_progress/ready/delivered/cancelled |
| total_price | numeric   | Total order price        |
| date        | date      | Order date               |
| created_at  | timestamp | Creation timestamp       |

### order_items
| Column    | Type      | Description              |
|-----------|-----------|--------------------------|
| id        | uuid (PK) | Primary key              |
| order_id  | uuid (FK) | → orders.id              |
| recipe_id | uuid (FK) | → recipes.id             |
| quantity  | numeric   | Quantity ordered         |
| price     | numeric   | Price for this line      |

## Business Logic

### Purchases
- Creating a purchase increases `ingredients.stock_qty`
- Both operations in a single transaction (Supabase RPC)

### Production
- User selects recipe + quantity (batches)
- System calculates required ingredients (recipe_items.quantity * batches)
- Warning if insufficient stock (non-blocking)
- On confirm: creates production + production_items, decreases stock_qty — all in transaction

### Orders
- Orders do NOT deduct from inventory (production does)
- Order = what the client wants; production = what was actually made
- Order statuses: new → in_progress → ready → delivered (or cancelled)

### Dashboard
- Expenses = sum(purchases.total_price) for period
- Revenue = sum(orders.total_price) for period (delivered orders only)
- Profit = revenue - expenses
- Period filter: week / month / custom range
- Stock overview with low-stock highlighting

## Screens

| Screen | Description |
|--------|-------------|
| Dashboard | Cards: expenses, revenue, profit. Stock table with low-stock alerts |
| Purchases | Table with date/ingredient filters. "Add purchase" form |
| Inventory | Ingredients table with current stock. Add new ingredient |
| Recipes | Recipe list. Create: name, ingredients with quantities, output |
| Production | Record production: pick recipe + qty, preview deductions, confirm |
| Orders | Orders table with status badges. Create: pick client, add items |
| Clients | Clients table. Client card with order history |

## Responsive Design

- Desktop: sidebar + content area
- Mobile: hamburger menu, full-width content, horizontal scroll on tables or card view

## Auth & Security

- Supabase Auth with magic link (email)
- RLS policies: only authenticated user sees data
- Form validation with zod on client, Server Actions return {success, error}

## Error Handling

- Client-side validation (zod) before submission
- Server Actions return structured {success, error} responses
- Toast notifications for success/error feedback
- Transaction rollback on partial failures
