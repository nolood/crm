'use server'

import { createClient } from '@/lib/supabase/server'
import { ORDER_STATUSES } from '@/lib/constants'
import type {
  AnalyticsPeriod,
  FinancialOverview,
  MonthlyBreakdown,
  OrderProfitabilityData,
  ClientAnalyticsData,
  OrderAnalyticsData,
  ExpenseBreakdownData,
  InventoryAnalyticsData,
  ProductionSummaryItem,
} from '@/lib/types'

const MONTH_LABELS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'] as const

function getDateFilter(period: AnalyticsPeriod): string | null {
  if (period === 'all') return null

  const now = new Date()
  let dateFrom: Date

  switch (period) {
    case 'week':
      dateFrom = new Date(now)
      dateFrom.setDate(now.getDate() - 7)
      break
    case 'month':
      dateFrom = new Date(now)
      dateFrom.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      dateFrom = new Date(now)
      dateFrom.setMonth(now.getMonth() - 3)
      break
    case 'year':
      dateFrom = new Date(now)
      dateFrom.setFullYear(now.getFullYear() - 1)
      break
  }

  return dateFrom.toISOString().split('T')[0]
}

export async function getFinancialOverview(period: AnalyticsPeriod): Promise<FinancialOverview> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  const [purchasesResult, ordersResult, expensesResult, writeOffsResult] = await Promise.all([
    (async () => {
      let query = supabase
        .from('purchases')
        .select('total_price')
        .eq('user_id', user.id)

      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }

      return query
    })(),
    (async () => {
      let query = supabase
        .from('orders')
        .select('total_price')
        .eq('user_id', user.id)
        .eq('status', 'delivered')

      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }

      return query
    })(),
    (async () => {
      let query = supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)

      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }

      return query
    })(),
    (async () => {
      let query = supabase
        .from('write_offs')
        .select('estimated_cost')
        .eq('user_id', user.id)

      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }

      return query
    })(),
  ])

  const purchaseExpenses = (purchasesResult.data ?? []).reduce(
    (sum, p) => sum + Number(p.total_price ?? 0),
    0
  )

  const revenue = (ordersResult.data ?? []).reduce((sum, o) => sum + Number(o.total_price ?? 0), 0)

  const otherExpenses = (expensesResult.data ?? []).reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

  const writeOffLosses = (writeOffsResult.data ?? []).reduce(
    (sum, w) => sum + Number(w.estimated_cost ?? 0),
    0
  )

  const orderCount = ordersResult.data?.length ?? 0
  const profit = revenue - purchaseExpenses - otherExpenses - writeOffLosses
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0]

  const [monthlyPurchases, monthlyOrders, monthlyExpenses, monthlyWriteOffs] = await Promise.all([
    supabase
      .from('purchases')
      .select('date, total_price')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgoStr),
    supabase
      .from('orders')
      .select('date, total_price')
      .eq('user_id', user.id)
      .eq('status', 'delivered')
      .gte('date', sixMonthsAgoStr),
    supabase.from('expenses').select('date, amount').eq('user_id', user.id).gte('date', sixMonthsAgoStr),
    supabase
      .from('write_offs')
      .select('date, estimated_cost')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgoStr),
  ])

  const monthlyMap = new Map<string, MonthlyBreakdown>()

  const addToMonth = (
    dateStr: string,
    field: 'revenue' | 'purchaseExpenses' | 'otherExpenses' | 'writeOffLosses',
    value: number
  ) => {
    const date = new Date(dateStr)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = MONTH_LABELS[date.getMonth()]

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        monthLabel,
        revenue: 0,
        purchaseExpenses: 0,
        otherExpenses: 0,
        writeOffLosses: 0,
        profit: 0,
      })
    }

    const entry = monthlyMap.get(monthKey)!
    entry[field] += value
  }

  ;(monthlyPurchases.data ?? []).forEach((p) =>
    addToMonth(p.date, 'purchaseExpenses', Number(p.total_price ?? 0))
  )
  ;(monthlyOrders.data ?? []).forEach((o) => addToMonth(o.date, 'revenue', Number(o.total_price ?? 0)))
  ;(monthlyExpenses.data ?? []).forEach((e) => addToMonth(e.date, 'otherExpenses', Number(e.amount ?? 0)))
  ;(monthlyWriteOffs.data ?? []).forEach((w) =>
    addToMonth(w.date, 'writeOffLosses', Number(w.estimated_cost ?? 0))
  )

  const monthlyBreakdown = Array.from(monthlyMap.values())
    .map((entry) => ({
      ...entry,
      profit: entry.revenue - entry.purchaseExpenses - entry.otherExpenses - entry.writeOffLosses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return {
    revenue,
    purchaseExpenses,
    otherExpenses,
    writeOffLosses,
    profit,
    orderCount,
    avgOrderValue,
    monthlyBreakdown,
  }
}

export async function getOrderProfitability(period: AnalyticsPeriod): Promise<OrderProfitabilityData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  // Fetch delivered orders with nested data
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id, total_price, date, status,
      client:clients(name),
      order_items(
        quantity,
        recipe:recipes(
          name,
          recipe_items(ingredient_id, quantity)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'delivered')
    .order('date', { ascending: false })

  if (dateFrom) {
    ordersQuery = ordersQuery.gte('date', dateFrom)
  }

  // Fetch purchases for latest prices
  const [ordersResult, purchasesResult] = await Promise.all([
    ordersQuery,
    supabase
      .from('purchases')
      .select('ingredient_id, price_per_unit, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  // Build latest price map
  const latestPriceMap = new Map<string, number>()
  ;(purchasesResult.data ?? []).forEach((p) => {
    if (!latestPriceMap.has(p.ingredient_id)) {
      latestPriceMap.set(p.ingredient_id, Number(p.price_per_unit ?? 0))
    }
  })

  // Calculate profitability for each order
  const orders = (ordersResult.data ?? []).map((order: unknown) => {
    // Type guard for the order data
    const orderData = order as {
      id: string
      total_price: number
      date: string
      status: string
      client: { name: string } | null
      order_items: {
        quantity: number
        recipe: {
          name: string
          recipe_items: {
            ingredient_id: string
            quantity: number
          }[]
        } | null
      }[]
    }

    const revenue = Number(orderData.total_price ?? 0)

    // Calculate total cost for all items in the order
    let cost = 0
    const itemDescriptions: string[] = []

    ;(orderData.order_items ?? []).forEach((orderItem) => {
      const itemQuantity = Number(orderItem.quantity ?? 0)
      const recipe = orderItem.recipe

      if (recipe && recipe.recipe_items) {
        // Add to description
        itemDescriptions.push(`${recipe.name} ×${itemQuantity}`)

        // Calculate cost for this order item
        const recipeCost = recipe.recipe_items.reduce((sum, recipeItem) => {
          const ingredientPrice = latestPriceMap.get(recipeItem.ingredient_id) ?? 0
          return sum + Number(recipeItem.quantity ?? 0) * ingredientPrice
        }, 0)

        cost += recipeCost * itemQuantity
      }
    })

    const margin = revenue - cost
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0

    let clientName: string | null = null
    if (orderData.client && typeof orderData.client === 'object' && 'name' in orderData.client) {
      clientName = String(orderData.client.name)
    }

    const itemsSummary = itemDescriptions.length > 0 ? itemDescriptions.join(', ') : 'Нет товаров'

    return {
      orderId: orderData.id,
      date: orderData.date,
      clientName,
      revenue,
      cost,
      margin,
      marginPercent,
      itemsSummary,
    }
  })

  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + order.revenue, 0)
  const totalCost = orders.reduce((sum, order) => sum + order.cost, 0)
  const totalMargin = totalRevenue - totalCost
  const avgMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

  return {
    orders,
    totalRevenue,
    totalCost,
    totalMargin,
    avgMarginPercent,
  }
}

export async function getClientAnalytics(period: AnalyticsPeriod): Promise<ClientAnalyticsData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  let ordersQuery = supabase
    .from('orders')
    .select('client_id, total_price, client:clients(name)')
    .eq('user_id', user.id)
    .eq('status', 'delivered')
    .not('client_id', 'is', null)

  if (dateFrom) {
    ordersQuery = ordersQuery.gte('date', dateFrom)
  }

  const [ordersResult, clientsResult] = await Promise.all([
    ordersQuery,
    supabase.from('clients').select('id').eq('user_id', user.id),
  ])

  const clientStatsMap = new Map<
    string,
    { name: string; totalRevenue: number; orderCount: number }
  >()

  ;(ordersResult.data ?? []).forEach((order) => {
    const clientId = order.client_id!
    let clientName = 'Unknown'

    if (order.client && typeof order.client === 'object' && 'name' in order.client) {
      clientName = String((order.client as { name: unknown }).name)
    }

    if (!clientStatsMap.has(clientId)) {
      clientStatsMap.set(clientId, { name: clientName, totalRevenue: 0, orderCount: 0 })
    }

    const stats = clientStatsMap.get(clientId)!
    stats.totalRevenue += Number(order.total_price ?? 0)
    stats.orderCount += 1
  })

  const clients = Array.from(clientStatsMap.entries())
    .map(([clientId, stats]) => ({
      clientId,
      name: stats.name,
      totalRevenue: stats.totalRevenue,
      orderCount: stats.orderCount,
      avgOrderValue: stats.totalRevenue / stats.orderCount,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalClients = clientsResult.data?.length ?? 0
  const activeClients = clientStatsMap.size

  return {
    clients,
    totalClients,
    activeClients,
  }
}

export async function getOrderAnalytics(period: AnalyticsPeriod): Promise<OrderAnalyticsData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  let ordersQuery = supabase
    .from('orders')
    .select('id, status, total_price, order_items(recipe_id, quantity, price, recipe:recipes(name))')
    .eq('user_id', user.id)

  if (dateFrom) {
    ordersQuery = ordersQuery.gte('date', dateFrom)
  }

  const ordersResult = await ordersQuery

  const orders = ordersResult.data ?? []
  const totalOrders = orders.length

  const statusMap = new Map<string, { count: number; total: number }>()
  let deliveredOrders = 0
  let totalRevenue = 0
  let maxOrderValue = 0

  const recipeStatsMap = new Map<string, { name: string; quantity: number; revenue: number }>()

  orders.forEach((order) => {
    if (!statusMap.has(order.status)) {
      statusMap.set(order.status, { count: 0, total: 0 })
    }
    const stats = statusMap.get(order.status)!
    stats.count += 1
    stats.total += Number(order.total_price ?? 0)

    if (order.status === 'delivered') {
      deliveredOrders += 1
      totalRevenue += Number(order.total_price ?? 0)
    }

    const orderValue = Number(order.total_price ?? 0)
    if (orderValue > maxOrderValue) {
      maxOrderValue = orderValue
    }

    ;(order.order_items ?? []).forEach((item) => {
      let recipeName = 'Unknown'
      if (item.recipe && typeof item.recipe === 'object' && 'name' in item.recipe) {
        recipeName = String((item.recipe as { name: unknown }).name)
      }

      if (!recipeStatsMap.has(item.recipe_id)) {
        recipeStatsMap.set(item.recipe_id, { name: recipeName, quantity: 0, revenue: 0 })
      }
      const recipeStats = recipeStatsMap.get(item.recipe_id)!
      recipeStats.quantity += Number(item.quantity ?? 0)
      recipeStats.revenue += Number(item.price ?? 0)
    })
  })

  const statusDistribution = Array.from(statusMap.entries()).map(([status, stats]) => {
    const statusLabel = ORDER_STATUSES.find((s) => s.value === status)?.label ?? status
    return {
      status,
      label: statusLabel,
      count: stats.count,
      total: stats.total,
      percentage: totalOrders > 0 ? (stats.count / totalOrders) * 100 : 0,
    }
  })

  const topRecipes = Array.from(recipeStatsMap.entries())
    .map(([recipeId, stats]) => ({
      recipeId,
      name: stats.name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0

  return {
    statusDistribution,
    totalOrders,
    deliveredOrders,
    avgOrderValue,
    maxOrderValue,
    topRecipes,
  }
}

export async function getExpenseBreakdown(period: AnalyticsPeriod): Promise<ExpenseBreakdownData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  let expensesQuery = supabase.from('expenses').select('category, amount').eq('user_id', user.id)

  if (dateFrom) {
    expensesQuery = expensesQuery.gte('date', dateFrom)
  }

  const expensesResult = await expensesQuery

  const categoryMap = new Map<string, { total: number; count: number }>()

  ;(expensesResult.data ?? []).forEach((expense) => {
    if (!categoryMap.has(expense.category)) {
      categoryMap.set(expense.category, { total: 0, count: 0 })
    }
    const stats = categoryMap.get(expense.category)!
    stats.total += Number(expense.amount ?? 0)
    stats.count += 1
  })

  const totalExpenses = Array.from(categoryMap.values()).reduce((sum, stats) => sum + stats.total, 0)

  const categories = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
      percentage: totalExpenses > 0 ? (stats.total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    categories,
    totalExpenses,
  }
}

export async function getInventoryAnalytics(): Promise<InventoryAnalyticsData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const [ingredientsResult, purchasesResult] = await Promise.all([
    supabase.from('ingredients').select('id, name, unit, stock_qty').eq('user_id', user.id),
    supabase
      .from('purchases')
      .select('ingredient_id, price_per_unit, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  const latestPriceMap = new Map<string, number>()
  ;(purchasesResult.data ?? []).forEach((p) => {
    if (!latestPriceMap.has(p.ingredient_id)) {
      latestPriceMap.set(p.ingredient_id, Number(p.price_per_unit ?? 0))
    }
  })

  let totalStockValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  const ingredients = (ingredientsResult.data ?? []).map((ingredient) => {
    const stockQty = Number(ingredient.stock_qty ?? 0)
    const lastPurchasePrice = latestPriceMap.get(ingredient.id) ?? null
    const stockValue = lastPurchasePrice !== null ? stockQty * lastPurchasePrice : null

    if (stockValue !== null) {
      totalStockValue += stockValue
    }

    if (stockQty <= 0) {
      outOfStockCount += 1
    } else if (stockQty < 100) {
      lowStockCount += 1
    }

    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      stockQty,
      lastPurchasePrice,
      stockValue,
    }
  })

  ingredients.sort((a, b) => (b.stockValue ?? 0) - (a.stockValue ?? 0))

  return {
    totalStockValue,
    ingredients,
    lowStockCount,
    outOfStockCount,
  }
}

export async function getProductionSummary(period: AnalyticsPeriod): Promise<ProductionSummaryItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const dateFrom = getDateFilter(period)

  let productionQuery = supabase
    .from('production')
    .select('recipe_id, quantity, total_cost, recipe:recipes(name)')
    .eq('user_id', user.id)

  if (dateFrom) {
    productionQuery = productionQuery.gte('date', dateFrom)
  }

  const productionResult = await productionQuery

  const recipeStatsMap = new Map<
    string,
    { recipeName: string; productionCount: number; totalQuantity: number; totalCost: number }
  >()

  ;(productionResult.data ?? []).forEach((production) => {
    let recipeName = 'Unknown'
    if (production.recipe && typeof production.recipe === 'object' && 'name' in production.recipe) {
      recipeName = String((production.recipe as { name: unknown }).name)
    }

    if (!recipeStatsMap.has(production.recipe_id)) {
      recipeStatsMap.set(production.recipe_id, {
        recipeName,
        productionCount: 0,
        totalQuantity: 0,
        totalCost: 0,
      })
    }

    const stats = recipeStatsMap.get(production.recipe_id)!
    stats.productionCount += 1
    stats.totalQuantity += Number(production.quantity ?? 0)
    stats.totalCost += Number(production.total_cost ?? 0)
  })

  const results = Array.from(recipeStatsMap.entries())
    .map(([recipeId, stats]) => ({
      recipeId,
      recipeName: stats.recipeName,
      productionCount: stats.productionCount,
      totalQuantity: stats.totalQuantity,
      totalCost: stats.totalCost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)

  return results
}
