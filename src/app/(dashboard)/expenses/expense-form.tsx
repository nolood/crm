'use client'

import { useState } from 'react'
import { createExpense } from '@/lib/actions/expenses'
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

const categories = [
  { value: 'advertising', label: 'Реклама' },
  { value: 'delivery', label: 'Доставка' },
  { value: 'rent', label: 'Аренда' },
  { value: 'other', label: 'Прочее' },
]

export function ExpenseForm() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const result = await createExpense(formData)
    if (result.success) {
      toast.success('Расход добавлен')
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Добавить расход</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select name="category" defaultValue="advertising">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input id="description" name="description" placeholder="Большое объявление Авито" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (₽)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Дата</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <Button type="submit" className="w-full">Добавить</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
