'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getProductions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('production')
    .select('*, recipe:recipes(name, unit)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createProduction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const recipe_id = formData.get('recipe_id') as string
  const quantity = Number(formData.get('quantity'))
  const date = formData.get('date') as string

  if (!recipe_id || !quantity || !date) {
    return { success: false, error: 'Заполните все поля' }
  }

  const { error } = await supabase.rpc('create_production', {
    p_user_id: user.id,
    p_recipe_id: recipe_id,
    p_quantity: quantity,
    p_date: date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/production')
  revalidatePath('/inventory')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}
