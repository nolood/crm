'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { getPurchaseHistory } from '@/lib/actions/purchases'
import type { PurchaseHistory } from '@/lib/types'

interface PurchaseHistorySheetProps {
  purchaseId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseHistorySheet({
  purchaseId,
  open,
  onOpenChange,
}: PurchaseHistorySheetProps) {
  const [history, setHistory] = useState<PurchaseHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && purchaseId) {
      setLoading(true)
      getPurchaseHistory(purchaseId)
        .then((data) => {
          setHistory(data)
        })
        .catch(() => {
          setHistory([])
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (!open) {
      setHistory([])
    }
  }, [open, purchaseId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>История изменений</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-muted-foreground">Изменений не было</div>
          ) : (
            history.map((entry, index) => (
              <div key={entry.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {format(new Date(entry.changed_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Ингредиент:</span> {entry.ingredient?.name || '(удалён)'}
                    </div>
                    <div>
                      <span className="font-medium">Количество:</span> {entry.quantity}{' '}
                      {entry.ingredient?.unit || ''}
                    </div>
                    <div>
                      <span className="font-medium">Цена за единицу:</span> {entry.price_per_unit} ₽
                    </div>
                    <div>
                      <span className="font-medium">Сумма:</span> {entry.total_price} ₽
                    </div>
                    <div>
                      <span className="font-medium">Дата закупки:</span>{' '}
                      {format(new Date(entry.date), 'd MMM yyyy', { locale: ru })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
