'use client'

import { useFormStatus } from 'react-dom'
import { updatePurchase } from '@/lib/actions/purchases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Purchase, Ingredient } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Сохранение...' : 'Сохранить'}
    </Button>
  )
}

interface PurchaseEditDialogProps {
  purchase: Purchase | null
  ingredients: Ingredient[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseEditDialog({
  purchase,
  ingredients,
  open,
  onOpenChange,
}: PurchaseEditDialogProps) {
  if (!purchase) return null

  async function handleSubmit(formData: FormData) {
    const result = await updatePurchase(formData)
    if (result.success) {
      toast.success('Закупка обновлена')
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать закупку</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="purchase_id" value={purchase.id} />
          <div className="space-y-2">
            <Label>Ингредиент</Label>
            <Select name="ingredient_id" defaultValue={purchase.ingredient_id} required>
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
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0"
              defaultValue={purchase.quantity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_per_unit">Цена за единицу (₽)</Label>
            <Input
              id="price_per_unit"
              name="price_per_unit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={purchase.price_per_unit}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Дата</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={purchase.date}
              required
            />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  )
}
