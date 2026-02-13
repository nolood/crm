'use client'

import { useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { OrderStatus } from './order-status'
import { OrderForm } from './order-form'
import { ORDER_STATUSES } from '@/lib/constants'
import type { Order, Client, Recipe } from '@/lib/types'
import type { ColumnDef, FilterConfig } from '@/components/data-table/types'
import { formatOrderDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil } from 'lucide-react'

const createColumns = (
  onEdit: (order: Order) => void
): ColumnDef<Order>[] => [
  {
    key: 'date',
    header: 'Дата',
    accessor: 'date',
    sortable: true,
    cell: (row) => formatOrderDate(row.date, row.delivery_time),
  },
  {
    key: 'client',
    header: 'Клиент',
    accessor: (row) => row.client?.name ?? null,
    searchable: true,
    sortable: true,
    cell: (row) => row.client?.name || '—',
  },
  {
    key: 'items',
    header: 'Позиции',
    accessor: (row) =>
      row.order_items?.map((i) => i.recipe?.name).filter(Boolean).join(', ') ?? '',
    searchable: true,
    cell: (row) => (
      <div className="text-sm">
        {row.order_items?.map((item) => (
          <div key={item.id}>
            {item.recipe?.name} x{item.quantity}
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'total_price',
    header: 'Сумма',
    accessor: 'total_price',
    sortable: true,
    className: 'font-medium',
    cell: (row) => `${row.total_price} ₽`,
  },
  {
    key: 'status',
    header: 'Статус',
    accessor: 'status',
    cell: (row) => <OrderStatus orderId={row.id} currentStatus={row.status} />,
  },
  {
    key: 'actions',
    header: '',
    accessor: () => null,
    headerClassName: 'w-[50px]',
    cell: (row: Order) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

const statusFilter: FilterConfig<Order> = {
  columnKey: 'status',
  label: 'Статус',
  allLabel: 'Все статусы',
  options: ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
}

interface OrdersTableProps {
  orders: Order[]
  clients: Client[]
  recipes: Recipe[]
}

export function OrdersTable({ orders, clients, recipes }: OrdersTableProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  const columns = createColumns(setEditingOrder)

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        filters={[statusFilter]}
        searchPlaceholder="Поиск по клиенту или позиции..."
        noDataMessage="Нет заказов"
        emptyMessage="Заказы не найдены"
        getRowId={(row) => row.id}
      />
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
