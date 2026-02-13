'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types'

export async function getRecipes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_items(*, ingredient:ingredients(name, unit))')
    .order('name')

  if (error) throw error
  return data
}

export async function getRecipe(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_items(*, ingredient:ingredients(name, unit))')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRecipe(data: {
  name: string
  output_quantity: number
  unit: string
  items: { ingredient_id: string; quantity: number }[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Не авторизован' }

  if (!data.name || data.items.length === 0) {
    return { success: false, error: 'Укажите название и ингредиенты' }
  }

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: data.name,
      output_quantity: data.output_quantity,
      unit: data.unit,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const recipeItems = data.items.map((item) => ({
    recipe_id: recipe.id,
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('recipe_items')
    .insert(recipeItems)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/recipes')
  return { success: true }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/recipes')
  return { success: true }
}
