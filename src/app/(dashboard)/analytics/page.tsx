import { getFinancialOverview, getOrderProfitability, getClientAnalytics, getOrderAnalytics, getExpenseBreakdown, getInventoryAnalytics, getProductionSummary } from '@/lib/actions/analytics'
import type { AnalyticsPeriod } from '@/lib/types'
import { AnalyticsPeriodFilter } from './analytics-period-filter'
import { AnalyticsTabs } from './analytics-tabs'
import { FinancialOverviewSection } from './sections/financial-overview'
import { OrderProfitabilitySection } from './sections/order-profitability'
import { ClientAnalyticsSection } from './sections/client-analytics'
import { OrderAnalyticsSection } from './sections/order-analytics'
import { ExpenseBreakdownSection } from './sections/expense-breakdown'
import { InventoryAnalyticsSection } from './sections/inventory-analytics'

const VALID_PERIODS: AnalyticsPeriod[] = ['week', 'month', 'quarter', 'year', 'all']

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const period = (VALID_PERIODS.includes(params.period as AnalyticsPeriod)
    ? params.period
    : 'month') as AnalyticsPeriod

  const [financial, profitability, clients, orders, expenses, inventory, production] = await Promise.all([
    getFinancialOverview(period),
    getOrderProfitability(period),
    getClientAnalytics(period),
    getOrderAnalytics(period),
    getExpenseBreakdown(period),
    getInventoryAnalytics(),
    getProductionSummary(period),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <AnalyticsPeriodFilter currentPeriod={period} />
      </div>
      <AnalyticsTabs
        financial={<FinancialOverviewSection data={financial} />}
        profitability={<OrderProfitabilitySection data={profitability} />}
        clients={<ClientAnalyticsSection data={clients} />}
        orders={<OrderAnalyticsSection data={orders} />}
        expenses={<ExpenseBreakdownSection data={expenses} />}
        inventory={<InventoryAnalyticsSection data={inventory} />}
      />
    </div>
  )
}
