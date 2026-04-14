/**
 * Validacion de transiciones de state machine (M3).
 *
 * Cada entidad tiene un conjunto de transiciones validas.
 * Si una transicion no esta en el mapa, es invalida → 409.
 */

const COURSE_TRANSITIONS: Record<string, string[]> = {
  draft: ['poa_captured'],
  poa_captured: ['corpus_loaded'],
  corpus_loaded: ['ingestion_ready', 'ingesting'],
  ingestion_ready: ['ingesting'],
  ingesting: ['active', 'fail_review'],
  active: ['paused', 'completed'],
  fail_review: ['corpus_loaded', 'ingesting'],
  paused: ['active'],
  completed: ['archived'],
  archived: [],
}

const POA_TRANSITIONS: Record<string, string[]> = {
  empty: ['in_interview'],
  in_interview: ['captured'],
  captured: ['confirmed_by_learner'],
  confirmed_by_learner: ['updating'],
  updating: ['confirmed_by_learner'],
}

const UNIT_TRANSITIONS: Record<string, string[]> = {
  draft: ['analyzed'],
  analyzed: ['designed'],
  designed: ['audited_ok', 'audited_fail'],
  audited_ok: ['available'],
  audited_fail: ['designed'], // reprocesar
  available: ['in_session'],
  in_session: ['mastered', 'needs_review', 'available'], // available = abandoned
  mastered: [],
  needs_review: ['available'],
}

const SESSION_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['started'],
  started: ['in_progress', 'abandoned'],
  in_progress: ['evaluated', 'abandoned', 'crashed'],
  evaluated: ['closed'],
  closed: [],
  abandoned: [],
  crashed: [],
}

type EntityType = 'course' | 'poa' | 'unit' | 'session'

const MACHINES: Record<EntityType, Record<string, string[]>> = {
  course: COURSE_TRANSITIONS,
  poa: POA_TRANSITIONS,
  unit: UNIT_TRANSITIONS,
  session: SESSION_TRANSITIONS,
}

export function isValidTransition(entity: EntityType, from: string, to: string): boolean {
  const machine = MACHINES[entity]
  const allowed = machine[from]
  if (!allowed) return false
  return allowed.includes(to)
}

export function validateTransition(entity: EntityType, from: string, to: string): void {
  if (!isValidTransition(entity, from, to)) {
    throw new StateTransitionError(entity, from, to)
  }
}

export class StateTransitionError extends Error {
  public readonly status = 409

  constructor(entity: string, from: string, to: string) {
    super(`Invalid state transition for ${entity}: ${from} → ${to}`)
    this.name = 'StateTransitionError'
  }
}
