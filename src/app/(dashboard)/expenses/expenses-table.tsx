'use client'

import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import type { Expense } from '@/lib/types'
import type { ColumnDef, FilterConfig } from '@/components/data-table/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const categoryLabels: Record<string, string> = {
  advertising: 'Реклама',
  delivery: 'Доставка',
  rent: 'Аренда',
  other: 'Прочее',
}

const columns: ColumnDef<Expense>[] = [
  {
    key: 'date',
    header: 'Дата',
    accessor: 'date',
    sortable: true,
    cell: (row) => format(new Date(row.date), 'd MMM yyyy', { locale: ru }),
  },
  {
    key: 'category',
    header: 'Категория',
    accessor: 'category',
    sortable: true,
    cell: (row) => (
      <Badge variant="outline">{categoryLabels[row.category] || row.category}</Badge>
    ),
  },
  {
    key: 'description',
    header: 'Описание',
    accessor: 'description',
    searchable: true,
  },
  {
    key: 'amount',
    header: 'Сумма',
    accessor: 'amount',
    sortable: true,
    className: 'font-medium',
    cell: (row) => `${row.amount} ₽`,
  },
]

const categoryFilter: FilterConfig<Expense> = {
  columnKey: 'category',
  label: 'Категория',
  allLabel: 'Все категории',
  options: [
    { value: 'advertising', label: 'Реклама' },
    { value: 'delivery', label: 'Доставка' },
    { value: 'rent', label: 'Аренда' },
    { value: 'other', label: 'Прочее' },
  ],
}

interface ExpensesTableProps {
  expenses: Expense[]
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  return (
    <DataTable
      data={expenses}
      columns={columns}
      filters={[categoryFilter]}
      searchPlaceholder="Поиск по описанию..."
      noDataMessage="Нет расходов"
      emptyMessage="Расходы не найдены"
      getRowId={(row) => row.id}
    />
  )
}
