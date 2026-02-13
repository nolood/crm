'use client'

import type { ClientAnalyticsData } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  data: ClientAnalyticsData
}

const chartConfig = {
  revenue: {
    label: 'Выручка',
    color: 'hsl(142.1 76.2% 36.3%)',
  },
} satisfies ChartConfig

export function ClientAnalyticsSection({ data }: Props) {
  const activePercentage =
    data.totalClients > 0
      ? Math.round((data.activeClients / data.totalClients) * 100)
      : 0

  const topClientsForChart = data.clients.slice(0, 10)

  const chartData = topClientsForChart.map((client) => ({
    name:
      client.name.length > 15
        ? `${client.name.substring(0, 15)}...`
        : client.name,
    fullName: client.name,
    revenue: client.totalRevenue,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего клиентов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              С заказами %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePercentage}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Топ клиенты по выручке</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    `${value.toLocaleString('ru-RU')} ₽`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName
                        }
                        return ''
                      }}
                      formatter={(value) =>
                        `${Number(value).toLocaleString('ru-RU')} ₽`
                      }
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Нет данных о клиентах
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Подробная таблица</CardTitle>
        </CardHeader>
        <CardContent>
          {data.clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead className="text-right">Заказов</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">Средний чек</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clients.map((client, index) => (
                  <TableRow key={client.clientId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell className="text-right">
                      {client.orderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.totalRevenue.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      {client.avgOrderValue.toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Нет клиентов с заказами за период
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
