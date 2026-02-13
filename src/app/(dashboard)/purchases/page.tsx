import { getPurchases } from '@/lib/actions/purchases'
import { getIngredients } from '@/lib/actions/ingredients'
import { PurchaseForm } from './purchase-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function PurchasesPage() {
  const [purchases, ingredients] = await Promise.all([
    getPurchases(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Закупки</h1>
        <PurchaseForm ingredients={ingredients} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Ингредиент</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Цена за ед.</TableHead>
              <TableHead>Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет закупок
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{p.ingredient?.name}</TableCell>
                  <TableCell>{p.quantity} {p.ingredient?.unit}</TableCell>
                  <TableCell>{p.price_per_unit} ₽</TableCell>
                  <TableCell className="font-medium">{p.total_price} ₽</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
