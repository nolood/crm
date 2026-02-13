'use client'

import { useState, useMemo } from 'react'
import { useFormStatus } from 'react-dom'
import { createProduction } from '@/lib/actions/production'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Ingredient } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Создание...' : 'Записать'}
    </Button>
  )
}

export function ProductionForm({
  recipes,
  ingredients,
}: {
  recipes: any[]
  ingredients: Ingredient[]
}) {
  const [open, setOpen] = useState(false)
  const [recipeId, setRecipeId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const selectedRecipe = recipes.find((r) => r.id === recipeId)
  const ingredientMap = useMemo(
    () => Object.fromEntries(ingredients.map((i) => [i.id, i])),
    [ingredients]
  )

  const deductions = useMemo(() => {
    if (!selectedRecipe) return []
    return selectedRecipe.recipe_items.map((item: any) => {
      const ing = ingredientMap[item.ingredient_id]
      const needed = item.quantity * Number(quantity)
      return {
        name: ing?.name ?? 'Неизвестно',
        unit: ing?.unit ?? '',
        needed,
        available: ing?.stock_qty ?? 0,
        enough: (ing?.stock_qty ?? 0) >= needed,
      }
    })
  }, [selectedRecipe, quantity, ingredientMap])

  async function handleSubmit(formData: FormData) {
    const result = await createProduction(formData)
    if (result.success) {
      toast.success('Производство записано')
      setOpen(false)
      setRecipeId('')
      setQuantity('1')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Записать производство</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое производство</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Рецепт</Label>
            <Select name="recipe_id" value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите рецепт" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Количество (партий)</Label>
            <Input
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          {deductions.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Будет списано:</p>
              {deductions.map((d: { name: string; unit: string; needed: number; available: number; enough: boolean }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="flex items-center gap-2">
                    {d.needed} {d.unit}
                    {!d.enough && (
                      <Badge variant="destructive">Не хватает!</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}
