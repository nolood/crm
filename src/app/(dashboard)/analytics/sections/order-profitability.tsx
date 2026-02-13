'use client'

import type { OrderProfitabilityData } from '@/lib/types'
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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

interface Props {
  data: OrderProfitabilityData
}

const chartConfig = {
  revenue: {
    label: 'Выручка',
    color: 'hsl(142, 76%, 36%)',
  },
  cost: {
    label: 'Себестоимость',
    color: 'hsl(24, 100%, 50%)',
  },
}

export function OrderProfitabilitySection({ data }: Props) {
  // Show last 20 orders max on chart
  const chartData = data.orders.slice(0, 20).reverse().map((order) => ({
    label: `#${order.orderId.slice(0, 8)}`,
    revenue: order.revenue,
    cost: order.cost,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Себестоимость</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalCost.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая маржа</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.totalMargin.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя маржа %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.avgMarginPercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Маржинальность заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет выданных заказов за период
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `${(value as number).toLocaleString('ru-RU')} ₽`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cost"
                  fill="var(--color-cost)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детализация по заказам</CardTitle>
        </CardHeader>
        <CardContent>
          {data.orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет выданных заказов за период
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Состав</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                    <TableHead className="text-right">Себестоимость</TableHead>
                    <TableHead className="text-right">Маржа</TableHead>
                    <TableHead className="text-right">Маржа %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((item, index) => {
                    const isPositiveMargin = item.margin >= 0
                    const marginPercent = item.marginPercent

                    return (
                      <TableRow key={item.orderId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          {format(new Date(item.date), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell>
                          {item.clientName ?? (
                            <span className="text-muted-foreground">Без клиента</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.itemsSummary}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.revenue.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cost.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            isPositiveMargin ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.margin.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right">
                          {marginPercent >= 50 ? (
                            <span className="text-green-600 font-medium">
                              {marginPercent.toFixed(1)}%
                            </span>
                          ) : marginPercent >= 30 ? (
                            <span className="text-yellow-600 font-medium">
                              {marginPercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              {marginPercent.toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
