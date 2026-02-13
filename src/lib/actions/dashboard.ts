'use server'

import { createClient } from '@/lib/supabase/server'

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

  // Low stock ingredients
  const { data: lowStock } = await supabase
    .from('ingredients')
    .select('*')
    .order('stock_qty', { ascending: true })

  return {
    expenses,
    otherExpenses: otherExpensesTotal,
    revenue,
    profit: revenue - expenses - otherExpensesTotal,
    ingredients: lowStock ?? [],
  }
}
