import type { ColumnDef, SortState, Accessor, FilterConfig } from './types'

export function resolveAccessor<TData>(
  accessor: Accessor<TData>,
  row: TData
): string | number | null | undefined {
  if (typeof accessor === 'function') {
    return accessor(row)
  }
  const value = row[accessor]
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  return String(value)
}

export function filterBySearch<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  query: string
): TData[] {
  if (!query.trim()) return data
  const lowerQuery = query.toLowerCase().trim()
  const searchableColumns = columns.filter((col) => col.searchable)
  if (searchableColumns.length === 0) return data

  return data.filter((row) =>
    searchableColumns.some((col) => {
      const value = resolveAccessor(col.accessor, row)
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(lowerQuery)
    })
  )
}

export function filterBySelects<TData>(
  data: TData[],
  filters: FilterConfig<TData>[],
  activeFilters: Record<string, string>
): TData[] {
  const entries = Object.entries(activeFilters).filter(([, v]) => v !== '' && v !== undefined)
  if (entries.length === 0) return data

  return data.filter((row) =>
    entries.every(([key, filterValue]) => {
      const filterDef = filters.find((f) => f.columnKey === key)
      if (filterDef?.customMatch) {
        return filterDef.customMatch(row, filterValue)
      }
      const rowValue = (row as Record<string, unknown>)[key]
      return String(rowValue) === filterValue
    })
  )
}

export function sortData<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  sortState: SortState | null
): TData[] {
  if (!sortState || sortState.direction === null) return data

  const column = columns.find((col) => col.key === sortState.key)
  if (!column) return data

  return [...data].sort((a, b) => {
    const aVal = resolveAccessor(column.accessor, a)
    const bVal = resolveAccessor(column.accessor, b)

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    let comparison: number

    // Check if both values look like dates (YYYY-MM-DD format)
    if (typeof aVal === 'string' && typeof bVal === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(aVal) && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
      comparison = new Date(aVal).getTime() - new Date(bVal).getTime()
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal), 'ru')
    }

    return sortState.direction === 'desc' ? -comparison : comparison
  })
}
