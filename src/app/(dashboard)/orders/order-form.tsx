'use client'

import { useState } from 'react'
import { createOrder } from '@/lib/actions/orders'
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
import type { Client, Recipe } from '@/lib/types'

interface OrderFormProps {
  clients: Client[]
  recipes: Recipe[]
}

interface OrderItemFormData {
  recipe_id: string
  quantity: string
  price: string
}

export function OrderForm({ clients, recipes }: OrderFormProps) {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<OrderItemFormData[]>([
    { recipe_id: '', quantity: '1', price: '' },
  ])

  function addItem(): void {
    setItems([...items, { recipe_id: '', quantity: '1', price: '' }])
  }

  function removeItem(index: number): void {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof OrderItemFormData, value: string): void {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.price || 0),
    0
  )

  async function handleSubmit(): Promise<void> {
    const result = await createOrder({
      client_id: clientId,
      date,
      items: items
        .filter((item) => item.recipe_id && item.quantity && item.price)
        .map((item) => ({
          recipe_id: item.recipe_id,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
    })

    if (result.success) {
      toast.success('Заказ создан')
      setOpen(false)
      setClientId('')
      setItems([{ recipe_id: '', quantity: '1', price: '' }])
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Новый заказ</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Клиент</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Позиции</Label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={item.recipe_id}
                  onValueChange={(v) => updateItem(i, 'recipe_id', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  className="w-16"
                  placeholder="Кол"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  placeholder="Цена ₽"
                  value={item.price}
                  onChange={(e) => updateItem(i, 'price', e.target.value)}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              + Позиция
            </Button>
          </div>

          <div className="text-right font-medium">Итого: {total} ₽</div>

          <Button onClick={handleSubmit} className="w-full">Создать заказ</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
