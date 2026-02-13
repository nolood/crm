export const ORDER_STATUSES = [
  { value: 'new', label: 'Новый' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready', label: 'Готов' },
  { value: 'delivered', label: 'Выдан' },
  { value: 'cancelled', label: 'Отменён' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]['value']

export const ORDER_STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'secondary',
  in_progress: 'default',
  ready: 'outline',
  delivered: 'secondary',
  cancelled: 'destructive',
}
