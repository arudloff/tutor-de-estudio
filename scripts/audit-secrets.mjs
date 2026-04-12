#!/usr/bin/env node
/**
 * audit-secrets.mjs
 *
 * Escanea el repo buscando secretos hardcodeados en codigo fuente.
 *
 * Se ejecuta:
 *  - Como parte del pre-commit hook (bloquea commit si detecta un secret)
 *  - En CI (bloquea merge)
 *  - Manualmente: `npm run audit:secrets`
 *
 * Patrones detectados:
 *  - Anthropic API keys (sk-ant-...)
 *  - OpenAI API keys (sk-proj-..., sk-...)
 *  - Supabase service role keys (eyJ...)
 *  - Cualquier variable que parezca una clave JWT
 *  - Strings que empiezan con "secret:", "password:", "token:", seguidos de valor
 *
 * Excluye:
 *  - node_modules, .next, .git
 *  - .env.example (tiene placeholders explicitos)
 *  - tests/ (puede tener strings fake)
 *  - docs/ (documentacion)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = process.cwd()

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'coverage',
  'out',
  'dist',
  'build',
  '.bitacora',
])

const EXCLUDED_FILES = new Set([
  '.env.example',
  'audit-secrets.mjs', // este script
])

const EXCLUDED_PATHS = [
  'tests/',
  'docs/',
  '.yunque-dr.json',
]

// Patrones de secretos reales (NO placeholders)
const PATTERNS = [
  {
    name: 'Anthropic API key',
    regex: /sk-ant-api\d{2}-[A-Za-z0-9_-]{80,}/g,
  },
  {
    name: 'OpenAI API key',
    regex: /sk-proj-[A-Za-z0-9_-]{40,}/g,
  },
  {
    name: 'OpenAI legacy key',
    regex: /sk-[A-Za-z0-9]{48}(?![A-Za-z0-9])/g,
  },
  {
    name: 'Supabase JWT',
    regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: 'Password in quotes',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["'`][^"'`\s]{8,}["'`]/gi,
  },
  {
    name: 'Generic secret assignment',
    regex: /(?:api_?key|secret|token)\s*[:=]\s*["'`](?!YOUR-|sk-ant-YOUR|xxx|placeholder|test-)[A-Za-z0-9_-]{24,}["'`]/gi,
  },
]

/**
 * Recursivamente lista archivos que deben escanearse.
 */
function listFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue
    if (EXCLUDED_FILES.has(entry)) continue

    const full = join(dir, entry)
    const rel = relative(repoRoot, full).replace(/\\/g, '/')
    if (EXCLUDED_PATHS.some((p) => rel.startsWith(p))) continue

    const st = statSync(full)
    if (st.isDirectory()) {
      files.push(...listFiles(full))
    } else if (st.isFile()) {
      // Solo archivos de codigo / config
      if (/\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml|sql|env)$/i.test(entry)) {
        files.push(full)
      }
    }
  }
  return files
}

function scanFile(file) {
  const content = readFileSync(file, 'utf-8')
  const findings = []
  for (const { name, regex } of PATTERNS) {
    regex.lastIndex = 0
    const matches = content.match(regex)
    if (matches) {
      for (const m of matches) {
        // Enmascarar: solo mostrar primeros 8 chars del match
        const masked = m.slice(0, 8) + '...[REDACTED]'
        findings.push({ pattern: name, match: masked })
      }
    }
  }
  return findings
}

function main() {
  const files = listFiles(repoRoot)
  let totalFindings = 0

  for (const file of files) {
    const findings = scanFile(file)
    if (findings.length > 0) {
      const rel = relative(repoRoot, file).replace(/\\/g, '/')
      // eslint-disable-next-line no-console
      console.error(`[SECRET] ${rel}`)
      for (const f of findings) {
        // eslint-disable-next-line no-console
        console.error(`  - ${f.pattern}: ${f.match}`)
        totalFindings++
      }
    }
  }

  if (totalFindings > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[audit-secrets] FAIL: encontrados ${totalFindings} posibles secretos hardcodeados.`
    )
    // eslint-disable-next-line no-console
    console.error(
      'Accion: mover a .env.local (que esta en .gitignore) o revisar si es un falso positivo.'
    )
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(
    `[audit-secrets] PASS: 0 secretos hardcodeados en ${files.length} archivos escaneados.`
  )
  process.exit(0)
}

main()
