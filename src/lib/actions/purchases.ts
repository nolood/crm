'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getPurchases() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, ingredient:ingredients(name, unit)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createPurchase(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const ingredient_id = formData.get('ingredient_id') as string
  const quantity = Number(formData.get('quantity'))
  const price_per_unit = Number(formData.get('price_per_unit'))
  const date = formData.get('date') as string

  if (!ingredient_id || !quantity || !price_per_unit || !date) {
    return { success: false, error: 'Заполните все поля' }
  }

  const { error } = await supabase.rpc('create_purchase', {
    p_user_id: user.id,
    p_ingredient_id: ingredient_id,
    p_quantity: quantity,
    p_price_per_unit: price_per_unit,
    p_date: date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/purchases')
  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}
