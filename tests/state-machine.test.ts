/**
 * Tests de state machine (M3).
 * Verifica transiciones validas e invalidas para cada entidad.
 */

import { describe, it, expect } from 'vitest'
import { isValidTransition, validateTransition, StateTransitionError } from '@/lib/utils/state-machine'

describe('state-machine', () => {
  describe('course', () => {
    it('PASS: draft → poa_captured', () => {
      expect(isValidTransition('course', 'draft', 'poa_captured')).toBe(true)
    })

    it('PASS: ingesting → active', () => {
      expect(isValidTransition('course', 'ingesting', 'active')).toBe(true)
    })

    it('FAIL adversarial: draft → ingesting (salta poa_captured)', () => {
      expect(isValidTransition('course', 'draft', 'ingesting')).toBe(false)
    })

    it('FAIL adversarial: draft → active (salta todo)', () => {
      expect(isValidTransition('course', 'draft', 'active')).toBe(false)
    })

    it('FAIL adversarial: completed → active (no se reactiva)', () => {
      expect(isValidTransition('course', 'completed', 'active')).toBe(false)
    })
  })

  describe('poa', () => {
    it('PASS: empty → in_interview', () => {
      expect(isValidTransition('poa', 'empty', 'in_interview')).toBe(true)
    })

    it('FAIL adversarial: empty → confirmed_by_learner (salta entrevista)', () => {
      expect(isValidTransition('poa', 'empty', 'confirmed_by_learner')).toBe(false)
    })
  })

  describe('unit', () => {
    it('PASS: available → in_session', () => {
      expect(isValidTransition('unit', 'available', 'in_session')).toBe(true)
    })

    it('PASS: in_session → mastered', () => {
      expect(isValidTransition('unit', 'in_session', 'mastered')).toBe(true)
    })

    it('FAIL adversarial: draft → mastered (salta todo)', () => {
      expect(isValidTransition('unit', 'draft', 'mastered')).toBe(false)
    })
  })

  describe('session', () => {
    it('PASS: started → in_progress', () => {
      expect(isValidTransition('session', 'started', 'in_progress')).toBe(true)
    })

    it('PASS: in_progress → abandoned', () => {
      expect(isValidTransition('session', 'in_progress', 'abandoned')).toBe(true)
    })

    it('FAIL adversarial: closed → started (no se reabre)', () => {
      expect(isValidTransition('session', 'closed', 'started')).toBe(false)
    })
  })

  describe('validateTransition', () => {
    it('PASS: no lanza en transicion valida', () => {
      expect(() => validateTransition('course', 'draft', 'poa_captured')).not.toThrow()
    })

    it('FAIL: lanza StateTransitionError en transicion invalida', () => {
      expect(() => validateTransition('course', 'draft', 'active')).toThrow(StateTransitionError)
    })

    it('FAIL: el error tiene status 409', () => {
      try {
        validateTransition('course', 'draft', 'active')
      } catch (e) {
        expect((e as StateTransitionError).status).toBe(409)
      }
    })
  })
})
