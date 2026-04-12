/**
 * Supabase client para el navegador (Client Components).
 *
 * Usa solo la anon key, que respeta las policies de RLS de Postgres.
 * NUNCA importar service role key en codigo que corre en el cliente.
 */

import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/lib/db/types'

export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey
  )
}
