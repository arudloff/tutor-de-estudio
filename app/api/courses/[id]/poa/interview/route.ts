/**
 * POST /api/courses/:id/poa/interview
 *
 * Envía un mensaje del aprendiz al A12 y retorna la respuesta en streaming.
 * El A12 conduce la entrevista para capturar el POA.
 *
 * AC-3.1: inicio de entrevista (primer mensaje vacio → A12 emite pregunta 1)
 * AC-3.2: follow-up cuando respuesta es vaga
 * AC-3.3: A12 sintetiza POA al tener cobertura
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runA12Turn, extractPoaFromResponse, type A12Message } from '@/lib/agents/a12-interviewer'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar que el curso existe y pertenece al usuario (defense-in-depth)
  const { data: course } = await supabase
    .from('course')
    .select('id, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  // Solo se puede entrevistar si el curso esta en draft
  if (course.state !== 'draft') {
    return NextResponse.json(
      { error: 'Interview only available for draft courses' },
      { status: 409 }
    )
  }

  const body = await request.json().catch(() => null)
  const userMessage: string = body?.message ?? ''

  const admin = createAdminClient()

  // Obtener o crear POA
  let { data: poa } = await admin
    .from('learner_objective_profile')
    .select('id, state')
    .eq('course_id', params.id)
    .maybeSingle()

  if (!poa) {
    // Crear POA en estado in_interview
    const { data: newPoa, error: createError } = await admin
      .from('learner_objective_profile')
      .insert({ course_id: params.id, state: 'in_interview' })
      .select('id, state')
      .single()

    if (createError || !newPoa) {
      // eslint-disable-next-line no-console
      console.error('[poa/interview] create POA error:', createError)
      return NextResponse.json({ error: 'Failed to create POA' }, { status: 500 })
    }
    poa = newPoa
  } else if (poa.state === 'confirmed_by_learner') {
    return NextResponse.json(
      { error: 'POA already confirmed' },
      { status: 409 }
    )
  } else if (poa.state === 'empty') {
    await admin
      .from('learner_objective_profile')
      .update({ state: 'in_interview' })
      .eq('id', poa.id)
  }

  // Cargar historial de la entrevista
  const { data: messages } = await admin
    .from('message_log')
    .select('agent, role, content')
    .eq('course_id', params.id)
    .is('session_id', null)
    .order('created_at', { ascending: true })

  // Construir historial para el A12
  const history: A12Message[] = (messages ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Si hay un mensaje del usuario, agregarlo
  if (userMessage) {
    history.push({ role: 'user', content: userMessage })

    // Persistir mensaje del aprendiz
    await admin.from('message_log').insert({
      course_id: params.id,
      agent: 'learner',
      role: 'user',
      content: userMessage,
    })
  } else if (history.length === 0) {
    // Primer turno: el A12 empieza sin input del usuario
    // No agregamos nada al historial — el A12 inicia la conversacion
  }

  // Streaming via ReadableStream
  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { inputTokens, outputTokens } = await runA12Turn(history, {
          onText(text) {
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            )
          },
          async onDone(response) {
            // Persistir respuesta del A12
            await admin.from('message_log').insert({
              course_id: params.id,
              agent: 'a12',
              role: 'assistant',
              content: response,
              tokens: inputTokens + outputTokens,
            })

            // Verificar si el A12 sintetizo un POA
            const poaData = extractPoaFromResponse(response)
            if (poaData) {
              // Actualizar POA con los datos extraidos
              await admin
                .from('learner_objective_profile')
                .update({
                  state: 'captured',
                  learner_role: poaData.learner_role as string ?? null,
                  discipline: poaData.discipline as string ?? null,
                  program: poaData.program as string ?? null,
                  phase: (poaData.phase as 'starting' | 'middle' | 'closing' | 'postdoctoral') ?? null,
                  research_field: poaData.research_field as string ?? null,
                  target_challenge: poaData.target_challenge as string ?? null,
                  target_capability: poaData.target_capability as string ?? null,
                  success_signal: poaData.success_signal as string ?? null,
                  known_authors: poaData.known_authors as string[] ?? null,
                  prior_readings: poaData.prior_readings as string[] ?? null,
                  prior_ideas: poaData.prior_ideas as string ?? null,
                  theoretical_traditions: poaData.theoretical_traditions as string[] ?? null,
                })
                .eq('course_id', params.id)

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ poa_captured: true })}\n\n`
                )
              )
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
          onError(error) {
            // eslint-disable-next-line no-console
            console.error('[poa/interview] A12 error:', error)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'Agent error' })}\n\n`
              )
            )
            controller.close()
          },
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[poa/interview] stream error:', error)
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
