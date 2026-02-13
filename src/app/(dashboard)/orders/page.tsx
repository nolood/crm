import { getOrders } from '@/lib/actions/orders'
import { getClients } from '@/lib/actions/clients'
import { getRecipes } from '@/lib/actions/recipes'
import { OrderForm } from './order-form'
import { OrderStatus } from './order-status'
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
import type { Order, OrderItem } from '@/lib/types'

interface OrderWithRelations extends Order {
  client?: { name: string } | null
  order_items?: Array<OrderItem & {
    recipe?: { name: string } | null
  }> | null
}

export default async function OrdersPage() {
  const [orders, clients, recipes] = await Promise.all([
    getOrders(),
    getClients(),
    getRecipes(),
  ])

  // Type assertion since we know the shape from the query
  const typedOrders = orders as unknown as OrderWithRelations[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <OrderForm clients={clients} recipes={recipes} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Позиции</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет заказов
                </TableCell>
              </TableRow>
            ) : (
              typedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{format(new Date(order.date), 'd MMM yyyy', { locale: ru })}</TableCell>
                  <TableCell>{order.client?.name || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {order.order_items?.map((item) => (
                      <div key={item.id}>
                        {item.recipe?.name} x{item.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="font-medium">{order.total_price} ₽</TableCell>
                  <TableCell>
                    <OrderStatus orderId={order.id} currentStatus={order.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
