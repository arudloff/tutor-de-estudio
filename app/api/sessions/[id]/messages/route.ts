/**
 * GET /api/sessions/:id/messages
 *
 * Retorna el historial de mensajes de una sesión + estado + artefactos.
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

  const { data: session } = await admin
    .from('learning_session')
    .select('id, course_id, unit_id, state')
    .eq('id', params.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ownership
  const { data: course } = await supabase
    .from('course').select('id').eq('id', session.course_id).eq('user_id', user.id).single()
  if (!course) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: messages } = await admin
    .from('message_log')
    .select('agent, role, content')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  // Cargar artefactos pedagógicos
  const [pfp, ci, gt] = await Promise.all([
    admin.from('productive_failure_problem').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('canonical_instruction').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('generative_task').select('id, prompt, max_words').eq('unit_id', session.unit_id).single(),
  ])

  return NextResponse.json({
    data: {
      state: session.state,
      problem: pfp.data?.content ?? '',
      instruction: ci.data?.content ?? '',
      generative_task: gt.data ?? null,
      messages: (messages ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    },
  })
}
