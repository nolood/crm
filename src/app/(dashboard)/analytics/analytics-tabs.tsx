'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AnalyticsTabsProps {
  financial: React.ReactNode
  profitability: React.ReactNode
  clients: React.ReactNode
  orders: React.ReactNode
  expenses: React.ReactNode
  inventory: React.ReactNode
}

const TABS = [
  { value: 'financial', label: 'Финансы' },
  { value: 'profitability', label: 'Рентабельность' },
  { value: 'clients', label: 'Клиенты' },
  { value: 'orders', label: 'Заказы' },
  { value: 'expenses', label: 'Расходы' },
  { value: 'inventory', label: 'Склад' },
] as const

export function AnalyticsTabs(props: AnalyticsTabsProps) {
  return (
    <Tabs defaultValue="financial">
      <TabsList className="w-full justify-start overflow-x-auto">
        {TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ value }) => (
        <TabsContent key={value} value={value}>
          {props[value]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
