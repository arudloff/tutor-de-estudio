/**
 * GET /api/courses/:id/poa/messages
 *
 * Retorna el historial de mensajes de la entrevista del A12.
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

  // Verify ownership
  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()

  // Get POA state
  const { data: poa } = await admin
    .from('learner_objective_profile')
    .select('state')
    .eq('course_id', params.id)
    .maybeSingle()

  // Get messages
  const { data: messages } = await admin
    .from('message_log')
    .select('agent, role, content, created_at')
    .eq('course_id', params.id)
    .is('session_id', null)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    data: {
      poa_state: poa?.state ?? 'empty',
      messages: (messages ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    },
  })
}
