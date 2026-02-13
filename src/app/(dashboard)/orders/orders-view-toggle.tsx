'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrdersTable } from './orders-table'
import { OrdersKanban } from './orders-kanban'
import type { Order, Client, Recipe } from '@/lib/types'

interface OrdersViewToggleProps {
  orders: Order[]
  clients: Client[]
  recipes: Recipe[]
}

export function OrdersViewToggle({ orders, clients, recipes }: OrdersViewToggleProps) {
  return (
    <Tabs defaultValue="table">
      <TabsList>
        <TabsTrigger value="table">Таблица</TabsTrigger>
        <TabsTrigger value="kanban">Канбан</TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <OrdersTable orders={orders} clients={clients} recipes={recipes} />
      </TabsContent>
      <TabsContent value="kanban">
        <OrdersKanban orders={orders} clients={clients} recipes={recipes} />
      </TabsContent>
    </Tabs>
  )
}
