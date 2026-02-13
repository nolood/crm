'use client'

import { DataTable } from '@/components/data-table/data-table'
import type { Production } from '@/lib/types'
import type { ColumnDef } from '@/components/data-table/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const columns: ColumnDef<Production>[] = [
  {
    key: 'date',
    header: 'Дата',
    accessor: 'date',
    sortable: true,
    cell: (row) => format(new Date(row.date), 'd MMM yyyy', { locale: ru }),
  },
  {
    key: 'recipe',
    header: 'Продукт',
    accessor: (row) => row.recipe?.name ?? null,
    searchable: true,
    sortable: true,
    cell: (row) => row.recipe?.name || '—',
  },
  {
    key: 'quantity',
    header: 'Количество',
    accessor: 'quantity',
    sortable: true,
    cell: (row) => `${row.quantity} ${row.recipe?.unit ?? ''}`,
  },
  {
    key: 'total_cost',
    header: 'Себестоимость',
    accessor: 'total_cost',
    sortable: true,
    className: 'font-medium',
    cell: (row) => `${row.total_cost} ₽`,
  },
]

interface ProductionTableProps {
  productions: Production[]
}

export function ProductionTable({ productions }: ProductionTableProps) {
  return (
    <DataTable
      data={productions}
      columns={columns}
      filters={[]}
      searchPlaceholder="Поиск по продукту..."
      noDataMessage="Нет записей"
      emptyMessage="Записи не найдены"
      getRowId={(row) => row.id}
    />
  )
}
