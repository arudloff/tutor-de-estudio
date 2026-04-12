/**
 * A5 — Adaptador / planificador (MVP-1: algoritmico, sin LLM)
 *
 * Calcula la frontera de aprendibilidad: la proxima unidad cuyas prereqs
 * estan satisfechas. Recalcula progreso y proyecta si el deadline se cumple.
 *
 * En MVP-1 esto es logica pura (no LLM). En MVP-2 se agrega FSRS y
 * reformulacion LLM del enfoque pedagogico.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/types'

type AdminClient = SupabaseClient<Database>

interface PlanResult {
  nextUnitId: string | null
  progressPct: number
  projectedFinish: string | null
  atRisk: boolean
  gapDays: number | null
}

export async function recalculatePlan(
  admin: AdminClient,
  courseId: string
): Promise<PlanResult> {
  // Obtener todas las unidades del curso con su estado
  const { data: units } = await admin
    .from('sense_unit')
    .select('id, name, state')
    .eq('course_id', courseId)

  if (!units || units.length === 0) {
    return { nextUnitId: null, progressPct: 0, projectedFinish: null, atRisk: false, gapDays: null }
  }

  const mastered = units.filter((u) => u.state === 'mastered')
  const available = units.filter((u) => u.state === 'available')
  const progressPct = (mastered.length / units.length) * 100

  // Obtener prerequisite edges
  const { data: edges } = await admin
    .from('prerequisite_edge')
    .select('from_unit, to_unit')

  const masteredIds = new Set(mastered.map((u) => u.id))

  // Encontrar la siguiente unidad: available, cuyas prereqs estan mastered
  let nextUnitId: string | null = null
  for (const unit of available) {
    const prereqs = (edges ?? []).filter((e) => e.to_unit === unit.id)
    const allPrereqsMet = prereqs.every((p) => masteredIds.has(p.from_unit))
    if (allPrereqsMet) {
      nextUnitId = unit.id
      break
    }
  }

  // Si no hay available con prereqs met, tomar el primero available
  if (!nextUnitId && available.length > 0) {
    nextUnitId = available[0]!.id
  }

  // Proyectar deadline
  const { data: course } = await admin
    .from('course')
    .select('deadline')
    .eq('id', courseId)
    .single()

  let projectedFinish: string | null = null
  let atRisk = false
  let gapDays: number | null = null

  if (course?.deadline) {
    const remaining = units.length - mastered.length
    const deadlineDate = new Date(course.deadline)
    const daysToDeadline = Math.ceil(
      (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Estimacion simplificada: 1 unidad por dia
    const daysNeeded = remaining
    projectedFinish = new Date(
      Date.now() + daysNeeded * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0] ?? null

    if (daysNeeded > daysToDeadline) {
      atRisk = true
      gapDays = daysNeeded - daysToDeadline
    }
  }

  // Persistir plan
  const { data: existingPlan } = await admin
    .from('learning_plan')
    .select('id')
    .eq('course_id', courseId)
    .maybeSingle()

  if (existingPlan) {
    await admin
      .from('learning_plan')
      .update({
        next_unit_id: nextUnitId,
        progress_pct: Math.round(progressPct * 100) / 100,
        projected_finish: projectedFinish,
        at_risk: atRisk,
        gap_days: gapDays,
        recalculated_at: new Date().toISOString(),
      })
      .eq('id', existingPlan.id)
  } else {
    await admin
      .from('learning_plan')
      .insert({
        course_id: courseId,
        next_unit_id: nextUnitId,
        progress_pct: Math.round(progressPct * 100) / 100,
        projected_finish: projectedFinish,
        at_risk: atRisk,
        gap_days: gapDays,
      })
  }

  return { nextUnitId, progressPct, projectedFinish, atRisk, gapDays }
}
