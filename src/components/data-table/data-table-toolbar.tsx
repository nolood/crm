'use client'

import { DataTableSearch } from './data-table-search'
import { DataTableFilter } from './data-table-filter'
import type { FilterOption } from './types'

interface ToolbarFilter {
  key: string
  label: string
  allLabel: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface DataTableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  hasSearch: boolean
  filters: ToolbarFilter[]
  resultCount: number
  totalCount: number
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  hasSearch,
  filters,
  resultCount,
  totalCount,
}: DataTableToolbarProps) {
  const isFiltering = searchValue.trim() !== '' || filters.some((f) => f.value !== '' && f.value !== 'all')

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 py-4">
      {hasSearch && (
        <DataTableSearch
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      )}
      {filters.map((filter) => (
        <DataTableFilter
          key={filter.key}
          label={filter.label}
          allLabel={filter.allLabel}
          options={filter.options}
          value={filter.value}
          onChange={filter.onChange}
        />
      ))}
      {isFiltering && (
        <span className="text-sm text-muted-foreground ml-auto">
          Показано {resultCount} из {totalCount}
        </span>
      )}
    </div>
  )
}
