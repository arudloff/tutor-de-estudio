/**
 * Tests estaticos de las migraciones SQL.
 *
 * No conectan a una DB real (eso se valida en CI contra una Postgres efímera
 * en sprints posteriores). Aqui solo verificamos propiedades del DDL:
 *  - Toda tabla con datos de usuario tiene RLS habilitada
 *  - Toda FK a auth.users tiene ON DELETE CASCADE (delete account = delete data)
 *  - No hay CHECK constraints laxos
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'lib/db/migrations')
const migration0001 = readFileSync(join(migrationsDir, '0001_init.sql'), 'utf-8')

describe('lib/db/migrations/0001_init.sql (tests estaticos)', () => {
  it('PASS: habilita RLS en invited_users', () => {
    expect(migration0001).toMatch(
      /ALTER TABLE public\.invited_users ENABLE ROW LEVEL SECURITY/
    )
  })

  it('PASS: habilita RLS en course', () => {
    expect(migration0001).toMatch(
      /ALTER TABLE public\.course ENABLE ROW LEVEL SECURITY/
    )
  })

  it('PASS: course.user_id referencia auth.users con ON DELETE CASCADE', () => {
    // Regla D9: delete account = delete data. Sin CASCADE, quedan huerfanos.
    expect(migration0001).toMatch(
      /user_id\s+UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/
    )
  })

  it('PASS: invited_users bloquea acceso directo desde clientes (anon y authenticated)', () => {
    // La whitelist solo debe ser leible por el backend con service_role
    expect(migration0001).toMatch(/invited_users_no_client_access/)
    expect(migration0001).toMatch(/USING \(false\)/)
  })

  it('PASS: course tiene CHECK constraint sobre state', () => {
    expect(migration0001).toMatch(/course_state_valid/)
    expect(migration0001).toMatch(/state IN \(/)
  })

  it('PASS: course tiene CHECK que fuerza deadline futuro', () => {
    expect(migration0001).toMatch(/course_deadline_future/)
    expect(migration0001).toMatch(/deadline > CURRENT_DATE/)
  })

  it('PASS: course tiene 4 policies (SELECT, INSERT, UPDATE, DELETE) filtradas por user_id', () => {
    expect(migration0001).toMatch(/course_select_own/)
    expect(migration0001).toMatch(/course_insert_own/)
    expect(migration0001).toMatch(/course_update_own/)
    expect(migration0001).toMatch(/course_delete_own/)
    // Cada policy debe filtrar por auth.uid()
    const policyMatches = migration0001.match(/auth\.uid\(\)/g) ?? []
    expect(policyMatches.length).toBeGreaterThanOrEqual(4)
  })

  it('PASS: tiene trigger de updated_at en course', () => {
    expect(migration0001).toMatch(/course_set_updated_at/)
    expect(migration0001).toMatch(/BEFORE UPDATE ON public\.course/)
  })

  it('FAIL adversarial: NO existe ninguna policy USING (true) en tablas con datos de usuario', () => {
    // Una policy USING (true) seria el anti-patron mas comun: hace RLS inutil.
    // Este test falla si alguien introduce una asi por descuido.
    const dangerousPatterns = [
      /CREATE POLICY[^;]+ON public\.course[^;]+USING \(true\)/,
      /CREATE POLICY[^;]+ON public\.course[^;]+WITH CHECK \(true\)/,
    ]
    for (const pattern of dangerousPatterns) {
      expect(migration0001).not.toMatch(pattern)
    }
  })

  it('PASS: registra la migracion en _migrations', () => {
    expect(migration0001).toMatch(/INSERT INTO public\._migrations/)
    expect(migration0001).toMatch(/\(1, '0001_init'\)/)
  })
})
