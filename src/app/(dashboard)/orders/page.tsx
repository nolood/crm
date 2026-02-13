import { getOrders } from '@/lib/actions/orders'
import { getClients } from '@/lib/actions/clients'
import { getRecipes } from '@/lib/actions/recipes'
import { OrderForm } from './order-form'
import { OrdersViewToggle } from './orders-view-toggle'
export default async function OrdersPage() {
  const [orders, clients, recipes] = await Promise.all([
    getOrders(),
    getClients(),
    getRecipes(),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <OrderForm clients={clients} recipes={recipes} />
      </div>

      <OrdersViewToggle orders={orders} clients={clients} recipes={recipes} />
    </div>
  )
}
