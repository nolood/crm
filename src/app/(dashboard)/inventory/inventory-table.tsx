'use client'

import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import type { Ingredient } from '@/lib/types'
import type { ColumnDef, FilterConfig } from '@/components/data-table/types'

const columns: ColumnDef<Ingredient>[] = [
  {
    key: 'name',
    header: 'Название',
    accessor: 'name',
    searchable: true,
    sortable: true,
    className: 'font-medium',
  },
  {
    key: 'stock_qty',
    header: 'Остаток',
    accessor: 'stock_qty',
    sortable: true,
    cell: (row) =>
      row.stock_qty <= 0 ? (
        <Badge variant="destructive">{row.stock_qty}</Badge>
      ) : row.stock_qty < 100 ? (
        <Badge variant="secondary">{row.stock_qty}</Badge>
      ) : (
        <span>{row.stock_qty}</span>
      ),
  },
  {
    key: 'unit',
    header: 'Единица',
    accessor: 'unit',
  },
]

const stockFilter: FilterConfig<Ingredient> = {
  columnKey: 'stock_qty',
  label: 'Остаток',
  allLabel: 'Все',
  options: [
    { value: 'low', label: 'Мало (< 100)' },
    { value: 'out', label: 'Нет в наличии' },
  ],
  customMatch: (row, filterValue) => {
    if (filterValue === 'out') return row.stock_qty <= 0
    if (filterValue === 'low') return row.stock_qty > 0 && row.stock_qty < 100
    return true
  },
}

interface InventoryTableProps {
  ingredients: Ingredient[]
}

export function InventoryTable({ ingredients }: InventoryTableProps) {
  return (
    <DataTable
      data={ingredients}
      columns={columns}
      filters={[stockFilter]}
      searchPlaceholder="Поиск ингредиента..."
      noDataMessage="Нет ингредиентов"
      emptyMessage="Ингредиенты не найдены"
      getRowId={(row) => row.id}
    />
  )
}
