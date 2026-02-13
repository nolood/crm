'use client'

import { updateOrderStatus } from '@/lib/actions/orders'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready', label: 'Готов' },
  { value: 'delivered', label: 'Выдан' },
  { value: 'cancelled', label: 'Отменён' },
] as const

interface OrderStatusProps {
  orderId: string
  currentStatus: string
}

export function OrderStatus({ orderId, currentStatus }: OrderStatusProps) {
  async function handleChange(value: string): Promise<void> {
    const result = await updateOrderStatus(orderId, value)
    if (result.success) {
      toast.success('Статус обновлён')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
