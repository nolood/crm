import { getIngredients } from '@/lib/actions/ingredients'
import { IngredientForm } from './ingredient-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function InventoryPage() {
  const ingredients = await getIngredients()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Склад</h1>
        <IngredientForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Единица</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Нет ингредиентов
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell>
                    {ing.stock_qty <= 0 ? (
                      <Badge variant="destructive">{ing.stock_qty}</Badge>
                    ) : ing.stock_qty < 100 ? (
                      <Badge variant="secondary">{ing.stock_qty}</Badge>
                    ) : (
                      <span>{ing.stock_qty}</span>
                    )}
                  </TableCell>
                  <TableCell>{ing.unit}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
