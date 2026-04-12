/**
 * GET /api/units/:id/evidence
 *
 * Retorna la evidencia completa de una unidad acreditada:
 * message_log completo + artifact + decision de acreditacion.
 *
 * AC-12.2: evidencia recuperable sin truncar
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

  const admin = createAdminClient()

  // Verificar ownership via unit → course
  const { data: unit } = await admin
    .from('sense_unit')
    .select('id, course_id, name, state')
    .eq('id', params.id)
    .single()

  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', unit.course_id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Not your unit' }, { status: 403 })

  // Cargar todo en paralelo
  const [accreditationRes, sessionsRes, artifactsRes] = await Promise.all([
    admin.from('hito_accreditation').select('*').eq('unit_id', params.id).order('created_at', { ascending: false }),
    admin.from('learning_session').select('id, state, started_at, closed_at').eq('unit_id', params.id).order('created_at', { ascending: false }),
    admin.from('artifact').select('*').eq('unit_id', params.id).order('created_at', { ascending: false }),
  ])

  // Cargar messages de todas las sesiones de esta unidad
  const sessionIds = (sessionsRes.data ?? []).map((s) => s.id)
  const { data: messages } = sessionIds.length > 0
    ? await admin.from('message_log').select('*').in('session_id', sessionIds).order('created_at', { ascending: true })
    : { data: [] }

  return NextResponse.json({
    data: {
      unit: { id: unit.id, name: unit.name, state: unit.state },
      accreditations: accreditationRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      messages: messages ?? [],
      artifacts: artifactsRes.data ?? [],
    },
  })
}
