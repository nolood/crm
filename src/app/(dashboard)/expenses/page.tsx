import { getExpenses } from '@/lib/actions/expenses'
import { ExpenseForm } from './expense-form'
import { ExpensesTable } from './expenses-table'

export default async function ExpensesPage() {
  const expenses = await getExpenses()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Прочие расходы</h1>
        <ExpenseForm />
      </div>

      <ExpensesTable expenses={expenses} />
    </div>
  )
}
