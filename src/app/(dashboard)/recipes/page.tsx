import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { RecipeForm } from './recipe-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

      {recipes.length === 0 ? (
        <p className="text-muted-foreground">Нет рецептов</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: any) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Выход: {recipe.output_quantity} {recipe.unit}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recipe.recipe_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.ingredient?.name}</span>
                      <Badge variant="outline">
                        {item.quantity} {item.ingredient?.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
