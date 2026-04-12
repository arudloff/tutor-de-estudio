/**
 * GET /api/courses/:id/dashboard
 *
 * Retorna el estado del curso para el dashboard del aprendiz.
 *
 * AC-12.1: progress_pct, mastered_count, total_units, next_unit,
 * deadline, days_remaining, at_risk
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
    .select('id, name, deadline, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const admin = createAdminClient()

  // Obtener unidades
  const { data: units } = await admin
    .from('sense_unit')
    .select('id, name, state')
    .eq('course_id', params.id)

  const totalUnits = units?.length ?? 0
  const masteredCount = units?.filter((u) => u.state === 'mastered').length ?? 0
  const progressPct = totalUnits > 0 ? (masteredCount / totalUnits) * 100 : 0

  // Plan
  const { data: plan } = await admin
    .from('learning_plan')
    .select('next_unit_id, projected_finish, at_risk, gap_days')
    .eq('course_id', params.id)
    .maybeSingle()

  // Next unit name
  let nextUnit: { id: string; name: string } | null = null
  if (plan?.next_unit_id) {
    const { data: nu } = await admin
      .from('sense_unit')
      .select('id, name')
      .eq('id', plan.next_unit_id)
      .single()
    if (nu) nextUnit = nu
  }

  const daysRemaining = Math.ceil(
    (new Date(course.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return NextResponse.json({
    data: {
      course_name: course.name,
      course_state: course.state,
      deadline: course.deadline,
      days_remaining: daysRemaining,
      progress_pct: Math.round(progressPct * 100) / 100,
      mastered_count: masteredCount,
      total_units: totalUnits,
      next_unit: nextUnit,
      at_risk: plan?.at_risk ?? false,
      gap_days: plan?.gap_days ?? null,
      projected_finish: plan?.projected_finish ?? null,
      units: (units ?? []).map((u) => ({ id: u.id, name: u.name, state: u.state })),
    },
  })
}
