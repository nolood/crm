'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, client:clients(name), order_items(*, recipe:recipes(name))')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createOrder(data: {
  client_id: string
  date: string
  items: { recipe_id: string; quantity: number; price: number }[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (!data.client_id || data.items.length === 0) {
    return { success: false, error: 'Укажите клиента и позиции' }
  }

  const total_price = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      client_id: data.client_id,
      date: data.date,
      total_price,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    recipe_id: item.recipe_id,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/orders')
  revalidatePath('/')
  return { success: true }
}

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/orders')
  revalidatePath('/')
  return { success: true }
}
