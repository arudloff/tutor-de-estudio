/**
 * Supabase client para Server Components y Route Handlers.
 *
 * Usa cookies de Next.js para persistir la sesion del usuario.
 * Este client opera con la anon key + RLS, NO con service role.
 *
 * Para operaciones administrativas (jobs, seed, migraciones), usar `admin.ts`.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { Database } from '@/lib/db/types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components no pueden setear cookies — ignorar silenciosamente
            // es seguro aqui porque el middleware refresca las cookies
          }
        },
      },
    }
  )
}
