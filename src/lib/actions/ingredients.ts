'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getIngredients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function createIngredient(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const name = formData.get('name') as string
  const unit = formData.get('unit') as string

  if (!name || !unit) return { success: false, error: 'Заполните все поля' }

  const { error } = await supabase.from('ingredients').insert({
    user_id: user.id,
    name,
    unit,
    stock_qty: 0,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/inventory')
  return { success: true }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('ingredients').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/inventory')
  return { success: true }
}
