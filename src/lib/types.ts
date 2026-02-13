export type Ingredient = {
  id: string
  user_id: string
  name: string
  unit: string
  stock_qty: number
  created_at: string
}

export type Purchase = {
  id: string
  user_id: string
  ingredient_id: string
  quantity: number
  price_per_unit: number
  total_price: number
  date: string
  created_at: string
  ingredient?: Ingredient
}

export type PurchaseHistory = {
  id: string
  purchase_id: string
  user_id: string
  ingredient_id: string
  quantity: number
  price_per_unit: number
  total_price: number
  date: string
  changed_at: string
  ingredient?: Ingredient
}

export type Recipe = {
  id: string
  user_id: string
  name: string
  output_quantity: number
  unit: string
  price: number | null
  created_at: string
  recipe_items?: RecipeItem[]
}

export type RecipeItem = {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  ingredient?: Ingredient
}

export type Production = {
  id: string
  user_id: string
  recipe_id: string
  quantity: number
  total_cost: number
  date: string
  created_at: string
  recipe?: Recipe
  production_items?: ProductionItem[]
}

export type ProductionItem = {
  id: string
  production_id: string
  ingredient_id: string
  quantity_used: number
  ingredient?: Ingredient
}

export type Client = {
  id: string
  user_id: string
  name: string
  phone: string | null
  instagram: string | null
  notes: string | null
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  client_id: string | null
  status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  total_price: number
  date: string
  delivery_time: string | null
  created_at: string
  client?: Client
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  recipe_id: string
  quantity: number
  price: number
  recipe?: Recipe
}

export type Expense = {
  id: string
  user_id: string
  category: string
  description: string
  amount: number
  date: string
  created_at: string
}

export type WriteOff = {
  id: string
  user_id: string
  ingredient_id: string
  quantity: number
  note: string | null
  estimated_cost: number
  date: string
  created_at: string
  ingredient?: Ingredient
}

export type UpdateOrderData = {
  id: string
  client_id: string
  date: string
  delivery_time: string | null
  items: { recipe_id: string; quantity: number; price: number }[]
}

export type UpdateRecipeData = {
  id: string
  name: string
  output_quantity: number
  unit: string
  price: number | null
  items: { ingredient_id: string; quantity: number }[]
}

export type ActionResult = {
  success: boolean
  error?: string
}

export type UpcomingOrder = {
  id: string
  status: 'new' | 'in_progress' | 'ready'
  date: string
  delivery_time: string | null
  total_price: number
  client: { name: string } | null
  order_items: {
    quantity: number
    recipe: { name: string } | null
  }[]
}

// ─── Analytics Types ───

export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

export type MonthlyBreakdown = {
  month: string           // 'YYYY-MM' format
  monthLabel: string      // 'Янв', 'Фев', etc.
  revenue: number
  purchaseExpenses: number
  otherExpenses: number
  writeOffLosses: number
  profit: number
}

export type FinancialOverview = {
  revenue: number
  purchaseExpenses: number
  otherExpenses: number
  writeOffLosses: number
  profit: number
  orderCount: number
  avgOrderValue: number
  monthlyBreakdown: MonthlyBreakdown[]
}

export type OrderProfitabilityItem = {
  orderId: string
  date: string
  clientName: string | null
  revenue: number           // order.total_price
  cost: number              // sum of ingredient costs for all recipes in the order
  margin: number            // revenue - cost
  marginPercent: number     // (margin / revenue) * 100
  itemsSummary: string      // brief description of what's in the order, e.g. "Набор 12 ягод ×2, Набор 8 ягод ×1"
}

export type OrderProfitabilityData = {
  orders: OrderProfitabilityItem[]
  totalRevenue: number
  totalCost: number
  totalMargin: number
  avgMarginPercent: number
}

export type ClientAnalyticsItem = {
  clientId: string
  name: string
  totalRevenue: number
  orderCount: number
  avgOrderValue: number
}

export type ClientAnalyticsData = {
  clients: ClientAnalyticsItem[]
  totalClients: number
  activeClients: number
}

export type OrderStatusDistribution = {
  status: string
  label: string
  count: number
  total: number
  percentage: number
}

export type TopRecipeItem = {
  recipeId: string
  name: string
  quantity: number
  revenue: number
}

export type OrderAnalyticsData = {
  statusDistribution: OrderStatusDistribution[]
  totalOrders: number
  deliveredOrders: number
  avgOrderValue: number
  maxOrderValue: number
  topRecipes: TopRecipeItem[]
}

export type ExpenseCategoryItem = {
  category: string
  total: number
  count: number
  percentage: number
}

export type ExpenseBreakdownData = {
  categories: ExpenseCategoryItem[]
  totalExpenses: number
}

export type InventoryValueItem = {
  id: string
  name: string
  unit: string
  stockQty: number
  lastPurchasePrice: number | null
  stockValue: number | null
}

export type InventoryAnalyticsData = {
  totalStockValue: number
  ingredients: InventoryValueItem[]
  lowStockCount: number
  outOfStockCount: number
}

export type ProductionSummaryItem = {
  recipeId: string
  recipeName: string
  productionCount: number
  totalQuantity: number
  totalCost: number
}
