/**
 * POST /api/sessions/:id/turn
 *
 * Envía un mensaje del aprendiz al A4. Retorna respuesta JSON (no streaming).
 * Simplificado para evitar problemas con SSE + rate limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runA4Turn, type A4Message, type A4Decision } from '@/lib/agents/a4-evaluator'
import { recalculatePlan } from '@/lib/agents/a5-planner'
import { checkRateLimit } from '@/lib/utils/rate-limiter'
import type { Database } from '@/lib/db/types'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: max 5 turnos por minuto por usuario (protege créditos de IA)
  const rl = checkRateLimit(`turn:${user.id}`, 5, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { data: { response: `Espera ${rl.resetInSeconds} segundos antes de enviar otro mensaje.`, decision: null, canonical_instruction: null, generative_task: null, rate_limited: true } },
      { status: 200 }
    )
  }

  const body = await request.json().catch(() => null)
  const userMessage: string = body?.message ?? ''

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('learning_session')
    .select('id, course_id, unit_id, state')
    .eq('id', params.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const { data: course } = await supabase
    .from('course').select('id').eq('id', session.course_id).eq('user_id', user.id).single()
  if (!course) return NextResponse.json({ error: 'Not your session' }, { status: 403 })

  if (session.state === 'closed' || session.state === 'evaluated') {
    return NextResponse.json({ error: 'Session already closed' }, { status: 409 })
  }

  // Cargar artefactos
  const [pfpRes, ciRes, rubRes, mcRes, poaRes] = await Promise.all([
    admin.from('productive_failure_problem').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('canonical_instruction').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('rubric').select('items').eq('unit_id', session.unit_id).single(),
    admin.from('misconception_catalog').select('items').eq('unit_id', session.unit_id).single(),
    admin.from('learner_objective_profile').select('learner_role, discipline, research_field, target_challenge, target_capability').eq('course_id', session.course_id).single(),
  ])

  const { data: unitData } = await admin
    .from('sense_unit').select('name, description').eq('id', session.unit_id).single()

  const isFirstTurn = session.state === 'started'

  // Persistir mensaje del aprendiz
  if (userMessage) {
    await admin.from('message_log').insert({
      course_id: session.course_id,
      session_id: session.id,
      agent: 'learner',
      role: 'user',
      content: userMessage,
    })

    if (isFirstTurn) {
      await admin.from('attempt').insert({
        session_id: session.id,
        attempt_type: 'productive_failure',
        content: userMessage,
      })
      await admin.from('learning_session').update({ state: 'in_progress' }).eq('id', session.id)
    } else {
      await admin.from('attempt').insert({
        session_id: session.id,
        attempt_type: 'dialog_turn',
        content: userMessage,
      })
    }
  }

  // Cargar historial
  const { data: messages } = await admin
    .from('message_log')
    .select('role, content')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  const history: A4Message[] = (messages ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Agrupar mensajes consecutivos del mismo rol
  const grouped: A4Message[] = []
  for (const msg of history) {
    const last = grouped[grouped.length - 1]
    if (last && last.role === msg.role) {
      last.content += '\n\n' + msg.content
    } else {
      grouped.push({ ...msg })
    }
  }
  if (grouped.length > 0 && grouped[0]!.role !== 'user') {
    grouped.unshift({ role: 'user', content: '(inicio)' })
  }

  if (isFirstTurn) {
    grouped.push({
      role: 'user',
      content: `[El aprendiz intentó el problema de fallo productivo. Su intento: "${userMessage}". Muéstrale la instrucción canónica y hazle tu primera pregunta socrática.]\n\nInstrucción canónica:\n${ciRes.data?.content ?? ''}`,
    })
  }

  const rubricItems = (rubRes.data?.items as { description: string; scope: string }[]) ?? []
  const misconceptions = (mcRes.data?.items as { description: string; detection_signal: string; reformulation: string }[]) ?? []

  const a4Context = {
    unitName: unitData?.name ?? '',
    unitDescription: unitData?.description ?? '',
    productiveFailureProblem: pfpRes.data?.content ?? '',
    canonicalInstruction: ciRes.data?.content ?? '',
    rubricItems,
    misconceptions,
    poa: poaRes.data ?? { learner_role: null, discipline: null, research_field: null, target_challenge: null, target_capability: null },
  }

  // Llamar al A4 con retry para rate limits
  let a4Response = ''
  let a4Decision: A4Decision = { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await runA4Turn(a4Context, grouped, {
        onText(text) { a4Response += text },
        async onDone(visibleText, decision) { a4Response = visibleText; a4Decision = decision },
        onError(error) { throw error },
      })
      break // Éxito
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const isRateLimit = msg.includes('429') || msg.includes('rate_limit')
      // eslint-disable-next-line no-console
      console.error(`[session/turn] A4 attempt ${attempt}/${maxRetries}: ${msg.slice(0, 120)}`)

      if (attempt === maxRetries) {
        return NextResponse.json({
          data: {
            response: isRateLimit
              ? 'El tutor necesita un momento. Espera 1-2 minutos y envía tu mensaje de nuevo.'
              : 'Error del agente. Intenta de nuevo en 1 minuto.',
            decision: null,
            canonical_instruction: isFirstTurn ? ciRes.data?.content : null,
            rate_limited: isRateLimit,
          },
        })
      }

      if (isRateLimit) {
        await new Promise((r) => setTimeout(r, 60000)) // Esperar 60s
        a4Response = '' // Reset para reintentar
      } else {
        await new Promise((r) => setTimeout(r, 5000))
        a4Response = ''
      }
    }
  }

  // M1: Validar que PASS cumple ≥70% de la rúbrica (CHK-AGENT-008)
  if (a4Decision.type === 'pass' && rubricItems.length > 0) {
    const coverageRatio = a4Decision.rubricItemsSatisfied.length / rubricItems.length
    if (coverageRatio < 0.7) {
      // eslint-disable-next-line no-console
      console.log(`[session/turn] PASS rechazado: solo ${Math.round(coverageRatio * 100)}% de rubrica cubierta (${a4Decision.rubricItemsSatisfied.length}/${rubricItems.length}). Forzando continue.`)
      a4Decision = { ...a4Decision, type: 'continue' }
      a4Response += '\n\nVeo que vas por buen camino, pero necesito verificar algunos puntos más. ¿Podrías profundizar en tu respuesta?'
    }
  }

  // Persistir respuesta del A4
  const { data: savedMsg } = await admin.from('message_log').insert({
    course_id: session.course_id,
    session_id: session.id,
    agent: 'a4',
    role: 'assistant',
    content: a4Response,
  }).select('id').single()

  // M1: Recopilar IDs reales de message_log para evidence trazable
  const { data: allMsgIds } = await admin
    .from('message_log')
    .select('id')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  const realMessageLogIds = (allMsgIds ?? []).map((m) => m.id)

  // Manejar decisión
  let generativeTask = null

  if (a4Decision.type === 'pass' || a4Decision.type === 'fail') {
    await admin.from('hito_accreditation').insert({
      unit_id: session.unit_id,
      session_id: session.id,
      result: a4Decision.type.toUpperCase() as 'PASS' | 'FAIL',
      evidence: {
        message_log_ids: realMessageLogIds, // M1: IDs reales, no UUIDs falsos
        rubric_items_satisfied: a4Decision.rubricItemsSatisfied,
        misconceptions_detected: a4Decision.misconceptionsDetected,
        rubric_coverage_pct: rubricItems.length > 0
          ? Math.round((a4Decision.rubricItemsSatisfied.length / rubricItems.length) * 100)
          : null,
      } as unknown as Database['public']['Tables']['hito_accreditation']['Insert']['evidence'],
      reason: a4Decision.reason ?? null,
    })

    const newUnitState = a4Decision.type === 'pass' ? 'mastered' : 'needs_review'
    await admin.from('sense_unit').update({ state: newUnitState }).eq('id', session.unit_id)
    // Cerrar sesion directamente (el artifact generativo es opcional en MVP-1)
    await admin.from('learning_session').update({ state: 'closed', closed_at: new Date().toISOString() }).eq('id', session.id)
    await recalculatePlan(admin, session.course_id)

    if (a4Decision.type === 'pass') {
      const { data: task } = await admin
        .from('generative_task')
        .select('id, tier, format, prompt, max_words')
        .eq('unit_id', session.unit_id)
        .single()
      generativeTask = task
    }
  }

  return NextResponse.json({
    data: {
      response: a4Response,
      decision: a4Decision.type !== 'continue' ? a4Decision.type.toUpperCase() : null,
      canonical_instruction: isFirstTurn ? ciRes.data?.content : null,
      generative_task: generativeTask,
      rate_limited: false,
    },
  })
}
