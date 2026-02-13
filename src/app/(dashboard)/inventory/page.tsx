import { getIngredients } from '@/lib/actions/ingredients'
import { IngredientForm } from './ingredient-form'
import { InventoryTable } from './inventory-table'

export default async function InventoryPage() {
  const ingredients = await getIngredients()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Склад</h1>
        <IngredientForm />
      </div>

      <InventoryTable ingredients={ingredients} />
    </div>
  )
}
