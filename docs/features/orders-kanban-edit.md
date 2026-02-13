# Orders Kanban View and Editing
Date: 2026-02-13 | Status: Implemented

## Overview

The orders page now supports dual viewing modes — a data table and a Kanban board — plus full order editing capabilities. Users can toggle between views, drag-and-drop orders to change their status on the Kanban board, and edit orders from both views.

## Key Features

- **View Toggle**: Switch between Таблица (table) and Канбан (kanban) views using shadcn Tabs
- **Kanban Board**: 5 status columns (Новый, В работе, Готов, Выдан, Отменён) with drag-and-drop status updates
- **Order Editing**: Edit existing orders from table actions menu or kanban card icons
- **Drag-and-Drop**: Uses `@dnd-kit/core` for React 19 compatibility
- **Dual-Mode Form**: `OrderForm` component supports both creation and editing with the same UI

## Architecture

### Component Structure

```
src/app/(dashboard)/orders/
├── page.tsx                      # Server Component, fetches orders
├── orders-view-toggle.tsx        # Client Component, Tabs wrapper
├── orders-table.tsx              # Table view with edit action
├── orders-kanban.tsx             # Kanban board with drag-and-drop
├── order-form.tsx                # Dual-mode form (create/edit)
└── order-status.tsx              # Status dropdown (used in table)

src/lib/
├── constants.ts                  # ORDER_STATUSES shared constant
└── actions/orders.ts             # Server actions: createOrder, updateOrder, updateOrderStatus
```

### Data Flow

#### Create Order (existing)
1. User fills `OrderForm` without `order` prop → `src/app/(dashboard)/orders/order-form.tsx`
2. Form submits to `createOrder` → `src/lib/actions/orders.ts:65`
3. Server action creates order + order_items, calls `revalidatePath('/orders')`

#### Edit Order (new)
1. User clicks edit icon in table or kanban → opens `OrderForm` with `order` prop
2. Form pre-fills with existing order data (client, delivery date, items)
3. On submit, calls `updateOrder` → `src/lib/actions/orders.ts:134`
4. Server action:
   - Validates auth
   - Updates order table
   - Deletes existing order_items
   - Inserts new order_items (no inventory impact)
   - Calls `revalidatePath('/orders')`

#### Drag-and-Drop Status Change (new)
1. User drags order card from one column to another → `src/app/(dashboard)/orders/orders-kanban.tsx:42-66`
2. `handleDragEnd` extracts new status from `over.id`
3. Optimistically updates local state
4. Calls `updateOrderStatus` → `src/lib/actions/orders.ts:174`
5. Server action updates status, calls `revalidatePath('/orders')`

### Key Technical Decisions

#### Why @dnd-kit/core?
- React 19 compatible (many drag-and-drop libraries are not)
- Lightweight, headless API
- No styling opinions, works with Tailwind

#### Delete-and-Reinsert for Order Items
- On update, existing order_items are deleted and new ones inserted → `src/lib/actions/orders.ts:153-167`
- Safe because orders do NOT affect inventory (only production and write-offs deduct stock)
- Simpler than diffing for adds/updates/deletes

#### View Toggle via Client-Side Tabs
- Uses shadcn `Tabs` component, state stays in browser
- Alternative: URL search params (`?view=kanban`) for shareable links
- Chose Tabs for simplicity; state reset on page reload is acceptable

#### Shared Constants
- `ORDER_STATUSES` extracted to `src/lib/constants.ts` → `src/lib/constants.ts:1-12`
- Used in kanban, status dropdown, and type definitions
- Single source of truth prevents drift

### Components in Detail

#### OrdersViewToggle
```tsx
// src/app/(dashboard)/orders/orders-view-toggle.tsx
'use client';
// Tabs wrapper, passes orders to OrdersTable and OrdersKanban
```

#### OrdersKanban
```tsx
// src/app/(dashboard)/orders/orders-kanban.tsx:42-66
// DndContext setup:
- DragEndEvent handler updates status
- Droppable columns by status
- Draggable cards with order info + edit icon
```

#### OrderForm (refactored)
```tsx
// src/app/(dashboard)/orders/order-form.tsx
interface OrderFormProps {
  order?: Order & { items: OrderItem[]; client: Client }; // Optional for edit mode
}

// If order prop exists:
- Dialog title: "Редактировать заказ"
- Form default values from order data
- Submit calls updateOrder

// If order prop missing:
- Dialog title: "Новый заказ"
- Form default values empty
- Submit calls createOrder
```

## Server Actions

### updateOrder
```typescript
// src/lib/actions/orders.ts:134-171
export async function updateOrder(
  orderId: string,
  data: UpdateOrderData
): Promise<ActionResult>
```
- Validates auth
- Updates order (client_id, delivery_date, total_price, status)
- Deletes all existing order_items
- Inserts new order_items from data.items
- Returns `{ success: true }` or `{ success: false, error }`

### updateOrderStatus
```typescript
// src/lib/actions/orders.ts:174-194
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult>
```
- Validates auth (added in this feature)
- Updates only status field
- Used by kanban drag-and-drop

## Related Code Locations

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/(dashboard)/orders/page.tsx` | 18-35 | Server Component, renders OrdersViewToggle |
| `src/app/(dashboard)/orders/orders-view-toggle.tsx` | 1-36 | Client Component, Tabs for table/kanban |
| `src/app/(dashboard)/orders/orders-kanban.tsx` | 1-169 | Kanban board with @dnd-kit drag-and-drop |
| `src/app/(dashboard)/orders/orders-table.tsx` | 96-110 | Actions column with edit menu item |
| `src/app/(dashboard)/orders/order-form.tsx` | 1-414 | Dual-mode form (create/edit) |
| `src/lib/actions/orders.ts` | 134-194 | updateOrder and updateOrderStatus actions |
| `src/lib/constants.ts` | 1-12 | ORDER_STATUSES shared constant |
| `src/lib/types.ts` | 31-36 | UpdateOrderData type |

## User Workflows

### Edit Order from Table View
1. Click "..." menu in actions column
2. Click "Редактировать"
3. Dialog opens with form pre-filled
4. Modify client, date, or items
5. Click "Сохранить заказ"
6. Table updates, dialog closes

### Edit Order from Kanban View
1. Click pencil icon on order card
2. Same workflow as table view

### Change Order Status via Kanban
1. Drag order card to new status column
2. Card moves optimistically
3. Server updates status
4. On error, card reverts to original position (TODO: error handling)

## Database Schema Impact

No schema changes. Uses existing `orders` and `order_items` tables.

## Dependencies Added

```json
{
  "@dnd-kit/core": "^6.3.1"
}
```

## Related Documentation

- [Order Form Enhancements](./order-form-enhancements.md) - Client combobox, quick dates, recipe pricing
- [Database Schema](../architecture/database-schema.md) - Orders and order_items tables

## Future Enhancements

- Error handling for drag-and-drop failures (currently optimistic)
- Persist view preference (localStorage or user settings)
- Kanban column sorting/filtering
- URL-based view state (`?view=kanban`) for shareable links
