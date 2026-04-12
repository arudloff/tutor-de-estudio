#!/usr/bin/env node
/**
 * db-migrate.mjs
 *
 * Ejecuta las migraciones SQL en orden contra la base Supabase configurada
 * en SUPABASE_DB_URL. Se usa tanto en desarrollo local como en CI para
 * aplicar el esquema a una DB efimera.
 *
 * En S0 este script es un stub: valida que la configuracion exista y lista
 * las migraciones disponibles sin ejecutarlas realmente (no hay DB todavia).
 * Se completa en S1 cuando Supabase este provisionado.
 */

import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'lib/db/migrations')

function main() {
  if (!existsSync(migrationsDir)) {
    // eslint-disable-next-line no-console
    console.error('[db-migrate] No existe lib/db/migrations/')
    process.exit(1)
  }

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log('[db-migrate] No hay migraciones pendientes.')
    process.exit(0)
  }

  // eslint-disable-next-line no-console
  console.log('[db-migrate] Migraciones disponibles:')
  for (const f of files) {
    // eslint-disable-next-line no-console
    console.log(`  - ${f}`)
  }

  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    // eslint-disable-next-line no-console
    console.log(
      '\n[db-migrate] SUPABASE_DB_URL no configurada. En S0 esto es esperado.'
    )
    // eslint-disable-next-line no-console
    console.log(
      'Para aplicar las migraciones en S1: configura SUPABASE_DB_URL en .env.local'
    )
    // eslint-disable-next-line no-console
    console.log(
      'o usa la CLI de supabase: `supabase db push` apuntando a tu proyecto.'
    )
    process.exit(0)
  }

  // eslint-disable-next-line no-console
  console.log(
    '\n[db-migrate] Aplicacion real contra DB pendiente de implementacion en S1.'
  )
  // eslint-disable-next-line no-console
  console.log(
    'Por ahora, aplica manualmente con: `supabase db push` o `psql $SUPABASE_DB_URL -f lib/db/migrations/0001_init.sql`'
  )
  process.exit(0)
}

main()
