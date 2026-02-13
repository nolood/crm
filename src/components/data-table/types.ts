import { type ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export type SortState = {
  key: string
  direction: SortDirection
}

export type FilterOption = {
  value: string
  label: string
}

export type FilterConfig<TData> = {
  columnKey: string
  label: string
  allLabel: string
  options: FilterOption[]
  customMatch?: (row: TData, filterValue: string) => boolean
}

export type Accessor<TData> = (keyof TData & string) | ((row: TData) => string | number | null | undefined)

export type ColumnDef<TData> = {
  key: string
  header: string
  accessor: Accessor<TData>
  cell?: (row: TData) => ReactNode
  sortable?: boolean
  searchable?: boolean
  className?: string
  headerClassName?: string
}

export type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  filters?: FilterConfig<TData>[]
  searchPlaceholder?: string
  emptyMessage?: string
  noDataMessage?: string
  getRowId: (row: TData) => string
}
