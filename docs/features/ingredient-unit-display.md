# Ingredient Unit Display Pattern

Date: 2026-02-13 | Status: Implemented

## Overview

Automatic unit-of-measurement display in forms when selecting ingredients. The unit is shown both in the ingredient dropdown (for context) and as a suffix next to quantity input fields (for validation feedback).

## Key Features

- **Dropdown context**: Unit displayed in ingredient dropdown items (e.g., "Клубника (кг)")
- **Input suffix**: Selected ingredient's unit auto-displayed next to quantity field
- **Controlled Select**: Uses `useState` to track selected ingredient for derived unit lookup
- **Consistent UX**: Same pattern across purchases, production, and write-offs

## Implementation Pattern

### Component Structure

```typescript
// src/app/(dashboard)/write-offs/write-off-form.tsx:37-39
const [selectedIngredientId, setSelectedIngredientId] = useState('')
const selectedIngredient = ingredients.find((ing) => ing.id === selectedIngredientId)
```

### Dropdown with Units

```tsx
// src/app/(dashboard)/write-offs/write-off-form.tsx:64-75
<Select name="ingredient_id" required value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
  <SelectTrigger>
    <SelectValue placeholder="Выберите ингредиент" />
  </SelectTrigger>
  <SelectContent>
    {ingredients.map((ing) => (
      <SelectItem key={ing.id} value={ing.id}>
        {ing.name} ({ing.unit})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Quantity Input with Unit Suffix

```tsx
// src/app/(dashboard)/write-offs/write-off-form.tsx:79-84
<div className="flex items-center gap-2">
  <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" required />
  {selectedIngredient && (
    <span className="text-sm text-muted-foreground whitespace-nowrap">{selectedIngredient.unit}</span>
  )}
</div>
```

## Usage Across Forms

| Form | Dropdown Units | Input Suffix | File |
|------|---------------|--------------|------|
| **Purchases** | ✅ | ❌ | `src/app/(dashboard)/purchases/purchase-form.tsx:67` |
| **Production** | ✅ | ✅ | `src/app/(dashboard)/production/production-form.tsx` |
| **Write-offs** | ✅ | ✅ | `src/app/(dashboard)/write-offs/write-off-form.tsx:71,82` |

## Technical Details

- **State management**: Controlled `<Select>` with `value` and `onValueChange` props
- **Derived data**: `ingredients.find()` to get full ingredient object from selected ID
- **Conditional rendering**: Unit suffix only shown when ingredient is selected
- **Styling**: `text-sm text-muted-foreground whitespace-nowrap` for non-intrusive display

## Benefits

1. **User guidance**: Users see correct unit before entering quantity
2. **Error prevention**: Clear unit display reduces unit confusion (kg vs g, шт vs уп)
3. **Consistency**: Same visual pattern across all ingredient-based forms
4. **Accessibility**: Unit information available without hovering or additional clicks

## Related Documentation

- [DataTable Component System](./data-table.md) - Generic table component used in `/write-offs` page
- Purchase form: `src/app/(dashboard)/purchases/purchase-form.tsx`
- Production form: `src/app/(dashboard)/production/production-form.tsx`
- Write-off form: `src/app/(dashboard)/write-offs/write-off-form.tsx`
