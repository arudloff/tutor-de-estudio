/**
 * Tests adversariales para scripts/audit-rls.mjs
 *
 * audit-rls.mjs es codigo de enforcement: escanea migraciones SQL y verifica
 * que toda tabla de usuario tenga RLS habilitada. Un falso negativo aqui
 * permitiria que una tabla sin RLS llegue a produccion, exponiendo datos
 * del aprendiz (V002 del BoK: multi-tenancy leak).
 *
 * Por la regla "audit the auditor":
 * 1. Debe probarse que DETECTA correctamente tablas sin RLS (FAIL path)
 * 2. Debe probarse que NO produce falsos positivos en tablas exentas
 * 3. Debe probarse que no se engana con comentarios o strings que parecen RLS
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const repoRoot = process.cwd()
const scriptPath = join(repoRoot, 'scripts/audit-rls.mjs')

function runAuditIn(dir: string): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [scriptPath], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return {
      code: e.status ?? 1,
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
    }
  }
}

function setupFakeMigrations(dir: string, sqlContent: string) {
  mkdirSync(join(dir, 'lib/db/migrations'), { recursive: true })
  writeFileSync(join(dir, 'lib/db/migrations/0001_test.sql'), sqlContent)
}

describe('scripts/audit-rls.mjs (tests adversariales)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'socrates-audit-rls-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('PASS happy path: no hay migraciones', () => {
    const { code, stdout } = runAuditIn(tmpDir)
    expect(code).toBe(0)
    expect(stdout).toMatch(/PASS/)
  })

  it('PASS: tabla con RLS habilitada correctamente', () => {
    setupFakeMigrations(
      tmpDir,
      `
CREATE TABLE public.course (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL
);
ALTER TABLE public.course ENABLE ROW LEVEL SECURITY;
`
    )
    const { code, stdout } = runAuditIn(tmpDir)
    expect(code).toBe(0)
    expect(stdout).toMatch(/PASS/)
  })

  it('FAIL adversarial: tabla sin RLS habilitada', () => {
    setupFakeMigrations(
      tmpDir,
      `
CREATE TABLE public.user_data (
  id UUID PRIMARY KEY,
  content TEXT
);
-- OLVIDE habilitar RLS
`
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/user_data/)
    expect(stderr).toMatch(/RLS/)
  })

  it('FAIL adversarial: una de varias tablas sin RLS', () => {
    setupFakeMigrations(
      tmpDir,
      `
CREATE TABLE public.a (id UUID PRIMARY KEY);
ALTER TABLE public.a ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.b (id UUID PRIMARY KEY);
-- FALTA RLS en b

CREATE TABLE public.c (id UUID PRIMARY KEY);
ALTER TABLE public.c ENABLE ROW LEVEL SECURITY;
`
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/\bb\b/)
    // Debe mencionar 1 issue, no 3
    expect(stderr).toMatch(/1 tabla/)
  })

  it('PASS: tabla exenta (_migrations) sin RLS es permitida', () => {
    setupFakeMigrations(
      tmpDir,
      `
CREATE TABLE public._migrations (
  id INT PRIMARY KEY,
  name TEXT NOT NULL
);
-- _migrations esta en la lista de excepciones, no requiere RLS
`
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('PASS: tabla con CREATE TABLE IF NOT EXISTS + RLS', () => {
    setupFakeMigrations(
      tmpDir,
      `
CREATE TABLE IF NOT EXISTS public.course (id UUID PRIMARY KEY);
ALTER TABLE public.course ENABLE ROW LEVEL SECURITY;
`
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('PASS: varias migraciones todas con RLS', () => {
    mkdirSync(join(tmpDir, 'lib/db/migrations'), { recursive: true })
    writeFileSync(
      join(tmpDir, 'lib/db/migrations/0001_init.sql'),
      `CREATE TABLE public.a (id UUID);\nALTER TABLE public.a ENABLE ROW LEVEL SECURITY;`
    )
    writeFileSync(
      join(tmpDir, 'lib/db/migrations/0002_more.sql'),
      `CREATE TABLE public.b (id UUID);\nALTER TABLE public.b ENABLE ROW LEVEL SECURITY;`
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('FAIL adversarial: una migracion nueva introduce tabla sin RLS', () => {
    mkdirSync(join(tmpDir, 'lib/db/migrations'), { recursive: true })
    writeFileSync(
      join(tmpDir, 'lib/db/migrations/0001_init.sql'),
      `CREATE TABLE public.a (id UUID);\nALTER TABLE public.a ENABLE ROW LEVEL SECURITY;`
    )
    writeFileSync(
      join(tmpDir, 'lib/db/migrations/0002_bad.sql'),
      `CREATE TABLE public.leaky (id UUID, pii TEXT);`
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/0002_bad\.sql/)
    expect(stderr).toMatch(/leaky/)
  })

  it('PASS: tabla con nombre qualified distinto a public es ignorada', () => {
    // auth.users no es public — el check solo aplica a public.*
    setupFakeMigrations(
      tmpDir,
      `
-- auth.users gestionado por Supabase, no requiere ALTER desde nuestras migraciones
`
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })
})
