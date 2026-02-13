# Recipe Edit
Date: 2026-02-13 | Status: Implemented

## Overview

The recipes page now supports full recipe editing. Users can modify recipe names, output quantities, units, prices, and ingredient compositions from the recipe grid view.

## Key Features

- **Edit recipes** via pencil icon on recipe cards in grid view
- **Dual-mode form** for both creating and editing recipes
- **Delete-and-reinsert pattern** for recipe items (same as Orders edit)
- **Controlled dialog** with external open state management
- **Form pre-population** with `useEffect` hook when recipe prop provided
- **Key prop remount** to reset form state when switching between recipes

## Architecture

### Component Structure

```
src/app/(dashboard)/recipes/
├── page.tsx              # Server Component, fetches recipes
├── recipes-grid.tsx      # Client Component, grid view with edit icons
└── recipe-form.tsx       # Dual-mode form (create/edit)

src/lib/
├── actions/recipes.ts    # Server actions: createRecipe, updateRecipe
└── types.ts              # UpdateRecipeData type
```

### Data Flow

#### Create Recipe (existing)
1. User opens `RecipeForm` without `recipe` prop → `src/app/(dashboard)/recipes/recipe-form.tsx:122`
2. Form submits to `createRecipe` → `src/lib/actions/recipes.ts:30`
3. Server action creates recipe + recipe_items, calls `revalidatePath('/recipes')`

#### Edit Recipe (new)
1. User clicks pencil icon on recipe card → `src/app/(dashboard)/recipes/recipes-grid.tsx:58`
2. Opens `RecipeForm` with `recipe` prop and controlled `open` state
3. `useEffect` pre-fills form with existing data → `src/app/(dashboard)/recipes/recipe-form.tsx:45-58`
4. On submit, calls `updateRecipe` → `src/lib/actions/recipes.ts:85`
5. Server action:
   - Validates auth
   - Updates recipe table (name, output_quantity, unit, price)
   - Deletes existing recipe_items
   - Inserts new recipe_items
   - Calls `revalidatePath('/recipes')` and `revalidatePath('/production')`

### Key Technical Decisions

#### Delete-and-Reinsert for Recipe Items
- On update, existing recipe_items are deleted and new ones inserted → `src/lib/actions/recipes.ts:106-121`
- Safe because recipes do NOT affect inventory (only production deducts stock)
- Simpler than diffing for adds/updates/deletes
- Follows same pattern as Orders edit

#### Controlled Dialog with External State
- Grid component manages `editingRecipe` state → `src/app/(dashboard)/recipes/recipes-grid.tsx:19`
- Passes `open` and `onOpenChange` props to RecipeForm
- RecipeForm uses `open ?? internalOpen` for backward compatibility → `src/app/(dashboard)/recipes/recipe-form.tsx:34`
- Allows both trigger-based (create) and controlled (edit) modes

#### Key Prop for Remount
- RecipeForm receives `key={editingRecipe.id}` → `src/app/(dashboard)/recipes/recipes-grid.tsx:83`
- Forces remount when switching between different recipes
- Ensures `useEffect` runs with fresh recipe data
- Prevents stale state from previous edits

#### useEffect for Form Population
- Watches `recipe` prop and updates all form fields → `src/app/(dashboard)/recipes/recipe-form.tsx:45-58`
- Maps `recipe.recipe_items` to form's `items` state
- Handles nullable price field gracefully
- Falls back to empty single item if recipe_items missing

### Components in Detail

#### RecipesGrid
```tsx
// src/app/(dashboard)/recipes/recipes-grid.tsx:19
const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

// Opens dialog with recipe prop:
<Button onClick={() => setEditingRecipe(recipe)}>
  <Pencil className="h-4 w-4" />
</Button>

// Controlled RecipeForm with key prop:
<RecipeForm
  key={editingRecipe.id}
  recipe={editingRecipe}
  open={true}
  onOpenChange={(open) => {
    if (!open) setEditingRecipe(null)
  }}
/>
```

#### RecipeForm (refactored)
```tsx
// src/app/(dashboard)/recipes/recipe-form.tsx:25-43
interface RecipeFormProps {
  ingredients: Ingredient[]
  recipe?: Recipe           // Optional for edit mode
  open?: boolean            // External open control
  onOpenChange?: (open: boolean) => void
}

// Controlled/uncontrolled dialog pattern:
const isOpen = open ?? internalOpen
const setIsOpen = onOpenChange ?? setInternalOpen

// Form population on recipe change:
useEffect(() => {
  if (recipe) {
    setName(recipe.name)
    setOutputQty(String(recipe.output_quantity))
    setUnit(recipe.unit)
    setPrice(recipe.price != null ? String(recipe.price) : '')
    setItems(
      recipe.recipe_items?.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: String(item.quantity),
      })) ?? [{ ingredient_id: '', quantity: '' }]
    )
  }
}, [recipe])

// Conditional rendering:
{!recipe && (
  <DialogTrigger asChild>
    <Button>Добавить рецепт</Button>
  </DialogTrigger>
)}
```

## Server Actions

### updateRecipe
```typescript
// src/lib/actions/recipes.ts:85-126
export async function updateRecipe(
  data: UpdateRecipeData
): Promise<ActionResult>
```
- Validates auth and input (name, items.length > 0)
- Updates recipe table (name, output_quantity, unit, price)
- Deletes all existing recipe_items → `src/lib/actions/recipes.ts:106-111`
- Inserts new recipe_items → `src/lib/actions/recipes.ts:113-121`
- Revalidates `/recipes` and `/production` paths
- Returns `{ success: true }` or `{ success: false, error }`

## TypeScript Types

### UpdateRecipeData
```typescript
// src/lib/types.ts:136-143
export type UpdateRecipeData = {
  id: string
  name: string
  output_quantity: number
  unit: string
  price: number | null
  items: { ingredient_id: string; quantity: number }[]
}
```

## Related Code Locations

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/(dashboard)/recipes/recipes-grid.tsx` | 58-90 | Pencil icon, editingRecipe state, controlled RecipeForm |
| `src/app/(dashboard)/recipes/recipe-form.tsx` | 25-58, 92-100 | Dual-mode form, useEffect population, conditional submit |
| `src/lib/actions/recipes.ts` | 85-126 | updateRecipe server action |
| `src/lib/types.ts` | 136-143 | UpdateRecipeData type |

## User Workflow

1. Click pencil icon on recipe card in grid
2. Dialog opens with form pre-filled
3. Modify name, output, unit, price, or ingredients
4. Add/remove ingredient rows as needed
5. Click "Сохранить"
6. Grid updates, dialog closes

## Database Schema Impact

No schema changes. Uses existing `recipes` and `recipe_items` tables.

## Related Documentation

- [Orders Kanban View and Editing](./orders-kanban-edit.md) - Same delete-and-reinsert pattern for child items
- [Database Schema](../architecture/database-schema.md) - Recipes and recipe_items tables

## Future Enhancements

- Recipe versioning/history (similar to Purchase Edit with History)
- Cost calculation preview in edit form
- Bulk ingredient import
