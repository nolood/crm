# 002. Purchase Edit History Architecture

Date: 2026-02-13 | Status: accepted

## Context

The confectionery CRM needs an audit trail for purchase modifications to support:
- Financial compliance and auditing requirements
- Debugging stock discrepancies (when ingredient amounts change)
- Understanding pricing trends over time
- Accountability for data modifications

Users need to be able to edit existing purchase records when mistakes are made or conditions change (supplier corrections, price adjustments, amount fixes), but these changes must be tracked for accountability.

## Problem

Implementing purchase editing raises several architectural questions:

1. **History granularity**: Track field-level changes vs. full snapshots?
2. **Stock consistency**: How to atomically update ingredient stock when amounts change?
3. **Deleted references**: How to display history when ingredient is deleted?
4. **Transaction safety**: Ensure history + stock + purchase update happen atomically
5. **UI pattern**: Where to place edit/history actions in the purchases interface?

## Decision

### 1. Full Snapshot History (Not Field-Level Changelog)

**Choice**: Save entire old record to `purchase_history` table on every edit

**Rationale**:
- Simpler schema: One row per edit, all old_* columns populated
- Simpler queries: No need to reconstruct state by replaying deltas
- Easier to display: Show complete snapshots without computation
- Performance: Purchases edited infrequently (write-heavy optimization not needed)

**Alternative considered**: Event sourcing with field-level deltas
- **Rejected because**: Adds complexity for minimal benefit in this use case
- Would require: Delta calculation, state reconstruction logic, more complex UI

**Implementation**:
```sql
CREATE TABLE purchase_history (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  old_ingredient_id BIGINT,        -- All old values
  old_supplier TEXT,
  old_amount_kg DECIMAL(10,2),
  old_price_per_kg DECIMAL(10,2),
  old_total_cost DECIMAL(10,2),
  old_purchase_date DATE,
  old_notes TEXT,
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Atomic Stock Adjustment via RPC

**Choice**: Implement `update_purchase()` as a Postgres function with SECURITY DEFINER

**Rationale**:
- Guarantees atomicity: All operations in single transaction
- Centralized logic: Stock adjustment math in one place (not scattered across app)
- Security: Runs with elevated privileges to update multiple tables
- Performance: Reduces round-trips (one RPC call vs. multiple queries)

**Transaction flow**:
```sql
BEGIN;
  -- 1. Save snapshot
  INSERT INTO purchase_history (...)
  SELECT * FROM purchases WHERE id = p_id;

  -- 2. Reverse old stock
  UPDATE ingredients
  SET stock = stock - (SELECT amount_kg FROM purchases WHERE id = p_id)
  WHERE id = (SELECT ingredient_id FROM purchases WHERE id = p_id);

  -- 3. Apply new stock
  UPDATE ingredients
  SET stock = stock + p_amount_kg
  WHERE id = p_ingredient_id;

  -- 4. Update purchase
  UPDATE purchases SET ... WHERE id = p_id;
COMMIT;
```

**Alternative considered**: Handle stock updates in application code
- **Rejected because**: Risk of race conditions, partial updates on error, more network overhead

### 3. Graceful Handling of Deleted References

**Choice**: Store `old_ingredient_id` without foreign key constraint, resolve via LEFT JOIN

**Rationale**:
- History must survive ingredient deletion (audit trail requirement)
- LEFT JOIN allows query to succeed even if ingredient gone
- UI displays "(удалён)" fallback for missing ingredients

**Implementation**:
```sql
-- No FK on old_ingredient_id (intentional)
old_ingredient_id BIGINT  -- NOT REFERENCES ingredients(id)
```

```sql
-- Query with fallback
SELECT
  ph.*,
  COALESCE(i.name, '(удалён)') as old_ingredient_name
FROM purchase_history ph
LEFT JOIN ingredients i ON ph.old_ingredient_id = i.id
WHERE ph.purchase_id = $1
ORDER BY ph.edited_at DESC;
```

**Alternative considered**: Soft delete ingredients
- **Rejected because**: Adds complexity to all ingredient queries, doesn't solve problem for hard deletes

### 4. Sheet for History, Dialog for Edit

**Choice**: Use shadcn/ui Sheet (side panel) for history, Dialog (modal) for edit form

**Rationale**:
- **History in Sheet**: Allows viewing history without losing table context (side-by-side)
- **Edit in Dialog**: Modal focus for form prevents accidental data loss
- **Consistent with patterns**: Dialog already used for create forms in other sections

**UI layout**:
```
[Purchases Table]
  ├─ Row 1 [Actions ▼]
  │   ├─ Edit → Opens Dialog (modal)
  │   └─ History → Opens Sheet (side panel)
  ├─ Row 2 [Actions ▼]
  └─ Row 3 [Actions ▼]
```

**Alternative considered**: History in separate page (`/purchases/[id]/history`)
- **Rejected because**: Requires navigation away from table, slower UX

### 5. Server Actions over API Routes

**Choice**: Use Next.js Server Actions for `updatePurchase()` and `getPurchaseHistory()`

**Rationale**:
- Type safety: Shared TypeScript types between client and server
- Less boilerplate: No need to define API routes, request/response handling
- Built-in revalidation: `revalidatePath()` automatically invalidates cache
- Aligned with Next.js 16 best practices

**Implementation**:
```typescript
// src/lib/actions/purchases.ts
'use server'

export async function updatePurchase(
  id: number,
  data: PurchaseFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.rpc('update_purchase', {
    p_id: id,
    p_edited_by: user?.id,
    // ... other params
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/purchases')
  return { success: true }
}
```

## Consequences

### Positive

1. **Simple mental model**: Full snapshots are easy to understand and debug
2. **Data integrity**: Atomic RPC ensures stock always consistent with purchases
3. **Audit compliance**: Complete history preserved even when references deleted
4. **Fast queries**: No need to reconstruct state from deltas
5. **Type-safe**: Server Actions provide end-to-end TypeScript safety
6. **UX clarity**: Sheet/Dialog pattern provides clear visual hierarchy

### Negative

1. **Storage overhead**: Full snapshots take more space than field deltas
   - Mitigation: Purchases edited infrequently, storage cost negligible
2. **No field-level diff**: Cannot highlight which specific field changed
   - Mitigation: Future enhancement if needed (compare snapshots in UI)
3. **No rollback built-in**: History is read-only, no automatic revert
   - Mitigation: Can be added later as separate feature
4. **History deleted with purchase**: CASCADE delete removes audit trail
   - Mitigation: Acceptable for MVP (can add soft delete later)
5. **RPC complexity**: Postgres function harder to debug than app code
   - Mitigation: Comprehensive error handling, logging in RPC

## Technical Notes

### Why SECURITY DEFINER is Safe Here

The `update_purchase` RPC uses `SECURITY DEFINER` to run with elevated privileges:

```sql
CREATE OR REPLACE FUNCTION update_purchase(...)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as function owner, not caller
```

**Safety measures**:
1. **RLS check at start**: Function verifies user has UPDATE permission before proceeding
2. **Input validation**: All parameters validated (non-null, positive numbers, etc.)
3. **Limited scope**: Only updates purchases + ingredients, no admin operations
4. **Audit trail**: edited_by captures user identity in history

**Why needed**:
- User may not have direct INSERT on `purchase_history` table
- User may not have UPDATE on `ingredients` table
- Allows RLS to control purchases access while centralizing complex logic

### Handling Ingredient Switches

When ingredient changes (e.g., old=flour, new=sugar):

```sql
-- Reverse old: flour.stock -= 10kg
UPDATE ingredients SET stock = stock - 10 WHERE id = old_ingredient_id;

-- Apply new: sugar.stock += 10kg
UPDATE ingredients SET stock = stock + 10 WHERE id = new_ingredient_id;
```

Edge case: Same ingredient, different amount
```sql
-- Old: flour 10kg → New: flour 15kg
-- Reverse old: flour.stock -= 10
-- Apply new: flour.stock += 15
-- Net effect: flour.stock += 5
```

This approach is **idempotent** and handles all cases correctly.

## Comparison with Other Approaches

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Full snapshots** | Simple queries, easy display | More storage | ✅ Chosen |
| Field-level deltas | Less storage, precise changes | Complex reconstruction | ❌ Rejected |
| **RPC function** | Atomic, fast, centralized | Harder to debug | ✅ Chosen |
| App-side stock updates | Easier debugging | Race conditions, not atomic | ❌ Rejected |
| **LEFT JOIN for deleted** | History survives deletions | No FK enforcement | ✅ Chosen |
| Soft delete ingredients | FK integrity maintained | Complicates all queries | ❌ Rejected |
| **Sheet + Dialog** | Intuitive UX, preserves context | More components | ✅ Chosen |
| Separate history page | Simpler routing | Navigation overhead | ❌ Rejected |

## Follow-up Work

### Immediate (MVP)
- [x] Create purchase_history table
- [x] Implement update_purchase RPC
- [x] Build PurchaseEditDialog component
- [x] Build PurchaseHistorySheet component
- [x] Add Server Actions
- [x] Update RLS policies

### Future Enhancements
- [ ] Add rollback/restore from history
- [ ] Implement field-level diff highlighting in UI
- [ ] Export history as PDF/CSV
- [ ] Show user names instead of UUIDs
- [ ] Add soft delete for purchases
- [ ] Implement similar pattern for other entities (orders, expenses)

## Files Changed

### Database
- `supabase/schema.sql:141-169` — Added purchase_history table
- `supabase/schema.sql:182-235` — Added update_purchase RPC function

### Server
- `src/lib/types.ts:62-72` — Added PurchaseHistory interface
- `src/lib/actions/purchases.ts:83-127` — Added updatePurchase() server action
- `src/lib/actions/purchases.ts:128-157` — Added getPurchaseHistory() server action

### Client
- `src/app/(dashboard)/purchases/purchases-table.tsx` — New table component with actions
- `src/app/(dashboard)/purchases/purchase-edit-dialog.tsx` — New edit form
- `src/app/(dashboard)/purchases/purchase-history-sheet.tsx` — New history viewer
- `src/app/(dashboard)/purchases/page.tsx` — Refactored to use PurchasesTable

## References

- [Supabase Functions Documentation](https://supabase.com/docs/guides/database/functions)
- [Postgres SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/sheet)

## Related ADRs

- [001. Fix Double Expense Submission](./001-fix-double-expense-submission.md) — Similar form submission pattern with loading states
