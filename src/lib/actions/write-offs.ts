'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getWriteOffs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('write_offs')
    .select('*, ingredient:ingredients(name, unit)')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createWriteOff(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const ingredient_id = formData.get('ingredient_id') as string
  const quantity = Number(formData.get('quantity'))
  const note = (formData.get('note') as string) || null
  const date = formData.get('date') as string

  if (!ingredient_id || !quantity || !date) {
    return { success: false, error: 'Заполните все обязательные поля' }
  }

  const { error } = await supabase.rpc('create_write_off', {
    p_user_id: user.id,
    p_ingredient_id: ingredient_id,
    p_quantity: quantity,
    p_note: note,
    p_date: date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/write-offs')
  revalidatePath('/inventory')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}

export async function deleteWriteOff(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const { error } = await supabase.rpc('delete_write_off', {
    p_write_off_id: id,
    p_user_id: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/write-offs')
  revalidatePath('/inventory')
  revalidatePath('/analytics')
  revalidatePath('/')
  return { success: true }
}
