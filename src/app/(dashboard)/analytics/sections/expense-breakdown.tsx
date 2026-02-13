'use client'

import type { ExpenseBreakdownData } from '@/lib/types'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell } from 'recharts'

interface Props {
  data: ExpenseBreakdownData
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('ru-RU') + ' ₽'
}

const CATEGORY_LABELS: Record<string, string> = {
  advertising: 'Реклама',
  delivery: 'Доставка',
  other: 'Прочее',
}

const CATEGORY_COLORS: Record<string, string> = {
  advertising: 'hsl(262, 83%, 58%)', // purple
  delivery: 'hsl(221, 83%, 53%)',    // blue
  other: 'hsl(47, 96%, 53%)',        // yellow
}

const chartConfig = {
  advertising: {
    label: 'Реклама',
    color: 'hsl(262, 83%, 58%)',
  },
  delivery: {
    label: 'Доставка',
    color: 'hsl(221, 83%, 53%)',
  },
  other: {
    label: 'Прочее',
    color: 'hsl(47, 96%, 53%)',
  },
} satisfies ChartConfig

export function ExpenseBreakdownSection({ data }: Props) {
  // Prepare chart data
  const chartData = data.categories.map((cat) => ({
    name: CATEGORY_LABELS[cat.category] || cat.category,
    value: cat.total,
    category: cat.category,
  }))

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Категорий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Расходы по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет расходов за выбранный период
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.category] || 'hsl(0, 0%, 50%)'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация</CardTitle>
        </CardHeader>
        <CardContent>
          {data.categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных за выбранный период
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Кол-во</TableHead>
                  <TableHead className="text-right">Доля %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.map((cat) => (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">
                      {CATEGORY_LABELS[cat.category] || cat.category}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.total)}
                    </TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${
                            CATEGORY_COLORS[cat.category] || 'hsl(0, 0%, 50%)'
                          }20`,
                          borderColor:
                            CATEGORY_COLORS[cat.category] || 'hsl(0, 0%, 50%)',
                        }}
                      >
                        {cat.percentage.toFixed(1)}%
                      </Badge>
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
