'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getExpenses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function createExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const amount = Number(formData.get('amount'))
  const date = formData.get('date') as string

  if (!category || !description || !amount || !date) {
    return { success: false, error: 'Заполните все поля' }
  }

  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    category,
    description,
    amount,
    date,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/')
  return { success: true }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/')
  return { success: true }
}
