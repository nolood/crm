'use client'

import { useState, useEffect } from 'react'
import { createOrder, updateOrder } from '@/lib/actions/orders'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import type { Client, Recipe, Order } from '@/lib/types'

interface OrderFormProps {
  clients: Client[]
  recipes: Recipe[]
  order?: Order
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface OrderItemFormData {
  recipe_id: string
  quantity: string
  price: string
}

export function OrderForm({ clients, recipes, order, open, onOpenChange }: OrderFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const [clientId, setClientId] = useState(order?.client_id ?? '')
  const [clientSearch, setClientSearch] = useState(
    order?.client?.name ?? ''
  )
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false)
  const [date, setDate] = useState(
    order?.date ?? new Date().toISOString().split('T')[0]
  )
  const [deliveryTime, setDeliveryTime] = useState<string>(order?.delivery_time ?? '')
  const [items, setItems] = useState<OrderItemFormData[]>(
    order?.order_items?.map((item) => ({
      recipe_id: item.recipe_id,
      quantity: String(item.quantity),
      price: String(item.price),
    })) ?? [{ recipe_id: '', quantity: '1', price: '' }]
  )
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (order) {
      setClientId(order.client_id ?? '')
      setClientSearch(order.client?.name ?? '')
      setDate(order.date)
      setDeliveryTime(order.delivery_time ?? '')
      setItems(
        order.order_items?.map((item) => ({
          recipe_id: item.recipe_id,
          quantity: String(item.quantity),
          price: String(item.price),
        })) ?? [{ recipe_id: '', quantity: '1', price: '' }]
      )
    } else {
      // Reset to defaults for create mode
      setClientId('')
      setClientSearch('')
      setDate(new Date().toISOString().split('T')[0])
      setDeliveryTime('')
      setItems([{ recipe_id: '', quantity: '1', price: '' }])
    }
  }, [order])

  function addItem(): void {
    setItems([...items, { recipe_id: '', quantity: '1', price: '' }])
  }

  function removeItem(index: number): void {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof OrderItemFormData, value: string): void {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'recipe_id') {
      const selectedRecipe = recipes.find((r) => r.id === value)
      if (selectedRecipe?.price != null) {
        newItems[index] = { ...newItems[index], price: String(selectedRecipe.price) }
      }
    }

    setItems(newItems)
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.price || 0),
    0
  )

  async function handleSubmit(): Promise<void> {
    setIsPending(true)
    try {
      const itemsPayload = items
        .filter((item) => item.recipe_id && item.quantity && item.price)
        .map((item) => ({
          recipe_id: item.recipe_id,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }))

      const result = order
        ? await updateOrder({
            id: order.id,
            client_id: clientId,
            date,
            delivery_time: deliveryTime || null,
            items: itemsPayload,
          })
        : await createOrder({
            client_id: clientId || undefined,
            client_name: !clientId && clientSearch.trim() ? clientSearch.trim() : undefined,
            date,
            delivery_time: deliveryTime || null,
            items: itemsPayload,
          })

      if (result.success) {
        toast.success(order ? 'Заказ обновлён' : 'Заказ создан')
        setIsOpen(false)

        if (!order) {
          setClientId('')
          setClientSearch('')
          setDeliveryTime('')
          setItems([{ recipe_id: '', quantity: '1', price: '' }])
        }
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  const dialogContent = (
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{order ? 'Редактировать заказ' : 'Новый заказ'}</DialogTitle>
      </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Клиент</Label>
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientPopoverOpen}
                  className="w-full justify-between"
                >
                  {clientId
                    ? clients.find((c) => c.id === clientId)?.name
                    : clientSearch
                    ? clientSearch
                    : 'Выберите или введите имя клиента'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Поиск клиента..."
                    value={clientSearch}
                    onValueChange={(value) => {
                      setClientSearch(value)
                      setClientId('')
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {clientSearch.trim()
                        ? `Новый клиент: "${clientSearch.trim()}"`
                        : 'Введите имя клиента'}
                    </CommandEmpty>
                    <CommandGroup>
                      {clients
                        .filter((c) =>
                          c.name.toLowerCase().includes(clientSearch.toLowerCase())
                        )
                        .map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setClientId(c.id)
                              setClientSearch(c.name)
                              setClientPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                clientId === c.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>
                Сегодня
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}>
                Завтра
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDate(format(addDays(new Date(), 2), 'yyyy-MM-dd'))}>
                Послезавтра
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Время выдачи <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-32"
              />
              {deliveryTime && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeliveryTime('')}
                >
                  Сбросить
                </Button>
              )}
            </div>
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

          <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
            {order
              ? isPending
                ? 'Сохранение...'
                : 'Сохранить'
              : isPending
                ? 'Создание...'
                : 'Создать заказ'}
          </Button>
        </div>
      </DialogContent>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!order && (
        <DialogTrigger asChild>
          <Button>Новый заказ</Button>
        </DialogTrigger>
      )}
      {dialogContent}
    </Dialog>
  )
}
