/**
 * Supabase admin client con service_role key.
 *
 * BYPASEA RLS completamente. Usar SOLO para:
 *   - Jobs de backend (ingestion pipeline)
 *   - Seeding y migraciones
 *   - Operaciones administrativas (crear invited_user, etc.)
 *
 * NUNCA importar este modulo en codigo que corre en el cliente,
 * en Server Components de paginas publicas, o en Route Handlers que
 * no validen autenticacion del admin primero.
 *
 * Este modulo lanza un error si se intenta importar en entorno de navegador.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/lib/db/types'

if (typeof window !== 'undefined') {
  throw new Error(
    '[supabase/admin] NUNCA debe importarse en el cliente. Usa client.ts o server.ts.'
  )
}

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createAdminClient() {
  if (cached) return cached

  cached = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return cached
}
