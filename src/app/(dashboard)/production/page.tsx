import { getProductions } from '@/lib/actions/production'
import { getRecipes } from '@/lib/actions/recipes'
import { getIngredients } from '@/lib/actions/ingredients'
import { ProductionForm } from './production-form'
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

export default async function ProductionPage() {
  const [productions, recipes, ingredients] = await Promise.all([
    getProductions(),
    getRecipes(),
    getIngredients(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Производство</h1>
        <ProductionForm recipes={recipes} ingredients={ingredients} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Продукт</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Себестоимость</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет записей
                </TableCell>
              </TableRow>
            ) : (
              productions.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{p.recipe?.name}</TableCell>
                  <TableCell>{p.quantity} {p.recipe?.unit}</TableCell>
                  <TableCell>{p.total_cost} ₽</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
