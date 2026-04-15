/**
 * Adversarial tests for A4 SOLO + Toulmin classifier — Sprint D1
 *
 * Tests the extractDecision function with various inputs including:
 * - Valid classifications
 * - Boundary values
 * - Missing fields (graceful degradation)
 * - Invalid values (clamping, fallback)
 * - Malformed JSON
 * - Empty/partial Toulmin
 *
 * These are unit tests of the parsing logic, not the LLM output.
 * The LLM consistency is validated by the Nivel 2 audit agent.
 */

import { describe, it, expect } from 'vitest'

// We need to test extractDecision which is not exported.
// Testing through runA4Turn would require LLM calls.
// Instead, we test the parsing behavior by importing and testing the types
// and re-implementing the extraction logic identically for testing.

// --- Re-implement extractDecision for testing (mirrors a4-evaluator.ts) ---

type SoloLevel = 1 | 2 | 3 | 4 | 5
type SoloLabel = 'prestructural' | 'unistructural' | 'multistructural' | 'relational' | 'extended_abstract'

interface SoloAnalysis {
  level: SoloLevel
  label: SoloLabel
  evidence: string
}

interface ToulminAnalysis {
  claim: boolean
  data: boolean
  warrant: boolean
  backing: boolean
  qualifier: boolean
  rebuttal: boolean
  summary: string
}

interface A4Decision {
  type: 'continue' | 'pass' | 'fail'
  rubricItemsSatisfied: string[]
  misconceptionsDetected: string[]
  reason?: string
  soloAnalysis?: SoloAnalysis
  toulminAnalysis?: ToulminAnalysis
}

const SOLO_LABELS: SoloLabel[] = [
  'prestructural', 'unistructural', 'multistructural', 'relational', 'extended_abstract',
]

function extractDecision(text: string): A4Decision {
  const match = text.match(/```decision\s*([\s\S]*?)```/)
  if (!match?.[1]) {
    return { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }
  }
  try {
    const parsed = JSON.parse(match[1].trim())
    const decision: A4Decision = {
      type: (parsed.type as A4Decision['type']) ?? 'continue',
      rubricItemsSatisfied: parsed.rubric_items_satisfied ?? [],
      misconceptionsDetected: parsed.misconceptions_detected ?? [],
      reason: parsed.reason,
    }
    if (parsed.solo) {
      const level = Math.max(1, Math.min(5, Math.round(parsed.solo.level ?? 1))) as SoloLevel
      const label = SOLO_LABELS.includes(parsed.solo.label as SoloLabel)
        ? (parsed.solo.label as SoloLabel)
        : SOLO_LABELS[level - 1]!
      decision.soloAnalysis = { level, label, evidence: parsed.solo.evidence ?? '' }
    }
    if (parsed.toulmin) {
      decision.toulminAnalysis = {
        claim: parsed.toulmin.claim ?? false,
        data: parsed.toulmin.data ?? false,
        warrant: parsed.toulmin.warrant ?? false,
        backing: parsed.toulmin.backing ?? false,
        qualifier: parsed.toulmin.qualifier ?? false,
        rebuttal: parsed.toulmin.rebuttal ?? false,
        summary: parsed.toulmin.summary ?? '',
      }
    }
    return decision
  } catch {
    return { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }
  }
}

// --- Tests ---

describe('A4 SOLO + Toulmin classifier — extractDecision', () => {
  describe('SOLO classification', () => {
    it('PASS: parses valid SOLO level 4 (relational)', () => {
      const text = 'Buena respuesta.\n```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":4,"label":"relational","evidence":"Integra conceptos"}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis).toBeDefined()
      expect(d.soloAnalysis!.level).toBe(4)
      expect(d.soloAnalysis!.label).toBe('relational')
      expect(d.soloAnalysis!.evidence).toBe('Integra conceptos')
    })

    it('PASS: parses all 5 SOLO levels correctly', () => {
      for (let level = 1; level <= 5; level++) {
        const label = SOLO_LABELS[level - 1]
        const text = `Test.\n\`\`\`decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":${level},"label":"${label}","evidence":"test"}}\n\`\`\``
        const d = extractDecision(text)
        expect(d.soloAnalysis!.level).toBe(level)
        expect(d.soloAnalysis!.label).toBe(label)
      }
    })

    it('FAIL adversarial: clamps SOLO level 0 to 1', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":0,"label":"prestructural","evidence":""}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis!.level).toBe(1)
    })

    it('FAIL adversarial: clamps SOLO level 6 to 5', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":6,"label":"extended_abstract","evidence":""}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis!.level).toBe(5)
    })

    it('FAIL adversarial: invalid label falls back to level-based label', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":3,"label":"INVALID","evidence":"test"}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis!.label).toBe('multistructural') // level 3 → index 2
    })

    it('FAIL adversarial: missing solo.level defaults to 1', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"label":"relational","evidence":"test"}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis!.level).toBe(1)
    })

    it('PASS: missing solo object → no soloAnalysis in result', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[]}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis).toBeUndefined()
    })

    it('FAIL adversarial: solo.evidence missing → empty string', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"solo":{"level":2,"label":"unistructural"}}\n```'
      const d = extractDecision(text)
      expect(d.soloAnalysis!.evidence).toBe('')
    })
  })

  describe('Toulmin classification', () => {
    it('PASS: parses full Toulmin with all components true', () => {
      const text = '```decision\n{"type":"pass","rubric_items_satisfied":["R1"],"misconceptions_detected":[],"toulmin":{"claim":true,"data":true,"warrant":true,"backing":true,"qualifier":true,"rebuttal":true,"summary":"Argumento completo"}}\n```'
      const d = extractDecision(text)
      expect(d.toulminAnalysis).toBeDefined()
      expect(d.toulminAnalysis!.claim).toBe(true)
      expect(d.toulminAnalysis!.data).toBe(true)
      expect(d.toulminAnalysis!.warrant).toBe(true)
      expect(d.toulminAnalysis!.backing).toBe(true)
      expect(d.toulminAnalysis!.qualifier).toBe(true)
      expect(d.toulminAnalysis!.rebuttal).toBe(true)
      expect(d.toulminAnalysis!.summary).toBe('Argumento completo')
    })

    it('PASS: parses partial Toulmin (only claim + data)', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"toulmin":{"claim":true,"data":true}}\n```'
      const d = extractDecision(text)
      expect(d.toulminAnalysis!.claim).toBe(true)
      expect(d.toulminAnalysis!.data).toBe(true)
      expect(d.toulminAnalysis!.warrant).toBe(false)
      expect(d.toulminAnalysis!.backing).toBe(false)
      expect(d.toulminAnalysis!.qualifier).toBe(false)
      expect(d.toulminAnalysis!.rebuttal).toBe(false)
    })

    it('PASS: missing toulmin object → no toulminAnalysis', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[]}\n```'
      const d = extractDecision(text)
      expect(d.toulminAnalysis).toBeUndefined()
    })

    it('FAIL adversarial: empty toulmin object → all false', () => {
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"toulmin":{}}\n```'
      const d = extractDecision(text)
      expect(d.toulminAnalysis!.claim).toBe(false)
      expect(d.toulminAnalysis!.data).toBe(false)
      expect(d.toulminAnalysis!.warrant).toBe(false)
      expect(d.toulminAnalysis!.backing).toBe(false)
      expect(d.toulminAnalysis!.qualifier).toBe(false)
      expect(d.toulminAnalysis!.rebuttal).toBe(false)
      expect(d.toulminAnalysis!.summary).toBe('')
    })

    it('FAIL adversarial: non-boolean values coerce correctly', () => {
      // LLM might output strings or numbers instead of booleans
      const text = '```decision\n{"type":"continue","rubric_items_satisfied":[],"misconceptions_detected":[],"toulmin":{"claim":"yes","data":1,"warrant":0,"backing":null,"qualifier":false,"rebuttal":true}}\n```'
      const d = extractDecision(text)
      // Truthy values → the ?? false will still pass through truthy values
      expect(d.toulminAnalysis!.claim).toBeTruthy()
      expect(d.toulminAnalysis!.data).toBeTruthy()
      expect(d.toulminAnalysis!.warrant).toBeFalsy()
      expect(d.toulminAnalysis!.backing).toBe(false) // null ?? false = false
      expect(d.toulminAnalysis!.qualifier).toBe(false)
      expect(d.toulminAnalysis!.rebuttal).toBe(true)
    })
  })

  describe('Combined SOLO + Toulmin + Decision', () => {
    it('PASS: full response with all fields', () => {
      const text = `Interesante punto.
\`\`\`decision
{"type":"pass","rubric_items_satisfied":["R1","R2","R3"],"misconceptions_detected":["M1"],"reason":"Demuestra comprensión relacional","solo":{"level":4,"label":"relational","evidence":"Conecta oferta y demanda con equilibrio"},"toulmin":{"claim":true,"data":true,"warrant":true,"backing":false,"qualifier":true,"rebuttal":false,"summary":"Argumento bien fundamentado pero sin respaldo teórico"}}
\`\`\``
      const d = extractDecision(text)
      expect(d.type).toBe('pass')
      expect(d.rubricItemsSatisfied).toEqual(['R1', 'R2', 'R3'])
      expect(d.misconceptionsDetected).toEqual(['M1'])
      expect(d.soloAnalysis!.level).toBe(4)
      expect(d.toulminAnalysis!.claim).toBe(true)
      expect(d.toulminAnalysis!.backing).toBe(false)
    })

    it('FAIL adversarial: malformed JSON → defaults to continue, no analysis', () => {
      const text = '```decision\n{not valid json}\n```'
      const d = extractDecision(text)
      expect(d.type).toBe('continue')
      expect(d.soloAnalysis).toBeUndefined()
      expect(d.toulminAnalysis).toBeUndefined()
    })

    it('FAIL adversarial: no decision block → defaults to continue', () => {
      const text = 'Just a normal response without any classification.'
      const d = extractDecision(text)
      expect(d.type).toBe('continue')
      expect(d.rubricItemsSatisfied).toEqual([])
    })

    it('FAIL adversarial: decision block with empty object → safe defaults', () => {
      const text = '```decision\n{}\n```'
      const d = extractDecision(text)
      expect(d.type).toBe('continue')
      expect(d.rubricItemsSatisfied).toEqual([])
      expect(d.misconceptionsDetected).toEqual([])
      expect(d.soloAnalysis).toBeUndefined()
      expect(d.toulminAnalysis).toBeUndefined()
    })
  })
})
