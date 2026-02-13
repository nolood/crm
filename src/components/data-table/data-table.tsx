'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTableSortHeader } from './data-table-sort'
import { filterBySearch, filterBySelects, sortData, resolveAccessor } from './utils'
import type { DataTableProps, SortState } from './types'

export function DataTable<TData>({
  data,
  columns,
  filters = [],
  searchPlaceholder = 'Поиск...',
  emptyMessage = 'Ничего не найдено',
  noDataMessage = 'Нет данных',
  getRowId,
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortState, setSortState] = useState<SortState | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const hasSearch = columns.some((col) => col.searchable)

  const processedData = useMemo(() => {
    let result = data
    result = filterBySearch(result, columns, searchQuery)
    result = filterBySelects(result, filters, activeFilters)
    result = sortData(result, columns, sortState)
    return result
  }, [data, columns, searchQuery, activeFilters, sortState, filters])

  function handleSort(columnKey: string) {
    setSortState((prev) => {
      if (!prev || prev.key !== columnKey) return { key: columnKey, direction: 'asc' }
      if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' }
      return null
    })
  }

  function handleFilterChange(key: string, value: string) {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (value === '' || value === 'all') {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }

  const toolbarFilters = filters.map((f) => ({
    key: f.columnKey,
    label: f.label,
    allLabel: f.allLabel,
    options: f.options,
    value: activeFilters[f.columnKey] ?? 'all',
    onChange: (value: string) => handleFilterChange(f.columnKey, value),
  }))

  // Only show toolbar if there's search or filters
  const showToolbar = hasSearch || filters.length > 0

  return (
    <div>
      {showToolbar && (
        <DataTableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          hasSearch={hasSearch}
          filters={toolbarFilters}
          resultCount={processedData.length}
          totalCount={data.length}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) =>
                col.sortable ? (
                  <DataTableSortHeader
                    key={col.key}
                    label={col.header}
                    active={sortState?.key === col.key}
                    direction={sortState?.key === col.key ? sortState.direction : null}
                    onToggle={() => handleSort(col.key)}
                    className={col.headerClassName}
                  />
                ) : (
                  <TableHead key={col.key} className={col.headerClassName}>
                    {col.header}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {data.length === 0 ? noDataMessage : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : (resolveAccessor(col.accessor, row) ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
