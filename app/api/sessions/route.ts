/**
 * POST /api/sessions — crear sesion nueva para una unidad
 * GET  /api/sessions?course_id=X — obtener sesion activa del curso
 *
 * AC-9.1: inicio de sesion → retorna productive_failure_problem, NO la instruccion
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.unit_id) {
    return NextResponse.json({ error: 'unit_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar unidad y ownership
  const { data: unit } = await admin
    .from('sense_unit')
    .select('id, course_id, name, state')
    .eq('id', body.unit_id)
    .single()

  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

  // Verificar ownership del curso
  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', unit.course_id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Not your course' }, { status: 403 })

  if (unit.state !== 'available' && unit.state !== 'needs_review') {
    return NextResponse.json({ error: 'Unit not available for session' }, { status: 409 })
  }

  // Crear sesion
  const { data: session, error } = await admin
    .from('learning_session')
    .insert({
      course_id: unit.course_id,
      unit_id: body.unit_id,
      state: 'started',
      started_at: new Date().toISOString(),
    })
    .select('id, state')
    .single()

  if (error || !session) {
    // eslint-disable-next-line no-console
    console.error('[sessions/POST] error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Marcar unidad como in_session
  await admin.from('sense_unit').update({ state: 'in_session' }).eq('id', body.unit_id)

  // Cargar problema de fallo productivo (AC-9.1: NO incluir la instruccion)
  const { data: pfp } = await admin
    .from('productive_failure_problem')
    .select('content')
    .eq('unit_id', body.unit_id)
    .single()

  return NextResponse.json({
    data: {
      session_id: session.id,
      unit_name: unit.name,
      productive_failure_problem: pfp?.content ?? 'No problem available',
      state: 'started',
    },
  }, { status: 201 })
}
