'use client'

import type { OrderAnalyticsData } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

interface Props {
  data: OrderAnalyticsData
}

const STATUS_COLORS: Record<string, string> = {
  new: 'hsl(221, 83%, 53%)',
  in_progress: 'hsl(47, 96%, 53%)',
  ready: 'hsl(262, 83%, 58%)',
  delivered: 'hsl(142, 76%, 36%)',
  cancelled: 'hsl(0, 84%, 60%)',
}

const pieChartConfig = {
  count: {
    label: 'Количество',
  },
}

const barChartConfig = {
  count: {
    label: 'Заказов',
    color: 'hsl(221, 83%, 53%)',
  },
}

export function OrderAnalyticsSection({ data }: Props) {
  const pieData = data.statusDistribution.map((item) => ({
    name: item.label,
    value: item.count,
    color: STATUS_COLORS[item.status] ?? 'hsl(0, 0%, 50%)',
    status: item.status,
    percentage: item.percentage,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего заказов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выданных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.deliveredOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Средний чек
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.avgOrderValue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Макс. чек
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.maxOrderValue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статусы заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {data.totalOrders === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет заказов за выбранный период
            </div>
          ) : (
            <div className="space-y-6">
              <ChartContainer config={pieChartConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) =>
                          `${name as string}: ${value as number} (${(item as { payload: { percentage: number } }).payload.percentage.toFixed(1)}%)`
                        }
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: { name: string; percentage: number }) =>
                      `${entry.name}: ${entry.percentage.toFixed(1)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.statusDistribution.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center gap-2 border rounded-lg p-3"
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: STATUS_COLORS[item.status] ?? 'hsl(0, 0%, 50%)',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Популярные рецепты</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topRecipes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет заказов с рецептами
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Рецепт</TableHead>
                  <TableHead className="text-right">Заказано шт.</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topRecipes.slice(0, 10).map((item, index) => (
                  <TableRow key={item.recipeId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.revenue.toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
