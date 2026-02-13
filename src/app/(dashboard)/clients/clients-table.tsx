'use client'

import { DataTable } from '@/components/data-table/data-table'
import type { Client } from '@/lib/types'
import type { ColumnDef } from '@/components/data-table/types'

const columns: ColumnDef<Client>[] = [
  {
    key: 'name',
    header: 'Имя',
    accessor: 'name',
    searchable: true,
    sortable: true,
    className: 'font-medium',
  },
  {
    key: 'phone',
    header: 'Телефон',
    accessor: 'phone',
    searchable: true,
    cell: (row) => row.phone || '—',
  },
  {
    key: 'instagram',
    header: 'Instagram',
    accessor: 'instagram',
    searchable: true,
    cell: (row) => row.instagram || '—',
  },
  {
    key: 'notes',
    header: 'Заметки',
    accessor: 'notes',
    className: 'max-w-[200px] truncate',
    cell: (row) => row.notes || '—',
  },
]

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <DataTable
      data={clients}
      columns={columns}
      searchPlaceholder="Поиск клиента..."
      noDataMessage="Нет клиентов"
      emptyMessage="Клиенты не найдены"
      getRowId={(row) => row.id}
    />
  )
}
