'use client'

import { DataTable } from '@/components/data-table/data-table'
import { OrderStatus } from './order-status'
import type { Order } from '@/lib/types'
import type { ColumnDef, FilterConfig } from '@/components/data-table/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const columns: ColumnDef<Order>[] = [
  {
    key: 'date',
    header: 'Дата',
    accessor: 'date',
    sortable: true,
    cell: (row) => format(new Date(row.date), 'd MMM yyyy', { locale: ru }),
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
]

const statusFilter: FilterConfig<Order> = {
  columnKey: 'status',
  label: 'Статус',
  allLabel: 'Все статусы',
  options: [
    { value: 'new', label: 'Новый' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'ready', label: 'Готов' },
    { value: 'delivered', label: 'Выдан' },
    { value: 'cancelled', label: 'Отменён' },
  ],
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <DataTable
      data={orders}
      columns={columns}
      filters={[statusFilter]}
      searchPlaceholder="Поиск по клиенту или позиции..."
      noDataMessage="Нет заказов"
      emptyMessage="Заказы не найдены"
      getRowId={(row) => row.id}
    />
  )
}
