/**
 * A4 — Evaluador socratico
 *
 * Conduce el dialogo de verificacion, detecta evidencia de dominio o
 * ausencia de dominio, decide cierre del dialogo. RECIBE POA en contexto
 * (D19) para calibrar tono, enfasis y criterio de acreditacion.
 *
 * Usa Claude Opus (razonamiento fino para distinguir comprension de
 * memorizacion — el error mas caro del sistema).
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

interface A4Context {
  unitName: string
  unitDescription: string
  productiveFailureProblem: string
  canonicalInstruction: string
  rubricItems: { description: string; scope: string }[]
  misconceptions: { description: string; detection_signal: string; reformulation: string }[]
  poa: {
    learner_role: string | null
    discipline: string | null
    research_field: string | null
    target_challenge: string | null
    target_capability: string | null
  }
}

export interface A4Message {
  role: 'user' | 'assistant'
  content: string
}

export interface A4Decision {
  type: 'continue' | 'pass' | 'fail'
  rubricItemsSatisfied: string[]
  misconceptionsDetected: string[]
  reason?: string
}

export interface A4StreamCallbacks {
  onText: (text: string) => void
  onDone: (fullResponse: string, decision: A4Decision) => void
  onError: (error: Error) => void
}

export async function runA4Turn(
  context: A4Context,
  history: A4Message[],
  callbacks: A4StreamCallbacks
): Promise<{ inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const systemPrompt = `Eres el agente A4 de Socrates, un evaluador socratico doctoral. Tu trabajo es conducir un dialogo que VERIFICA si el aprendiz comprende una unidad de sentido — no explicar, no ensenar, solo verificar mediante preguntas socraticas.

UNIDAD: ${context.unitName}
DESCRIPCION: ${context.unitDescription}

PERFIL DEL APRENDIZ (POA):
- Rol: ${context.poa.learner_role ?? 'no especificado'}
- Disciplina: ${context.poa.discipline ?? 'no especificada'}
- Campo: ${context.poa.research_field ?? 'no especificado'}
- Desafio: ${context.poa.target_challenge ?? 'no especificado'}
- Capacidad objetivo: ${context.poa.target_capability ?? 'no especificada'}

RUBRICA DE EXPECTATIVAS (lo que debe poder articular):
${context.rubricItems.map((r, i) => `${i + 1}. ${r.description} [${r.scope}]`).join('\n')}

MISCONCEPCIONES A DETECTAR:
${context.misconceptions.map((m, i) => `${i + 1}. ${m.description} — senal: ${m.detection_signal}`).join('\n')}

REGLAS DEL DIALOGO SOCRATICO (Principio 3 del A9, estructura Graesser/AutoTutor):
1. Haz UNA pregunta a la vez. Nunca 2 preguntas en un turno.
2. Las preguntas deben ser abiertas, no de si/no.
3. Calibra el tono al POA del aprendiz (no hables igual a un doctorando que a un master).
4. Enfatiza los aspectos relevantes al objetivo del POA.
5. Si detectas una misconcepcion, NO la corrijas. Reformula la pregunta para que el aprendiz la descubra.
6. Lleva un conteo interno de que items de la rubrica se han satisfecho y que misconcepciones se han detectado.

DECISION AL FINAL DE CADA TURNO:
Despues de tu mensaje, agrega un bloque JSON oculto con tu evaluacion:
\`\`\`decision
{"type": "continue|pass|fail", "rubric_items_satisfied": ["item 1", ...], "misconceptions_detected": ["misc 1", ...], "reason": "..."}
\`\`\`

- "continue": la conversacion debe seguir (no hay suficiente evidencia)
- "pass": el aprendiz ha demostrado comprension suficiente para su objetivo (POA)
- "fail": el aprendiz tiene misconcepciones persistentes que no se resolvieron

Criterio de PASS: al menos 70% de los items de la rubrica satisfechos + ninguna misconcepcion critica sin resolver.
Criterio de FAIL: solo despues de al menos 5 turnos si las misconcepciones persisten.

Responde en espanol. Se breve (2-4 oraciones max por turno).`

  let fullResponse = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    const stream = client.messages.stream({
      model: env.ANTHROPIC_MODEL_OPUS,
      max_tokens: 1024,
      system: systemPrompt,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    })

    stream.on('text', (text) => {
      fullResponse += text
      // Solo enviar texto visible (no el bloque decision)
      if (!fullResponse.includes('```decision')) {
        callbacks.onText(text)
      }
    })

    const finalMessage = await stream.finalMessage()
    inputTokens = finalMessage.usage.input_tokens
    outputTokens = finalMessage.usage.output_tokens

    // Extraer decision del bloque oculto
    const decision = extractDecision(fullResponse)

    // Limpiar el texto visible (remover bloque decision)
    const visibleText = fullResponse.replace(/```decision[\s\S]*?```/g, '').trim()

    callbacks.onDone(visibleText, decision)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }

  return { inputTokens, outputTokens }
}

function extractDecision(text: string): A4Decision {
  const match = text.match(/```decision\s*([\s\S]*?)```/)
  if (!match?.[1]) {
    return { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }
  }

  try {
    const parsed = JSON.parse(match[1].trim()) as {
      type?: string
      rubric_items_satisfied?: string[]
      misconceptions_detected?: string[]
      reason?: string
    }
    return {
      type: (parsed.type as A4Decision['type']) ?? 'continue',
      rubricItemsSatisfied: parsed.rubric_items_satisfied ?? [],
      misconceptionsDetected: parsed.misconceptions_detected ?? [],
      reason: parsed.reason,
    }
  } catch {
    return { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }
  }
}
