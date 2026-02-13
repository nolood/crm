'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, UpdateOrderData } from '@/lib/types'

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
  client_id?: string
  client_name?: string
  date: string
  delivery_time?: string | null
  items: { recipe_id: string; quantity: number; price: number }[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (data.items.length === 0) {
    return { success: false, error: 'Укажите позиции заказа' }
  }

  let clientId: string | null = null

  // Determine client_id: use existing or create new
  if (data.client_id && data.client_id.trim() !== '') {
    clientId = data.client_id
  } else if (data.client_name && data.client_name.trim() !== '') {
    // Create new client
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: data.client_name.trim(),
      })
      .select()
      .single()

    if (clientError) return { success: false, error: clientError.message }
    clientId = newClient.id
  } else {
    return { success: false, error: 'Укажите клиента' }
  }

  const total_price = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      client_id: clientId,
      date: data.date,
      delivery_time: data.delivery_time ?? null,
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
  revalidatePath('/clients')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/orders')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}

export async function updateOrder(data: UpdateOrderData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (!data.client_id || data.items.length === 0) {
    return { success: false, error: 'Укажите клиента и добавьте хотя бы одну позицию' }
  }

  const total_price = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      client_id: data.client_id,
      date: data.date,
      delivery_time: data.delivery_time,
      total_price,
    })
    .eq('id', data.id)

  if (updateError) return { success: false, error: updateError.message }

  const { error: deleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', data.id)

  if (deleteError) return { success: false, error: deleteError.message }

  const orderItems = data.items.map((item) => ({
    order_id: data.id,
    recipe_id: item.recipe_id,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/orders')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}
