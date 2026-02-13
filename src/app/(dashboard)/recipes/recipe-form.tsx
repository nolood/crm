'use client'

import { useState } from 'react'
import { createRecipe } from '@/lib/actions/recipes'
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
import { toast } from 'sonner'
import type { Ingredient } from '@/lib/types'

export function RecipeForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [outputQty, setOutputQty] = useState('1')
  const [unit, setUnit] = useState('шт')
  const [items, setItems] = useState<{ ingredient_id: string; quantity: string }[]>([
    { ingredient_id: '', quantity: '' },
  ])
  const [isPending, setIsPending] = useState(false)

  function addItem() {
    setItems([...items, { ingredient_id: '', quantity: '' }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string) {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  function resetForm() {
    setName('')
    setOutputQty('1')
    setUnit('шт')
    setItems([{ ingredient_id: '', quantity: '' }])
  }

  async function handleSubmit() {
    setIsPending(true)
    try {
      const result = await createRecipe({
        name,
        output_quantity: Number(outputQty),
        unit,
        items: items
          .filter((item) => item.ingredient_id && item.quantity)
          .map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity: Number(item.quantity),
          })),
      })

      if (result.success) {
        toast.success('Рецепт создан')
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить рецепт</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый рецепт</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название продукта</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Клубника в шоколаде"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Выход</Label>
              <Input
                type="number"
                value={outputQty}
                onChange={(e) => setOutputQty(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Единица</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="шт">шт</SelectItem>
                  <SelectItem value="кг">кг</SelectItem>
                  <SelectItem value="порция">порция</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ингредиенты</Label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={item.ingredient_id}
                  onValueChange={(v) => updateItem(i, 'ingredient_id', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ингредиент" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Кол-во"
                  className="w-24"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              + Ингредиент
            </Button>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
            {isPending ? 'Создание...' : 'Создать рецепт'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
