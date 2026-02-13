'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createWriteOff } from '@/lib/actions/write-offs'
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

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Списание...' : 'Списать'}
    </Button>
  )
}

export function WriteOffForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState('')

  const selectedIngredient = ingredients.find((ing) => ing.id === selectedIngredientId)

  async function handleSubmit(formData: FormData) {
    const result = await createWriteOff(formData)
    if (result.success) {
      toast.success('Списание записано')
      setOpen(false)
      setSelectedIngredientId('')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedIngredientId('') }}>
      <DialogTrigger asChild>
        <Button>Записать списание</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новое списание</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ингредиент</Label>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <div className="flex items-center gap-2">
              <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" required />
              {selectedIngredient && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">{selectedIngredient.unit}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Примечание</Label>
            <Input id="note" name="note" placeholder="Необязательно" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Дата</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}
