import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: COOKIE_MAX_AGE,
              })
            )
          } catch {
            // Called from Server Component — ignored if middleware refreshes sessions
          }
        },
      },
    }
  )
}
