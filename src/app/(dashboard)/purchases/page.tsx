import { getPurchases } from '@/lib/actions/purchases'
import { getIngredients } from '@/lib/actions/ingredients'
import { PurchaseForm } from './purchase-form'
import { PurchasesTable } from './purchases-table'

export default async function PurchasesPage(): Promise<React.ReactElement> {
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
      <PurchasesTable purchases={purchases} ingredients={ingredients} />
    </div>
  )
}
