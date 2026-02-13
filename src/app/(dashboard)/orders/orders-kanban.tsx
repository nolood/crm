'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/lib/actions/orders'
import { ORDER_STATUSES } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderForm } from './order-form'
import { cn, formatOrderDate } from '@/lib/utils'
import type { Order, Client, Recipe } from '@/lib/types'

const STATUS_COLORS: Record<Order['status'], string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  ready: 'bg-green-500',
  delivered: 'bg-slate-400',
  cancelled: 'bg-red-400',
}

interface OrdersKanbanProps {
  orders: Order[]
  clients: Client[]
  recipes: Recipe[]
}

export function OrdersKanban({ orders, clients, recipes }: OrdersKanbanProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent): void {
    const order = orders.find((o) => o.id === event.active.id)
    setActiveOrder(order ?? null)
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    setActiveOrder(null)
    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as Order['status']
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === newStatus) return

    const result = await updateOrderStatus(orderId, newStatus)
    if (result.success) {
      toast.success('Статус обновлён')
    } else {
      toast.error(result.error || 'Ошибка обновления статуса')
    }
  }

  const columns = ORDER_STATUSES.map((status) => ({
    ...status,
    orders: orders.filter((o) => o.status === status.value),
  }))

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.value}
              status={col.value}
              label={col.label}
              orders={col.orders}
              onEdit={setEditingOrder}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOrder ? <KanbanCardOverlay order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>

      {editingOrder && (
        <OrderForm
          key={editingOrder.id}
          clients={clients}
          recipes={recipes}
          order={editingOrder}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingOrder(null)
          }}
        />
      )}
    </>
  )
}

interface KanbanColumnProps {
  status: Order['status']
  label: string
  orders: Order[]
  onEdit: (order: Order) => void
}

function KanbanColumn({ status, label, orders, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 flex-shrink-0 rounded-lg p-3 min-h-[200px]',
        isOver ? 'bg-muted' : 'bg-muted/50'
      )}
    >
      <div className={cn('h-[3px] rounded-full mb-3', STATUS_COLORS[status])} />
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {orders.map((order) => (
            <KanbanCard key={order.id} order={order} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
      {orders.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">Нет заказов</p>
      )}
    </div>
  )
}

interface KanbanCardProps {
  order: Order
  onEdit: (order: Order) => void
}

function KanbanCard({ order, onEdit }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{order.client?.name || '—'}</p>
              <p className="text-xs text-muted-foreground">
                {formatOrderDate(order.date, order.delivery_time)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(order)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-1">
            {order.order_items?.map((item) => (
              <div key={item.id} className="text-xs text-muted-foreground">
                {item.recipe?.name} × {item.quantity}
              </div>
            ))}
          </div>

          <div className="pt-1 border-t">
            <p className="text-sm font-medium">{order.total_price} ₽</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KanbanCardOverlay({ order }: { order: Order }) {
  return (
    <Card className="w-72 shadow-lg rotate-2">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{order.client?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {formatOrderDate(order.date, order.delivery_time)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {order.order_items?.map((item) => (
            <div key={item.id} className="text-xs text-muted-foreground">
              {item.recipe?.name} × {item.quantity}
            </div>
          ))}
        </div>

        <div className="pt-1 border-t">
          <p className="text-sm font-medium">{order.total_price} ₽</p>
        </div>
      </CardContent>
    </Card>
  )
}
