# Order Delivery Time

Date: 2026-02-13 | Status: Implemented

## Overview

Optional delivery time field for orders. Users can now specify a precise delivery time (HH:mm) in addition to the required delivery date. This time is displayed across all order views — dashboard upcoming orders, orders table, and kanban board.

## Key Features

- **Optional time field**: Delivery time is nullable — users can leave it blank for date-only orders
- **Native HTML5 input**: Uses `<input type="time">` with no additional dependencies
- **Clear button**: Users can reset the time field after setting it
- **Consistent formatting**: Unified `formatOrderDate()` helper displays "ДД.ММ.ГГГГ в HH:mm" or just "ДД.ММ.ГГГГ"
- **Smart sorting**: Dashboard groups by date first, then sorts timed orders before untimed ones within each day

## Architecture

### Database Schema

Added nullable `delivery_time` column to orders table:

```sql
-- supabase/schema.sql
ALTER TABLE orders ADD COLUMN delivery_time text DEFAULT NULL;
```

**Design Decision**: Used separate `text` column instead of converting `delivery_date` from `date` to `timestamptz`:
- **Minimal migration risk**: Existing `delivery_date` remains unchanged
- **Natural optionality**: NULL clearly means "no time specified"
- **Simple validation**: Time stored as "HH:mm" string
- **No timezone complexity**: Home business operates in single timezone

### Type Updates

```typescript
// src/lib/types.ts
export interface Order {
  // ...existing fields
  delivery_time: string | null; // "HH:mm" format or null
}

export interface UpdateOrderData {
  // ...existing fields
  delivery_time?: string | null;
}

export interface UpcomingOrder {
  // ...existing fields
  delivery_time: string | null;
}
```

### Server Actions

**Create Order**:
```typescript
// src/lib/actions/orders.ts
export async function createOrder(formData: FormData): Promise<ActionResult> {
  const delivery_time = formData.get('delivery_time') as string | null;
  // delivery_time can be empty string, normalize to null
  const normalizedTime = delivery_time?.trim() || null;

  await supabase.from('orders').insert({
    // ...other fields
    delivery_time: normalizedTime,
  });
}
```

**Update Order**:
```typescript
// src/lib/actions/orders.ts
export async function updateOrder(
  orderId: string,
  data: UpdateOrderData
): Promise<ActionResult> {
  // data.delivery_time passed through from form
  await supabase.from('orders').update({
    // ...other fields
    delivery_time: data.delivery_time,
  });
}
```

**Dashboard Sorting**:
```typescript
// src/lib/actions/dashboard.ts
export async function getUpcomingOrders(): Promise<UpcomingOrder[]> {
  // Fetch orders for next 3 days
  const orders = await supabase
    .from('orders')
    .select('...fields, delivery_time')
    .in('status', ['new', 'in_progress', 'ready'])
    .gte('delivery_date', today)
    .lte('delivery_date', threeDaysLater)
    .order('delivery_date', { ascending: true });

  // Secondary sort: timed orders before untimed within each day
  return orders.sort((a, b) => {
    if (a.delivery_date !== b.delivery_date) {
      return a.delivery_date.localeCompare(b.delivery_date);
    }
    // Same date: timed orders first
    if (a.delivery_time && !b.delivery_time) return -1;
    if (!a.delivery_time && b.delivery_time) return 1;
    // Both timed: sort by time
    if (a.delivery_time && b.delivery_time) {
      return a.delivery_time.localeCompare(b.delivery_time);
    }
    return 0; // both untimed
  });
}
```

### UI Components

**Order Form** (`src/app/(dashboard)/orders/order-form.tsx`):
```tsx
const [deliveryTime, setDeliveryTime] = useState(orderToEdit?.delivery_time || '');

// Time input with clear button
<div className="space-y-2">
  <Label htmlFor="delivery_time">Время доставки (необязательно)</Label>
  <div className="flex gap-2">
    <Input
      type="time"
      id="delivery_time"
      name="delivery_time"
      value={deliveryTime}
      onChange={(e) => setDeliveryTime(e.target.value)}
    />
    {deliveryTime && (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDeliveryTime('')}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
</div>
```

**Formatting Utility** (`src/lib/utils.ts`):
```typescript
export function formatOrderDate(date: string, time: string | null): string {
  const formatted = format(parseISO(date), 'dd.MM.yyyy', { locale: ru });
  if (time) {
    return `${formatted} в ${time}`;
  }
  return formatted;
}
```

**Display in Orders Table** (`src/app/(dashboard)/orders/orders-table.tsx`):
```tsx
{
  accessorKey: 'delivery_date',
  header: 'Дата доставки',
  cell: ({ row }) => formatOrderDate(row.original.delivery_date, row.original.delivery_time),
}
```

**Display in Kanban** (`src/app/(dashboard)/orders/orders-kanban.tsx`):
```tsx
<div className="text-sm text-muted-foreground">
  {formatOrderDate(order.delivery_date, order.delivery_time)}
</div>
```

**Display in Dashboard** (`src/app/(dashboard)/page.tsx`):
```tsx
<div className="text-sm text-muted-foreground">
  {formatOrderDate(order.delivery_date, order.delivery_time)}
</div>
```

## User Flow

### Creating Order with Time

1. User opens "Новый заказ" form
2. Fills required fields (client, date, items)
3. Optionally clicks time input and selects time via native picker
4. Submits form
5. Order displays with "12.02.2026 в 14:30" format

### Creating Order without Time

1. User opens form
2. Fills required fields
3. Leaves time input empty
4. Submits form
5. Order displays with "12.02.2026" format

### Clearing Time

1. User edits existing order with time set
2. Clicks "X" button next to time input
3. Time input resets to empty
4. Saves order
5. Time removed from display

## Benefits

1. **Precise scheduling**: Users can specify exact delivery windows (e.g., "14:00 for afternoon pickup")
2. **Backward compatible**: Existing orders without time continue to work
3. **Simple UX**: Native time picker on mobile devices, keyboard-friendly on desktop
4. **Clear visual hierarchy**: Timed orders appear first in dashboard for time-sensitive deliveries
5. **No dependencies**: Built-in HTML5 input, no date/time library needed for input

## Technical Decisions

### Why Separate Column?

**Alternatives considered**:
- Convert `delivery_date date` to `delivery_date timestamptz`
- Store time as interval or integer (minutes since midnight)

**Chosen approach**: Separate `delivery_time text` column

**Rationale**:
- **Migration safety**: No risk of breaking existing date logic
- **Explicit optionality**: NULL clearly communicates "no time set"
- **Simple serialization**: "HH:mm" string directly from HTML input
- **Query simplicity**: No timezone conversion needed for home business
- **Graceful degradation**: Old code ignores new column

### Why Native HTML5 Input?

**Alternatives considered**:
- React date-time library (date-fns, Temporal, etc.)
- Custom time picker component
- Text input with manual validation

**Chosen approach**: `<input type="time">`

**Rationale**:
- **Zero dependencies**: No additional bundle size
- **Native mobile UI**: iOS/Android provide optimized pickers
- **Built-in validation**: Browser validates HH:mm format
- **Accessibility**: Native keyboard navigation
- **Consistent with date picker**: Already using native Calendar component from shadcn

### Why JS-Side Sorting?

**Alternative**: Sort timed orders first using SQL `COALESCE(delivery_time, 'zz')` hack

**Chosen approach**: Fetch all, sort in JS

**Rationale**:
- **Readable logic**: Clear sort comparison in TypeScript
- **Small dataset**: 3 days of orders ≈ 10-20 records max
- **Negligible performance**: Sorting 20 items < 1ms
- **Single-user app**: No scaling concerns
- **Maintainable**: Future sort changes easier in JS

## Code References

### Modified Files

1. **Database Schema** — `/home/nolood/general/crm/supabase/schema.sql`
   - Added `delivery_time text` column to orders table

2. **Type Definitions** — `/home/nolood/general/crm/src/lib/types.ts`
   - Added `delivery_time: string | null` to Order, UpdateOrderData, UpcomingOrder

3. **Utility Functions** — `/home/nolood/general/crm/src/lib/utils.ts`
   - Added `formatOrderDate(date: string, time: string | null): string` helper

4. **Order Actions** — `/home/nolood/general/crm/src/lib/actions/orders.ts`
   - Updated `createOrder()` to accept `delivery_time` from form
   - Updated `updateOrder()` to accept `delivery_time` in data object

5. **Dashboard Actions** — `/home/nolood/general/crm/src/lib/actions/dashboard.ts`
   - Updated `getUpcomingOrders()` to fetch `delivery_time` and sort by time within each date

6. **Order Form** — `/home/nolood/general/crm/src/app/(dashboard)/orders/order-form.tsx`
   - Added time input field with clear button
   - Added `deliveryTime` state management
   - Passes time to server action via form data

7. **Orders Table** — `/home/nolood/general/crm/src/app/(dashboard)/orders/orders-table.tsx`
   - Updated date column to use `formatOrderDate()` helper

8. **Orders Kanban** — `/home/nolood/general/crm/src/app/(dashboard)/orders/orders-kanban.tsx`
   - Updated card date display to use `formatOrderDate()` helper

9. **Dashboard Page** — `/home/nolood/general/crm/src/app/(dashboard)/page.tsx`
   - Updated upcoming orders date display to use `formatOrderDate()` helper

## Related Documentation

- [Order Form Enhancements](./order-form-enhancements.md) — Client combobox, quick date buttons, recipe pricing
- [Orders Kanban View and Editing](./orders-kanban-edit.md) — Dual-view orders management
- [Database Schema](../architecture/database-schema.md) — Orders table structure
- [CLAUDE.md](../../CLAUDE.md) — Server Actions pattern

## Future Enhancements

Potential improvements:
- Time range validation (e.g., business hours only)
- Default time presets (morning/afternoon/evening buttons)
- Time-based dashboard filtering ("orders in next 2 hours")
- Calendar view with hourly slots
