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

export type Recipe = {
  id: string
  user_id: string
  name: string
  output_quantity: number
  unit: string
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

export type ActionResult = {
  success: boolean
  error?: string
}
