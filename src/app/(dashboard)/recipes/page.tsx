import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { RecipeForm } from './recipe-form'
import { RecipesGrid } from './recipes-grid'

export default async function RecipesPage() {
  const [recipes, ingredients] = await Promise.all([
    getRecipes(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рецепты</h1>
        <RecipeForm ingredients={ingredients} />
      </div>

      <RecipesGrid recipes={recipes} ingredients={ingredients} />
    </div>
  )
}
