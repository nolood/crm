'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { MoreHorizontal, Pencil, History } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PurchaseEditDialog } from './purchase-edit-dialog'
import { PurchaseHistorySheet } from './purchase-history-sheet'
import type { Purchase, Ingredient } from '@/lib/types'
import type { ColumnDef } from '@/components/data-table/types'

interface PurchasesTableProps {
  purchases: Purchase[]
  ingredients: Ingredient[]
}

export function PurchasesTable({ purchases, ingredients }: PurchasesTableProps) {
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [historyPurchaseId, setHistoryPurchaseId] = useState<string | null>(null)

  const columns: ColumnDef<Purchase>[] = [
    {
      key: 'date',
      header: 'Дата',
      accessor: 'date',
      sortable: true,
      cell: (row) => format(new Date(row.date), 'd MMM yyyy', { locale: ru }),
    },
    {
      key: 'ingredient',
      header: 'Ингредиент',
      accessor: (row) => row.ingredient?.name ?? null,
      searchable: true,
      sortable: true,
    },
    {
      key: 'quantity',
      header: 'Количество',
      accessor: 'quantity',
      sortable: true,
      cell: (row) => `${row.quantity} ${row.ingredient?.unit ?? ''}`,
    },
    {
      key: 'price_per_unit',
      header: 'Цена за ед.',
      accessor: 'price_per_unit',
      sortable: true,
      cell: (row) => `${row.price_per_unit} \u20BD`,
    },
    {
      key: 'total_price',
      header: 'Сумма',
      accessor: 'total_price',
      sortable: true,
      className: 'font-medium',
      cell: (row) => `${row.total_price} \u20BD`,
    },
    {
      key: 'actions',
      header: '',
      accessor: () => null,
      headerClassName: 'w-[50px]',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingPurchase(row)}>
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHistoryPurchaseId(row.id)}>
              <History className="mr-2 h-4 w-4" />
              История изменений
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <DataTable
        data={purchases}
        columns={columns}
        searchPlaceholder="Поиск по ингредиенту..."
        noDataMessage="Нет закупок"
        emptyMessage="Закупки не найдены"
        getRowId={(row) => row.id}
      />

      <PurchaseEditDialog
        key={editingPurchase?.id}
        purchase={editingPurchase}
        ingredients={ingredients}
        open={!!editingPurchase}
        onOpenChange={(open) => { if (!open) setEditingPurchase(null) }}
      />

      <PurchaseHistorySheet
        purchaseId={historyPurchaseId}
        open={!!historyPurchaseId}
        onOpenChange={(open) => { if (!open) setHistoryPurchaseId(null) }}
      />
    </>
  )
}
