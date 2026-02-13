import { getDashboardData } from '@/lib/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const data = await getDashboardData('month')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Расходы на закупки (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.expenses.toLocaleString('ru-RU')} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Прочие расходы (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.otherExpenses.toLocaleString('ru-RU')} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Доходы (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.revenue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Прибыль (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profit.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Остатки на складе</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ингредиент</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Единица</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.name}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
