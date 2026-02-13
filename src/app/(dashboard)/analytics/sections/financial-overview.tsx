'use client'

import type { FinancialOverview } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

interface Props {
  data: FinancialOverview
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('ru-RU') + ' ₽'
}

const chartConfig = {
  revenue: {
    label: 'Доходы',
    color: 'hsl(142, 76%, 36%)',
  },
  expenses: {
    label: 'Расходы',
    color: 'hsl(0, 84%, 60%)',
  },
  profit: {
    label: 'Прибыль',
    color: 'hsl(221, 83%, 53%)',
  },
} satisfies ChartConfig

export function FinancialOverviewSection({ data }: Props) {
  // Prepare chart data
  const chartData = data.monthlyBreakdown.map((month) => ({
    month: month.monthLabel,
    revenue: month.revenue,
    expenses: month.purchaseExpenses + month.otherExpenses + month.writeOffLosses,
    profit: month.profit,
  }))

  return (
    <div className="space-y-4">
      {/* KPI Cards - Revenue, Purchases, Other Expenses, Write-off Losses */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Доходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Закупки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.purchaseExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Прочие расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(data.otherExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Потери</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.writeOffLosses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Profit, Order Count, Average Order Value */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.profit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Заказов выдано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.orderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.avgOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика по месяцам</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных за выбранный период
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value: number) => value.toLocaleString('ru-RU')}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  fill="var(--color-profit)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
