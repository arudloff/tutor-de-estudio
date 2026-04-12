/**
 * Tests adversariales para scripts/audit-secrets.mjs
 *
 * Este script ES codigo de enforcement — su objetivo es detectar secretos
 * hardcodeados en codigo fuente antes de que lleguen al commit. Un falso
 * negativo (secret que pasa sin detectar) es catastrofico: es la diferencia
 * entre un repo con anon key hardcodeada siendo push a GitHub o no.
 *
 * Por la regla "audit the auditor" del estandar:
 * 1. Debe haber tests adversariales (FAIL path) ademas del happy path
 * 2. Cada patron de deteccion debe tener al menos 1 test que lo ejercite
 * 3. Debe probarse que NO produce falsos positivos en:
 *    - .env.example (placeholders explicitos)
 *    - /docs/ (documentacion)
 *    - /tests/ (fixtures)
 *
 * Estos tests usan fixtures temporales en tmp/ en lugar de modificar el
 * repo real (para que audit-secrets.mjs no se autodetecte a si mismo).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Ubicacion fija del script real
const repoRoot = process.cwd()
const scriptPath = join(repoRoot, 'scripts/audit-secrets.mjs')

/**
 * Ejecuta audit-secrets.mjs en un directorio dado y devuelve
 * el exit code + stdout + stderr.
 */
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

describe('scripts/audit-secrets.mjs (tests adversariales)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'socrates-audit-secrets-'))
    // Preparar estructura minima: scripts/ con el audit-secrets copiado NO se hace
    // porque el script usa process.cwd() — lo corremos con cwd=tmpDir.
    // Pero necesita poder ENCONTRARSE A SI MISMO para no escanearse. Lo resolvemos
    // apuntando al script con su path absoluto fuera del cwd.
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('PASS happy path: no detecta nada en un repo vacio', () => {
    writeFileSync(join(tmpDir, 'README.md'), '# test\n')
    const { code, stdout } = runAuditIn(tmpDir)
    expect(code).toBe(0)
    expect(stdout).toMatch(/PASS/)
  })

  it('FAIL adversarial: detecta Anthropic API key hardcodeada en .ts', () => {
    const fakeKey =
      'sk-ant-api03-' + 'A'.repeat(90) // formato valido pero fake
    writeFileSync(
      join(tmpDir, 'bad.ts'),
      `export const key = "${fakeKey}"\n`
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/Anthropic API key/)
    // El secret debe estar enmascarado (no exponer la key completa)
    expect(stderr).not.toContain(fakeKey)
  })

  it('FAIL adversarial: detecta OpenAI API key hardcodeada en .ts', () => {
    const fakeKey = 'sk-proj-' + 'B'.repeat(50)
    writeFileSync(join(tmpDir, 'bad.ts'), `const OPENAI = "${fakeKey}"`)
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/OpenAI API key/)
  })

  it('FAIL adversarial: detecta Supabase JWT hardcodeado en .json', () => {
    // JWT con tres segmentos base64url, cada uno >=20 chars
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ' +
      '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    writeFileSync(
      join(tmpDir, 'config.json'),
      JSON.stringify({ token: fakeJwt }, null, 2)
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/Supabase JWT/)
  })

  it('FAIL adversarial: detecta password hardcodeado en .ts', () => {
    writeFileSync(
      join(tmpDir, 'bad.ts'),
      `const config = { password: "SuperSecret123" }`
    )
    const { code, stderr } = runAuditIn(tmpDir)
    expect(code).toBe(1)
    expect(stderr).toMatch(/Password/)
  })

  it('PASS: NO marca placeholders en .env.example', () => {
    // .env.example es el unico archivo .env que se escanea (los otros estan
    // en .gitignore pero audit-secrets no respeta gitignore, procesa por ruta).
    // El script debe excluir .env.example especificamente.
    writeFileSync(
      join(tmpDir, '.env.example'),
      'ANTHROPIC_API_KEY=sk-ant-YOUR-KEY\nOPENAI_API_KEY=sk-YOUR-KEY\n'
    )
    const { code, stdout } = runAuditIn(tmpDir)
    expect(code).toBe(0)
    expect(stdout).toMatch(/PASS/)
  })

  it('PASS: NO marca strings adversariales dentro de docs/', () => {
    mkdirSync(join(tmpDir, 'docs'))
    // Algo que se parece a una Anthropic key pero esta en docs
    writeFileSync(
      join(tmpDir, 'docs/ejemplo.md'),
      '# ejemplo\nPodrias ver algo como sk-ant-api03-' + 'X'.repeat(90) + '\n'
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('PASS: NO marca strings adversariales dentro de tests/', () => {
    mkdirSync(join(tmpDir, 'tests'))
    writeFileSync(
      join(tmpDir, 'tests/fake.ts'),
      'const fakeKey = "sk-ant-api03-' + 'Y'.repeat(90) + '"'
    )
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('PASS: NO se autodetecta a si mismo cuando audit-secrets.mjs esta presente', () => {
    // Copiar el propio audit-secrets.mjs al tmpDir debe seguir dando PASS
    // porque el script tiene su propio nombre en EXCLUDED_FILES.
    mkdirSync(join(tmpDir, 'scripts'))
    const originalContent = execFileSync('node', ['-e', 'process.stdout.write(require("fs").readFileSync(process.argv[1], "utf-8"))', scriptPath], {
      encoding: 'utf-8',
    })
    writeFileSync(join(tmpDir, 'scripts/audit-secrets.mjs'), originalContent)
    const { code } = runAuditIn(tmpDir)
    expect(code).toBe(0)
  })

  it('FAIL adversarial: enmascara el secret en el output (no filtra la key completa)', () => {
    const fakeKey = 'sk-ant-api03-' + 'Z'.repeat(90)
    writeFileSync(join(tmpDir, 'bad.ts'), `const k = "${fakeKey}"`)
    const { stderr } = runAuditIn(tmpDir)
    // El script debe reportar el patron matcheado pero NO exponer la clave completa
    expect(stderr).toContain('[REDACTED]')
    expect(stderr).not.toContain(fakeKey)
  })
})
