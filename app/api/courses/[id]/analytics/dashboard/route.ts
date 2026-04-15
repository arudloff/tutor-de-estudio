/**
 * GET /api/courses/:id/analytics/dashboard
 *
 * D2: Consolidated analytics endpoint — blocks 1, 2, 5.
 *
 * Block 1 — Progress vs deadline: velocity, projection, at_risk alert
 * Block 2 — IBC (Índice de Brecha Cognitiva): normalized 0-1
 * Block 5 — Convergence + ZDP: turns to accreditation, difficulty calibration
 *
 * Always filters by course_id + user_id (defense-in-depth for scalability).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: course } = await supabase
    .from('course')
    .select('id, name, deadline, state, created_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const admin = createAdminClient()

  // Parallel queries for all blocks — all filtered by course_id (defense-in-depth)
  const [unitsRes, sessionsRes, planRes, analysesRes] = await Promise.all([
    admin.from('sense_unit').select('id, name, state').eq('course_id', params.id),
    admin.from('learning_session').select('id, unit_id, state, started_at, closed_at').eq('course_id', params.id),
    admin.from('learning_plan').select('next_unit_id, progress_pct, projected_finish, at_risk, gap_days')
      .eq('course_id', params.id).maybeSingle(),
    admin.from('turn_analysis').select('session_id, solo_level, created_at')
      .eq('course_id', params.id).order('created_at', { ascending: true }),
  ])

  const units = unitsRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const plan = planRes.data

  // ===== BLOCK 1: Progress vs Deadline =====
  const totalUnits = units.length
  const masteredCount = units.filter((u) => u.state === 'mastered').length
  const progressPct = totalUnits > 0 ? Math.round((masteredCount / totalUnits) * 100 * 100) / 100 : 0

  const deadlineDate = new Date(course.deadline)
  const createdDate = new Date(course.created_at)
  const now = new Date()
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Velocity: units mastered per day
  const velocity = masteredCount / daysElapsed
  const unitsRemaining = totalUnits - masteredCount

  // Projected days to finish at current velocity
  const projectedDaysToFinish = velocity > 0 ? Math.ceil(unitsRemaining / velocity) : null
  const projectedFinishDate = projectedDaysToFinish !== null
    ? new Date(now.getTime() + projectedDaysToFinish * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  // Required velocity to finish on time
  const requiredVelocity = daysRemaining > 0 ? unitsRemaining / daysRemaining : Infinity
  const atRisk = velocity > 0 ? velocity < requiredVelocity : daysRemaining <= 0 && unitsRemaining > 0

  const block1 = {
    progress_pct: progressPct,
    mastered_count: masteredCount,
    total_units: totalUnits,
    days_remaining: daysRemaining,
    days_elapsed: daysElapsed,
    total_days: totalDays,
    velocity: Math.round(velocity * 100) / 100,
    required_velocity: requiredVelocity === Infinity ? null : Math.round(requiredVelocity * 100) / 100,
    projected_finish: projectedFinishDate,
    at_risk: atRisk || (plan?.at_risk ?? false),
    gap_days: plan?.gap_days ?? null,
  }

  // ===== BLOCK 2: IBC (Índice de Brecha Cognitiva) =====
  // IBC = 1 - (average SOLO level across all turns / 5)
  // 0 = no gap (all extended_abstract), 1 = maximum gap (all prestructural)
  const analyses = analysesRes.data ?? []
  const avgSoloLevel = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + a.solo_level, 0) / analyses.length
    : 1 // Default to prestructural if no data
  const ibc = Math.round((1 - (avgSoloLevel - 1) / 4) * 100) / 100 // Normalize 1-5 to 0-1

  // IBC per unit (for granular view)
  const ibcByUnit: { unit_id: string; unit_name: string; avg_solo: number; ibc: number; turns: number }[] = []
  const analysesByUnit = new Map<string, number[]>()
  for (const a of analyses) {
    const sessionMatch = sessions.find((s) => s.id === a.session_id)
    if (sessionMatch) {
      const unitId = sessionMatch.unit_id
      if (!analysesByUnit.has(unitId)) analysesByUnit.set(unitId, [])
      analysesByUnit.get(unitId)!.push(a.solo_level)
    }
  }
  for (const [unitId, levels] of analysesByUnit.entries()) {
    const unit = units.find((u) => u.id === unitId)
    const avg = levels.reduce((s, l) => s + l, 0) / levels.length
    ibcByUnit.push({
      unit_id: unitId,
      unit_name: unit?.name ?? 'Unknown',
      avg_solo: Math.round(avg * 100) / 100,
      ibc: Math.round((1 - (avg - 1) / 4) * 100) / 100,
      turns: levels.length,
    })
  }

  const block2 = {
    ibc_global: ibc,
    avg_solo_level: Math.round(avgSoloLevel * 100) / 100,
    total_analyzed_turns: analyses.length,
    ibc_by_unit: ibcByUnit,
    interpretation: ibc > 0.7
      ? 'Brecha cognitiva alta — el aprendiz opera mayormente en niveles superficiales.'
      : ibc > 0.4
        ? 'Brecha cognitiva moderada — hay evidencia de comprensión parcial.'
        : ibc > 0.15
          ? 'Brecha cognitiva baja — el aprendiz muestra comprensión relacional.'
          : 'Brecha mínima — comprensión profunda y abstracta.',
  }

  // ===== BLOCK 5: Convergence + ZDP =====
  // Convergence: average turns to accreditation (for completed sessions)
  const closedSessions = sessions.filter(
    (s) => s.state === 'closed' || s.state === 'evaluated'
  )

  // Count turns per session
  const turnsBySession = new Map<string, number>()
  for (const a of analyses) {
    const count = turnsBySession.get(a.session_id) ?? 0
    turnsBySession.set(a.session_id, count + 1)
  }

  const convergenceData: { unit_id: string; unit_name: string; turns: number; result: string }[] = []
  for (const s of closedSessions) {
    const turnCount = turnsBySession.get(s.id) ?? 0
    if (turnCount === 0) continue
    const unit = units.find((u) => u.id === s.unit_id)
    // Determine result from accreditation
    const passUnit = units.find((u) => u.id === s.unit_id && u.state === 'mastered')
    convergenceData.push({
      unit_id: s.unit_id,
      unit_name: unit?.name ?? 'Unknown',
      turns: turnCount,
      result: passUnit ? 'PASS' : 'FAIL',
    })
  }

  const passedSessions = convergenceData.filter((c) => c.result === 'PASS')
  const avgTurnsToPass = passedSessions.length > 0
    ? passedSessions.reduce((sum, c) => sum + c.turns, 0) / passedSessions.length
    : null

  // ZDP calibration: if avg turns < 3, content may be too easy; if > 6, may be too hard
  let zdpCalibration: 'too_easy' | 'optimal' | 'too_hard' | 'insufficient_data'
  if (avgTurnsToPass === null || passedSessions.length < 2) {
    zdpCalibration = 'insufficient_data'
  } else if (avgTurnsToPass < 3) {
    zdpCalibration = 'too_easy'
  } else if (avgTurnsToPass > 6) {
    zdpCalibration = 'too_hard'
  } else {
    zdpCalibration = 'optimal'
  }

  const block5 = {
    avg_turns_to_pass: avgTurnsToPass !== null ? Math.round(avgTurnsToPass * 100) / 100 : null,
    total_completed_sessions: closedSessions.length,
    total_passed: passedSessions.length,
    total_failed: convergenceData.filter((c) => c.result === 'FAIL').length,
    convergence_by_unit: convergenceData,
    zdp_calibration: zdpCalibration,
    zdp_interpretation: zdpCalibration === 'too_easy'
      ? 'El aprendiz acredita muy rápido — considerar aumentar exigencia de la rúbrica.'
      : zdpCalibration === 'too_hard'
        ? 'El aprendiz necesita muchos turnos — la dificultad puede estar fuera de su ZDP.'
        : zdpCalibration === 'optimal'
          ? 'La dificultad está bien calibrada dentro de la Zona de Desarrollo Próximo.'
          : 'Datos insuficientes para calibrar — se necesitan al menos 2 unidades completadas.',
  }

  return NextResponse.json({
    data: {
      course_name: course.name,
      course_state: course.state,
      deadline: course.deadline,
      block_1_progress: block1,
      block_2_ibc: block2,
      block_5_convergence: block5,
    },
  })
}
