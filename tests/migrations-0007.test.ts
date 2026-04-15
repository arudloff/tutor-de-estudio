/**
 * Tests estáticos de 0007_learner_note.sql — Sprint D6
 *
 * Verifica: RLS (4 policies CRUD), user_id FK, indexes, no USING(true) en SELECT.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const sql = readFileSync(
  join(process.cwd(), 'lib/db/migrations/0007_learner_note.sql'),
  'utf-8'
)

describe('0007_learner_note.sql — learner_note', () => {
  it('PASS: creates learner_note table', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS learner_note/)
  })

  it('PASS: has user_id FK to auth.users with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/user_id\s+UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/)
  })

  it('PASS: has course_id FK with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/course_id\s+UUID NOT NULL REFERENCES course\(id\) ON DELETE CASCADE/)
  })

  it('PASS: content has non-empty CHECK', () => {
    expect(sql).toMatch(/CHECK \(length\(content\) > 0\)/)
  })

  it('PASS: optional FKs use ON DELETE SET NULL', () => {
    expect(sql).toMatch(/unit_id\s+UUID REFERENCES sense_unit\(id\) ON DELETE SET NULL/)
    expect(sql).toMatch(/misconception_id\s+UUID REFERENCES misconception_catalog\(id\) ON DELETE SET NULL/)
    expect(sql).toMatch(/session_id\s+UUID REFERENCES learning_session\(id\) ON DELETE SET NULL/)
    expect(sql).toMatch(/source_pdf_id\s+UUID REFERENCES pdf\(id\) ON DELETE SET NULL/)
  })

  it('PASS: has tags column as TEXT array', () => {
    expect(sql).toMatch(/tags\s+TEXT\[\] NOT NULL DEFAULT '\{\}'/)
  })

  it('PASS: enables RLS', () => {
    expect(sql).toMatch(/ALTER TABLE learner_note ENABLE ROW LEVEL SECURITY/)
  })

  it('PASS: has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)', () => {
    expect(sql).toContain('ON learner_note FOR SELECT')
    expect(sql).toContain('ON learner_note FOR INSERT')
    expect(sql).toContain('ON learner_note FOR UPDATE')
    expect(sql).toContain('ON learner_note FOR DELETE')
  })

  it('PASS: all policies filter by auth.uid()', () => {
    const uidMatches = sql.match(/auth\.uid\(\)/g) ?? []
    // At least 4 uses (SELECT, INSERT WITH CHECK, UPDATE USING + WITH CHECK, DELETE)
    expect(uidMatches.length).toBeGreaterThanOrEqual(4)
  })

  it('FAIL adversarial: SELECT policy does NOT use USING (true)', () => {
    const selectIdx = sql.indexOf('ON learner_note FOR SELECT')
    expect(selectIdx).toBeGreaterThan(-1)
    const policyBlock = sql.slice(selectIdx, sql.indexOf(';', selectIdx))
    expect(policyBlock).not.toMatch(/USING\s*\(\s*true\s*\)/i)
  })

  it('PASS: has GIN index on tags for array search', () => {
    expect(sql).toContain('idx_learner_note_tags')
    expect(sql).toContain('USING GIN(tags)')
  })

  it('PASS: has full-text search index (spanish)', () => {
    expect(sql).toContain('idx_learner_note_search')
    expect(sql).toContain("to_tsvector('spanish'")
  })

  it('PASS: has updated_at trigger', () => {
    expect(sql).toMatch(/CREATE TRIGGER set_learner_note_updated_at/)
  })

  it('PASS: has created_at and updated_at with defaults', () => {
    expect(sql).toMatch(/created_at\s+TIMESTAMPTZ NOT NULL DEFAULT now\(\)/)
    expect(sql).toMatch(/updated_at\s+TIMESTAMPTZ NOT NULL DEFAULT now\(\)/)
  })

  it('PASS: registers migration', () => {
    expect(sql).toMatch(/INSERT INTO _migrations \(name\) VALUES \('0007_learner_note'\)/)
  })
})
