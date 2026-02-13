import { getWriteOffs } from '@/lib/actions/write-offs'
import { getIngredients } from '@/lib/actions/ingredients'
import { WriteOffForm } from './write-off-form'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function WriteOffsPage() {
  const [writeOffs, ingredients] = await Promise.all([
    getWriteOffs(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Списания</h1>
        <WriteOffForm ingredients={ingredients} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Ингредиент</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Стоимость потери</TableHead>
              <TableHead>Примечание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {writeOffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет списаний
                </TableCell>
              </TableRow>
            ) : (
              writeOffs.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    {format(new Date(wo.date), 'd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell>{wo.ingredient?.name}</TableCell>
                  <TableCell>
                    {wo.quantity} {wo.ingredient?.unit}
                  </TableCell>
                  <TableCell>{wo.estimated_cost} ₽</TableCell>
                  <TableCell>{wo.note || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
