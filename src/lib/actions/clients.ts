'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult, Client } from '@/lib/types'

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function createClientAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string || null
  const instagram = formData.get('instagram') as string || null
  const notes = formData.get('notes') as string || null

  if (!name) return { success: false, error: 'Укажите имя клиента' }

  const { error } = await supabase.from('clients').insert({
    user_id: user.id,
    name,
    phone,
    instagram,
    notes,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/clients')
  return { success: true }
}
