/**
 * Tests estáticos de 0006_analysis.sql — Sprint D1
 *
 * Verifica: RLS, CHECK constraints, índices, no USING(true).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const sql = readFileSync(
  join(process.cwd(), 'lib/db/migrations/0006_analysis.sql'),
  'utf-8'
)

describe('0006_analysis.sql — turn_analysis', () => {
  it('PASS: creates turn_analysis table', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS turn_analysis/)
  })

  it('PASS: has course_id FK with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/course_id\s+UUID NOT NULL REFERENCES course\(id\) ON DELETE CASCADE/)
  })

  it('PASS: has session_id FK with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/session_id\s+UUID NOT NULL REFERENCES learning_session\(id\) ON DELETE CASCADE/)
  })

  it('PASS: has message_id FK with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/message_id\s+UUID NOT NULL REFERENCES message_log\(id\) ON DELETE CASCADE/)
  })

  it('PASS: has unit_id FK with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/unit_id\s+UUID NOT NULL REFERENCES sense_unit\(id\) ON DELETE CASCADE/)
  })

  it('PASS: solo_level CHECK constraint 1-5', () => {
    expect(sql).toMatch(/solo_level\s+INT NOT NULL CHECK \(solo_level BETWEEN 1 AND 5\)/)
  })

  it('PASS: solo_label CHECK constraint with 5 valid values', () => {
    expect(sql).toMatch(/solo_label\s+TEXT NOT NULL CHECK/)
    expect(sql).toContain('prestructural')
    expect(sql).toContain('unistructural')
    expect(sql).toContain('multistructural')
    expect(sql).toContain('relational')
    expect(sql).toContain('extended_abstract')
  })

  it('PASS: has 6 Toulmin boolean columns', () => {
    expect(sql).toMatch(/toulmin_claim\s+BOOLEAN NOT NULL DEFAULT FALSE/)
    expect(sql).toMatch(/toulmin_data\s+BOOLEAN NOT NULL DEFAULT FALSE/)
    expect(sql).toMatch(/toulmin_warrant\s+BOOLEAN NOT NULL DEFAULT FALSE/)
    expect(sql).toMatch(/toulmin_backing\s+BOOLEAN NOT NULL DEFAULT FALSE/)
    expect(sql).toMatch(/toulmin_qualifier\s+BOOLEAN NOT NULL DEFAULT FALSE/)
    expect(sql).toMatch(/toulmin_rebuttal\s+BOOLEAN NOT NULL DEFAULT FALSE/)
  })

  it('PASS: has turn_number CHECK >= 1', () => {
    expect(sql).toMatch(/turn_number\s+INT\s+NOT NULL CHECK \(turn_number >= 1\)/)
  })

  it('PASS: enables RLS', () => {
    expect(sql).toMatch(/ALTER TABLE turn_analysis ENABLE ROW LEVEL SECURITY/)
  })

  it('PASS: SELECT policy filters by course ownership', () => {
    expect(sql).toContain('ON turn_analysis FOR SELECT')
    expect(sql).toMatch(/auth\.uid\(\)/)
  })

  it('PASS: INSERT policy uses WITH CHECK (TRUE) — service-only inserts', () => {
    expect(sql).toContain('ON turn_analysis FOR INSERT')
    expect(sql).toContain('WITH CHECK (TRUE)')
  })

  it('FAIL adversarial: SELECT policy does NOT use USING (true)', () => {
    // Extract the SELECT policy block (from CREATE POLICY to the next semicolon)
    const selectIdx = sql.indexOf('ON turn_analysis FOR SELECT')
    expect(selectIdx).toBeGreaterThan(-1)
    const policyBlock = sql.slice(selectIdx, sql.indexOf(';', selectIdx))
    expect(policyBlock).not.toMatch(/USING\s*\(\s*true\s*\)/i)
    expect(policyBlock).toContain('auth.uid()')
  })

  it('PASS: has indexes for session, course, unit', () => {
    expect(sql).toMatch(/CREATE INDEX idx_turn_analysis_session/)
    expect(sql).toMatch(/CREATE INDEX idx_turn_analysis_course/)
    expect(sql).toMatch(/CREATE INDEX idx_turn_analysis_unit/)
  })

  it('PASS: registers migration', () => {
    expect(sql).toMatch(/INSERT INTO _migrations \(name\) VALUES \('0006_analysis'\)/)
  })
})
