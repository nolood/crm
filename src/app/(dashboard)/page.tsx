import { getDashboardData, getUpcomingOrders } from '@/lib/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES, ORDER_STATUS_BADGE_VARIANT } from '@/lib/constants'
import Link from 'next/link'
import { ClipboardList, ShoppingCart, Receipt, Trash2 } from 'lucide-react'
import { formatOrderDate } from '@/lib/utils'

export default async function DashboardPage() {
  const [data, upcomingOrders] = await Promise.all([
    getDashboardData('month'),
    getUpcomingOrders(),
  ])

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
              Потери (месяц)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.writeOffLosses.toLocaleString('ru-RU')} ₽</div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
          <Link href="/orders">
            <ClipboardList className="h-5 w-5" />
            <span>Новый заказ</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
          <Link href="/purchases">
            <ShoppingCart className="h-5 w-5" />
            <span>Добавить закупку</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
          <Link href="/expenses">
            <Receipt className="h-5 w-5" />
            <span>Добавить расход</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
          <Link href="/write-offs">
            <Trash2 className="h-5 w-5" />
            <span>Добавить списание</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ближайшие заказы</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет заказов на ближайшие дни</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const today = new Date().toISOString().split('T')[0]
                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
                const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]

                const days = [
                  { date: today, label: 'Сегодня' },
                  { date: tomorrow, label: 'Завтра' },
                  { date: dayAfter, label: 'Послезавтра' },
                ]

                return days.map(({ date, label }) => {
                  const dayOrders = upcomingOrders.filter(order => order.date === date)
                  return (
                    <div key={date}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">{label}</h3>
                      {dayOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Нет заказов</p>
                      ) : (
                        <div className="space-y-3">
                          {dayOrders.map((order) => {
                            const statusLabel = ORDER_STATUSES.find(s => s.value === order.status)?.label ?? order.status
                            const badgeVariant = ORDER_STATUS_BADGE_VARIANT[order.status] ?? 'secondary'
                            const itemsSummary = order.order_items
                              .map(item => `${item.recipe?.name ?? '?'} x${item.quantity}`)
                              .join(', ')

                            return (
                              <div key={order.id} className="rounded-lg border p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {order.client?.name ?? 'Без клиента'}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{itemsSummary}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <Badge variant={badgeVariant}>{statusLabel}</Badge>
                                    {order.delivery_time && (
                                      <span className="text-xs font-medium">{order.delivery_time}</span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm font-semibold">{order.total_price.toLocaleString('ru-RU')} ₽</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
