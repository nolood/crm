'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import type { SortDirection } from './types'

interface DataTableSortProps {
  label: string
  active: boolean
  direction: SortDirection
  onToggle: () => void
  className?: string
}

export function DataTableSortHeader({ label, active, direction, onToggle, className }: DataTableSortProps) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground -ml-1 px-1 py-0.5 rounded transition-colors"
        onClick={onToggle}
      >
        {label}
        {active && direction === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : active && direction === 'desc' ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </TableHead>
  )
}
