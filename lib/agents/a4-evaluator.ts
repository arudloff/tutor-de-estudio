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
import type { SoloLabel as SoloLabelType } from '@/lib/db/types'

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
  soloAnalysis?: SoloAnalysis
  toulminAnalysis?: ToulminAnalysis
}

export type SoloLevel = 1 | 2 | 3 | 4 | 5
export type SoloLabel = SoloLabelType

export interface SoloAnalysis {
  level: SoloLevel
  label: SoloLabel
  evidence: string
}

export interface ToulminAnalysis {
  claim: boolean
  data: boolean
  warrant: boolean
  backing: boolean
  qualifier: boolean
  rebuttal: boolean
  summary: string
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

CLASIFICACION SOLO (Biggs 1982) — clasifica el nivel de la RESPUESTA del aprendiz en ESTE turno:
- 1 (prestructural): no demuestra comprension relevante, respuesta incoherente o irrelevante
- 2 (unistructural): identifica un solo aspecto correcto sin conectarlo con otros
- 3 (multistructural): identifica varios aspectos correctos pero sin integrarlos
- 4 (relational): integra multiples aspectos en una estructura coherente, ve relaciones
- 5 (extended_abstract): trasciende la unidad, generaliza, conecta con otros dominios o teorias

CLASIFICACION TOULMIN (1958) — marca que componentes argumentativos aparecen en la respuesta:
- claim: afirmacion central que el aprendiz defiende
- data: hechos, evidencia o ejemplos que soportan el claim
- warrant: razonamiento que conecta data con claim (por que la evidencia apoya la afirmacion)
- backing: soporte adicional para el warrant (teorias, autoridades, principios)
- qualifier: matizacion o alcance de la afirmacion (generalmente, en este caso, a menos que...)
- rebuttal: reconocimiento de contraargumentos, excepciones o limitaciones

DECISION AL FINAL DE CADA TURNO:
Despues de tu mensaje, agrega un bloque JSON oculto con tu evaluacion:
\`\`\`decision
{"type": "continue|pass|fail", "rubric_items_satisfied": ["item 1", ...], "misconceptions_detected": ["misc 1", ...], "reason": "...", "solo": {"level": 1-5, "label": "prestructural|unistructural|multistructural|relational|extended_abstract", "evidence": "breve justificacion del nivel asignado"}, "toulmin": {"claim": true/false, "data": true/false, "warrant": true/false, "backing": true/false, "qualifier": true/false, "rebuttal": true/false, "summary": "breve descripcion de la calidad argumentativa"}}
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

const SOLO_LABELS: SoloLabel[] = [
  'prestructural', 'unistructural', 'multistructural', 'relational', 'extended_abstract',
]

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
      solo?: { level?: number; label?: string; evidence?: string }
      toulmin?: {
        claim?: boolean; data?: boolean; warrant?: boolean
        backing?: boolean; qualifier?: boolean; rebuttal?: boolean
        summary?: string
      }
    }

    const decision: A4Decision = {
      type: (parsed.type as A4Decision['type']) ?? 'continue',
      rubricItemsSatisfied: parsed.rubric_items_satisfied ?? [],
      misconceptionsDetected: parsed.misconceptions_detected ?? [],
      reason: parsed.reason,
    }

    if (parsed.solo) {
      const level = Math.max(1, Math.min(5, Math.round(parsed.solo.level ?? 1))) as SoloLevel
      const label = SOLO_LABELS.includes(parsed.solo.label as SoloLabel)
        ? (parsed.solo.label as SoloLabel)
        : SOLO_LABELS[level - 1]!
      decision.soloAnalysis = {
        level,
        label,
        evidence: parsed.solo.evidence ?? '',
      }
    }

    if (parsed.toulmin) {
      decision.toulminAnalysis = {
        claim: parsed.toulmin.claim ?? false,
        data: parsed.toulmin.data ?? false,
        warrant: parsed.toulmin.warrant ?? false,
        backing: parsed.toulmin.backing ?? false,
        qualifier: parsed.toulmin.qualifier ?? false,
        rebuttal: parsed.toulmin.rebuttal ?? false,
        summary: parsed.toulmin.summary ?? '',
      }
    }

    return decision
  } catch {
    return { type: 'continue', rubricItemsSatisfied: [], misconceptionsDetected: [] }
  }
}
