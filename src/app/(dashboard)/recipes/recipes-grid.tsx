'use client'

import { useState, useMemo } from 'react'
import { DataTableSearch } from '@/components/data-table/data-table-search'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recipe } from '@/lib/types'

interface RecipesGridProps {
  recipes: Recipe[]
}

export function RecipesGrid({ recipes }: RecipesGridProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return recipes
    const q = searchQuery.toLowerCase().trim()
    return recipes.filter((recipe) => {
      if (recipe.name.toLowerCase().includes(q)) return true
      return recipe.recipe_items?.some((item) =>
        item.ingredient?.name?.toLowerCase().includes(q)
      )
    })
  }, [recipes, searchQuery])

  return (
    <div>
      <div className="py-4">
        <DataTableSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Поиск рецепта..."
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {recipes.length === 0 ? 'Нет рецептов' : 'Рецепты не найдены'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Выход: {recipe.output_quantity} {recipe.unit}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recipe.recipe_items?.map((item) => (
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
