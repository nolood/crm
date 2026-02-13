import { getProductions } from '@/lib/actions/production'
import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { ProductionForm } from './production-form'
import { ProductionTable } from './production-table'

export default async function ProductionPage() {
  const [productions, recipes, ingredients] = await Promise.all([
    getProductions(),
    getRecipes(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Производство</h1>
        <ProductionForm recipes={recipes} ingredients={ingredients} />
      </div>

      <ProductionTable productions={productions} />
    </div>
  )
}
