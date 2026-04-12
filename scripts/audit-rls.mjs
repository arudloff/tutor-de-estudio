#!/usr/bin/env node
/**
 * audit-rls.mjs
 *
 * Verifica estaticamente que toda migracion SQL nueva habilite RLS
 * en toda tabla `CREATE TABLE public.*`, salvo lista explicita de excepciones
 * (como la tabla `_migrations` que es metadata interna).
 *
 * Este es el check de nivel estatico. El check dinamico (conectar a DB y
 * probar RLS adversarialmente) se agrega en un sprint posterior cuando
 * tengamos DB efimera en CI.
 *
 * Ejecucion:
 *  - En CI (bloqueante)
 *  - Manualmente: `npm run audit:rls`
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'lib/db/migrations')

// Tablas que NO requieren RLS (metadata interna, sin datos de usuario)
const RLS_EXEMPT = new Set(['_migrations'])

function main() {
  let files
  try {
    files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  } catch {
    // eslint-disable-next-line no-console
    console.log('[audit-rls] PASS: no hay migraciones todavia.')
    process.exit(0)
  }

  let totalIssues = 0

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), 'utf-8')

    // Encontrar todas las tablas creadas
    const tableRegex = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+public\.(\w+)/gi
    const tables = []
    let match
    while ((match = tableRegex.exec(content)) !== null) {
      tables.push(match[1])
    }

    for (const table of tables) {
      if (RLS_EXEMPT.has(table)) continue

      const rlsPattern = new RegExp(
        `ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`,
        'i'
      )

      if (!rlsPattern.test(content)) {
        // eslint-disable-next-line no-console
        console.error(
          `[RLS] ${file}: tabla public.${table} creada SIN "ENABLE ROW LEVEL SECURITY"`
        )
        totalIssues++
      }
    }
  }

  if (totalIssues > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[audit-rls] FAIL: ${totalIssues} tabla(s) sin RLS habilitada.`
    )
    // eslint-disable-next-line no-console
    console.error(
      'Accion: agrega "ALTER TABLE public.<nombre> ENABLE ROW LEVEL SECURITY;" + policies.'
    )
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(`[audit-rls] PASS: todas las tablas tienen RLS (${files.length} migracion(es) escaneadas).`)
  process.exit(0)
}

main()
