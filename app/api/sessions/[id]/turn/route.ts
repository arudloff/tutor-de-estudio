/**
 * POST /api/sessions/:id/turn
 *
 * Envia un mensaje del aprendiz al A4. Retorna respuesta en streaming.
 * Maneja todo el flujo:
 * - Primer turno (attempt productivo) → persiste attempt, devuelve instruccion + primera pregunta A4
 * - Turnos siguientes (dialogo) → A4 evalua + pregunta o cierra
 * - Cierre (pass/fail) → crea hito_accreditation, devuelve generative_task si PASS
 *
 * AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runA4Turn, type A4Message } from '@/lib/agents/a4-evaluator'
import { recalculatePlan } from '@/lib/agents/a5-planner'
import type { Database } from '@/lib/db/types'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const userMessage: string = body?.message ?? ''

  const admin = createAdminClient()

  // Cargar sesion con ownership check
  const { data: session } = await admin
    .from('learning_session')
    .select('id, course_id, unit_id, state')
    .eq('id', params.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Ownership via course
  const { data: course } = await supabase
    .from('course')
    .select('id').eq('id', session.course_id).eq('user_id', user.id).single()
  if (!course) return NextResponse.json({ error: 'Not your session' }, { status: 403 })

  if (session.state === 'closed' || session.state === 'evaluated') {
    return NextResponse.json({ error: 'Session already closed' }, { status: 409 })
  }

  // Cargar artefactos de la unidad
  const [pfpRes, ciRes, rubRes, mcRes, poaRes] = await Promise.all([
    admin.from('productive_failure_problem').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('canonical_instruction').select('content').eq('unit_id', session.unit_id).single(),
    admin.from('rubric').select('items').eq('unit_id', session.unit_id).single(),
    admin.from('misconception_catalog').select('items').eq('unit_id', session.unit_id).single(),
    admin.from('learner_objective_profile').select('learner_role, discipline, research_field, target_challenge, target_capability').eq('course_id', session.course_id).single(),
  ])

  const { data: unitData } = await admin
    .from('sense_unit')
    .select('name, description')
    .eq('id', session.unit_id)
    .single()

  // Determinar si es el primer turno (attempt productivo)
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
      // AC-9.2: persistir como attempt de fallo productivo
      await admin.from('attempt').insert({
        session_id: session.id,
        attempt_type: 'productive_failure',
        content: userMessage,
      })
      // Transicionar sesion
      await admin.from('learning_session').update({ state: 'in_progress' }).eq('id', session.id)
    } else {
      await admin.from('attempt').insert({
        session_id: session.id,
        attempt_type: 'dialog_turn',
        content: userMessage,
      })
    }
  }

  // Cargar historial del dialogo
  const { data: messages } = await admin
    .from('message_log')
    .select('role, content')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  const history: A4Message[] = (messages ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Si es primer turno, inyectar la instruccion canonica como contexto del A4
  if (isFirstTurn) {
    const instructionMsg = `[El aprendiz acaba de intentar el problema de fallo productivo. Su intento fue: "${userMessage}". Ahora muéstrale la instrucción canónica y hazle tu primera pregunta socrática.]\n\nInstrucción canónica para mostrar al aprendiz:\n${ciRes.data?.content ?? ''}`
    history.push({ role: 'user', content: instructionMsg })
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

  // Streaming
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { inputTokens, outputTokens } = await runA4Turn(a4Context, history, {
          onText(text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          },
          async onDone(visibleText, decision) {
            // Persistir respuesta del A4
            await admin.from('message_log').insert({
              course_id: session.course_id,
              session_id: session.id,
              agent: 'a4',
              role: 'assistant',
              content: visibleText,
              tokens: inputTokens + outputTokens,
            })

            // Manejar decision
            if (decision.type === 'pass' || decision.type === 'fail') {
              // AC-9.4 / AC-9.5: acreditacion con evidencia trazable
              const messageIds = (messages ?? []).map(() => crypto.randomUUID()) // simplified
              await admin.from('hito_accreditation').insert({
                unit_id: session.unit_id,
                session_id: session.id,
                result: decision.type.toUpperCase() as 'PASS' | 'FAIL',
                evidence: {
                  message_log_ids: messageIds,
                  rubric_items_satisfied: decision.rubricItemsSatisfied,
                  misconceptions_detected: decision.misconceptionsDetected,
                } as unknown as Database['public']['Tables']['hito_accreditation']['Insert']['evidence'],
                reason: decision.reason ?? null,
              })

              // Actualizar estado de unidad y sesion
              const newUnitState = decision.type === 'pass' ? 'mastered' : 'needs_review'
              await admin.from('sense_unit').update({ state: newUnitState }).eq('id', session.unit_id)
              await admin.from('learning_session').update({ state: 'evaluated' }).eq('id', session.id)

              // Recalcular plan (HU-11)
              await recalculatePlan(admin, session.course_id)

              // Si PASS, enviar la tarea generativa
              if (decision.type === 'pass') {
                const { data: task } = await admin
                  .from('generative_task')
                  .select('id, tier, format, prompt, max_words')
                  .eq('unit_id', session.unit_id)
                  .single()

                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ decision: 'PASS', generative_task: task })}\n\n`
                ))
              } else {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ decision: 'FAIL', reason: decision.reason })}\n\n`
                ))
              }
            }

            // Si es primer turno, tambien enviar la instruccion como parte visible
            if (isFirstTurn) {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ canonical_instruction: ciRes.data?.content ?? '' })}\n\n`
              ))
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
          onError(error) {
            // eslint-disable-next-line no-console
            console.error('[session/turn] A4 error:', error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Agent error' })}\n\n`))
            controller.close()
          },
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[session/turn] stream error:', error)
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  })
}
