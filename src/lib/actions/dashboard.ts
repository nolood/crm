'use server'

import { createClient } from '@/lib/supabase/server'
import type { UpcomingOrder } from '@/lib/types'

export async function getDashboardData(period: 'week' | 'month' | 'all' = 'month') {
  const supabase = await createClient()

  let dateFilter = ''
  const now = new Date()
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    dateFilter = weekAgo.toISOString().split('T')[0]
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    dateFilter = monthAgo.toISOString().split('T')[0]
  }

  // Expenses (purchases)
  let purchasesQuery = supabase.from('purchases').select('total_price')
  if (dateFilter) purchasesQuery = purchasesQuery.gte('date', dateFilter)
  const { data: purchases } = await purchasesQuery

  const expenses = purchases?.reduce((sum, p) => sum + Number(p.total_price), 0) ?? 0

  // Revenue (delivered orders)
  let ordersQuery = supabase
    .from('orders')
    .select('total_price')
    .eq('status', 'delivered')
  if (dateFilter) ordersQuery = ordersQuery.gte('date', dateFilter)
  const { data: orders } = await ordersQuery

  const revenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) ?? 0

  // Other expenses
  let expensesQuery = supabase.from('expenses').select('amount')
  if (dateFilter) expensesQuery = expensesQuery.gte('date', dateFilter)
  const { data: otherExpenses } = await expensesQuery

  const otherExpensesTotal = otherExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

  // Write-off losses
  let writeOffsQuery = supabase.from('write_offs').select('estimated_cost')
  if (dateFilter) writeOffsQuery = writeOffsQuery.gte('date', dateFilter)
  const { data: writeOffs } = await writeOffsQuery
  const writeOffLosses = writeOffs?.reduce((sum, w) => sum + Number(w.estimated_cost), 0) ?? 0

  return {
    expenses,
    otherExpenses: otherExpensesTotal,
    writeOffLosses,
    revenue,
    profit: revenue - expenses - otherExpensesTotal - writeOffLosses,
  }
}

export async function getUpcomingOrders(): Promise<UpcomingOrder[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date()
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(today.getDate() + 2)

  const todayStr = today.toISOString().split('T')[0]
  const dayAfterStr = dayAfterTomorrow.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('orders')
    .select('*, client:clients(name), order_items(*, recipe:recipes(name))')
    .gte('date', todayStr)
    .lte('date', dayAfterStr)
    .not('status', 'in', '("delivered","cancelled")')
    .order('date', { ascending: true })
    .order('delivery_time', { ascending: true, nullsFirst: false })

  if (error) return []
  return (data ?? []) as UpcomingOrder[]
}
