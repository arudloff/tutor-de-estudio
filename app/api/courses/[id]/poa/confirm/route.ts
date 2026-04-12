/**
 * POST /api/courses/:id/poa/confirm
 *
 * Confirma el POA capturado por el A12. Lo lockea (state → confirmed_by_learner).
 * Transiciona el curso de draft → poa_captured.
 *
 * AC-3.4: aprendiz confirma POA → state locked + course state = poa_captured
 * AC-3.6: A3 NO puede leer un POA no confirmado (enforced en A3, testeado adversarialmente)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar curso
  const { data: course } = await supabase
    .from('course')
    .select('id, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const admin = createAdminClient()

  // Verificar POA
  const { data: poa } = await admin
    .from('learner_objective_profile')
    .select('id, state')
    .eq('course_id', params.id)
    .single()

  if (!poa) {
    return NextResponse.json(
      { error: 'POA not found. Start the interview first.' },
      { status: 404 }
    )
  }

  if (poa.state === 'confirmed_by_learner') {
    return NextResponse.json(
      { error: 'POA already confirmed' },
      { status: 409 }
    )
  }

  if (poa.state !== 'captured') {
    return NextResponse.json(
      { error: 'POA must be in captured state to confirm. Complete the interview first.' },
      { status: 409 }
    )
  }

  // Lock POA
  const { error: poaError } = await admin
    .from('learner_objective_profile')
    .update({
      state: 'confirmed_by_learner',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', poa.id)

  if (poaError) {
    // eslint-disable-next-line no-console
    console.error('[poa/confirm] update error:', poaError)
    return NextResponse.json({ error: 'Failed to confirm POA' }, { status: 500 })
  }

  // Transicionar curso draft → poa_captured
  const { error: courseError } = await admin
    .from('course')
    .update({ state: 'poa_captured' })
    .eq('id', params.id)

  if (courseError) {
    // eslint-disable-next-line no-console
    console.error('[poa/confirm] course update error:', courseError)
    return NextResponse.json({ error: 'Failed to update course state' }, { status: 500 })
  }

  return NextResponse.json(
    { ok: true, poa_state: 'confirmed_by_learner', course_state: 'poa_captured' },
    { status: 200 }
  )
}
