import { getExpenses } from '@/lib/actions/expenses'
import { ExpenseForm } from './expense-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const categoryLabels: Record<string, string> = {
  advertising: 'Реклама',
  delivery: 'Доставка',
  rent: 'Аренда',
  other: 'Прочее',
}

export default async function ExpensesPage() {
  const expenses = await getExpenses()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Прочие расходы</h1>
        <ExpenseForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Нет расходов
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense: any) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(new Date(expense.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoryLabels[expense.category] || expense.category}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="font-medium">{expense.amount} ₽</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
