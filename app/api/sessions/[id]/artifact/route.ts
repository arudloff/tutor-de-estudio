/**
 * POST /api/sessions/:id/artifact
 *
 * Guarda el artifact generativo del aprendiz al cierre de la sesion.
 *
 * AC-10.1: visible despues de PASS del dialogo
 * AC-10.2: persistir artifact con word_count
 * AC-10.3: validar word count contra Tier 1 max
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.content || !body?.task_id) {
    return NextResponse.json({ error: 'content and task_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('learning_session')
    .select('id, course_id, unit_id, state')
    .eq('id', params.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.state !== 'evaluated') {
    return NextResponse.json({ error: 'Session must be evaluated before submitting artifact' }, { status: 409 })
  }

  // Ownership
  const { data: course } = await supabase
    .from('course').select('id').eq('id', session.course_id).eq('user_id', user.id).single()
  if (!course) return NextResponse.json({ error: 'Not your session' }, { status: 403 })

  // Cargar tarea para validar word count
  const { data: task } = await admin
    .from('generative_task')
    .select('id, tier, format, max_words')
    .eq('id', body.task_id)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const wordCount = (body.content as string).trim().split(/\s+/).length

  // AC-10.3: validar word count
  if (wordCount > task.max_words * 1.2) { // 20% grace
    return NextResponse.json(
      { error: `Exceeds max words (${task.max_words}). You wrote ${wordCount} words.` },
      { status: 400 }
    )
  }

  const { data: artifact, error } = await admin
    .from('artifact')
    .insert({
      unit_id: session.unit_id,
      session_id: session.id,
      task_id: body.task_id,
      format: task.format,
      content: body.content,
      word_count: wordCount,
    })
    .select('id, format, word_count, created_at')
    .single()

  if (error || !artifact) {
    // eslint-disable-next-line no-console
    console.error('[artifact/POST] error:', error)
    return NextResponse.json({ error: 'Failed to save artifact' }, { status: 500 })
  }

  // Cerrar sesion
  await admin.from('learning_session').update({
    state: 'closed',
    closed_at: new Date().toISOString(),
  }).eq('id', session.id)

  return NextResponse.json({ data: artifact }, { status: 201 })
}
