'use client'

import type { InventoryAnalyticsData } from '@/lib/types'
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
import { Badge } from '@/components/ui/badge'

interface Props {
  data: InventoryAnalyticsData
}

const chartConfig = {
  stockValue: {
    label: 'Стоимость',
    color: 'hsl(221.2 83.2% 53.3%)',
  },
} satisfies ChartConfig

export function InventoryAnalyticsSection({ data }: Props) {
  const ingredientsWithValue = data.ingredients.filter(
    (item) => item.stockValue !== null && item.stockValue > 0
  )

  const topIngredientsForChart = ingredientsWithValue.slice(0, 15)

  const chartData = topIngredientsForChart.map((ingredient) => ({
    name:
      ingredient.name.length > 15
        ? `${ingredient.name.substring(0, 15)}...`
        : ingredient.name,
    fullName: ingredient.name,
    stockValue: ingredient.stockValue,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Стоимость склада
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.totalStockValue.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Мало на складе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.lowStockCount > 0 ? 'text-orange-600' : ''
              }`}
            >
              {data.lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Нет в наличии
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.outOfStockCount > 0 ? 'text-red-600' : ''
              }`}
            >
              {data.outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Стоимость по ингредиентам</CardTitle>
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
                  dataKey="stockValue"
                  fill="var(--color-stockValue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Нет данных о стоимости склада
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Полный список</CardTitle>
        </CardHeader>
        <CardContent>
          {data.ingredients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Ингредиент</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead className="text-right">Ед.</TableHead>
                  <TableHead className="text-right">Цена закупки</TableHead>
                  <TableHead className="text-right">Стоимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ingredients.map((ingredient, index) => {
                  const isOutOfStock = ingredient.stockQty <= 0
                  const isLowStock =
                    ingredient.stockQty > 0 && ingredient.stockQty < 100

                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{ingredient.name}</TableCell>
                      <TableCell
                        className={`text-right ${
                          isOutOfStock
                            ? 'text-red-600'
                            : isLowStock
                              ? 'text-orange-600'
                              : ''
                        }`}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {ingredient.stockQty.toLocaleString('ru-RU')}
                          {isOutOfStock && (
                            <Badge variant="destructive">Нет</Badge>
                          )}
                          {isLowStock && (
                            <Badge
                              variant="outline"
                              className="border-orange-600 text-orange-600"
                            >
                              Мало
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {ingredient.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {ingredient.lastPurchasePrice !== null
                          ? `${ingredient.lastPurchasePrice.toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {ingredient.stockValue !== null
                          ? `${ingredient.stockValue.toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Нет ингредиентов на складе
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
