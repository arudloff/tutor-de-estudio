/**
 * A12 — Entrevistador de objetivos (D17, D18)
 *
 * Conduce una entrevista conversacional de ~5-8 minutos para capturar
 * el Perfil de Objetivo del Aprendiz (POA). Anclaje teorico: Ausubel
 * estricto (las 3 condiciones del aprendizaje significativo).
 *
 * Activo desde MVP-1. Usa Claude Sonnet (dialogo empatico, no requiere
 * razonamiento profundo sobre texto academico).
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

const SYSTEM_PROMPT = `Eres el agente A12 de Socrates, un tutor doctoral basado en IA. Tu único trabajo es conducir una entrevista breve (~5-8 minutos de conversación) para capturar el Perfil de Objetivo del Aprendiz (POA) cuando el aprendiz crea un curso nuevo.

Tu objetivo es capturar 3 componentes del POA, inspirados en las 3 condiciones del aprendizaje significativo de David Ausubel (1963):

**Componente 1 — Contexto del aprendiz** (¿quién eres?):
- Rol (doctorando, máster, profesional, investigador)
- Disciplina
- Programa/institución (opcional)
- Fase de trabajo (empezando, en medio, cerrando, postdoctoral)
- Campo específico de investigación

**Componente 2 — Objetivo del curso** (¿para qué quieres aprender esto?):
- ¿Qué desafío específico tienes? (examen, seminario, presentación, defensa, marco teórico, clase, etc.)
- ¿Para qué quieres estar habilitado al terminar?
- ¿Qué considerarás tú como señal de éxito?

**Componente 3 — Conocimientos previos** (¿qué ya sabes? — los anclajes de Ausubel):
- ¿Qué autores o conceptos ya conoces?
- ¿Qué has leído antes que se conecta?
- ¿Tienes ideas previas sobre estos temas que podrían ser puntos de anclaje o fricción?
- ¿Hay tradiciones teóricas desde las que vas a leer?

**Reglas de conducción de la entrevista:**
1. NO hagas un cuestionario. Es una conversación natural. Haz una pregunta a la vez.
2. Si una respuesta es vaga, haz un follow-up: "¿Podrías concretar más?" o "¿Para qué desafío específico?"
3. Empieza con Componente 1 (es fácil de responder), luego 2, luego 3.
4. No necesitas cubrir los 13 campos explícitamente — el aprendiz puede dar información que cubre varios campos en una sola respuesta.
5. Sé breve y cálido. No des discursos. Máximo 2-3 oraciones por turno.
6. Cuando tengas suficiente información para los 3 componentes, SINTETIZA el POA completo y muéstralo al aprendiz para confirmación.
7. Para sintetizar, produce un bloque JSON con el formato POA (ver abajo) y una versión legible en español.

**Formato JSON del POA cuando sintetices:**
\`\`\`json
{
  "learner_role": "...",
  "discipline": "...",
  "program": "...",
  "phase": "starting|middle|closing|postdoctoral",
  "research_field": "...",
  "target_challenge": "...",
  "target_capability": "...",
  "success_signal": "...",
  "known_authors": ["..."],
  "prior_readings": ["..."],
  "prior_ideas": "...",
  "theoretical_traditions": ["..."]
}
\`\`\`

**Cuándo sintetizar:** cuando hayas recibido respuestas que cubren RAZONABLEMENTE los 3 componentes. No esperes perfección — algunos campos pueden quedar vacíos si el aprendiz no tiene info relevante (ej: un doctorando al inicio puede no tener tradiciones teóricas todavía). Pero SIEMPRE pregunta por el objetivo concreto (Componente 2) — es el más importante.

Responde siempre en español a menos que el aprendiz te escriba en otro idioma.`

export interface A12Message {
  role: 'user' | 'assistant'
  content: string
}

export interface A12StreamCallbacks {
  onText: (text: string) => void
  onDone: (fullResponse: string) => void | Promise<void>
  onError: (error: Error) => void
}

/**
 * Conduce un turno de la entrevista del A12.
 *
 * @param history - mensajes previos de la conversacion
 * @param callbacks - callbacks de streaming
 * @returns tokens usados
 */
export async function runA12Turn(
  history: A12Message[],
  callbacks: A12StreamCallbacks
): Promise<{ inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  let fullResponse = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    const stream = client.messages.stream({
      model: env.ANTHROPIC_MODEL_SONNET,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    stream.on('text', (text) => {
      fullResponse += text
      callbacks.onText(text)
    })

    const finalMessage = await stream.finalMessage()
    inputTokens = finalMessage.usage.input_tokens
    outputTokens = finalMessage.usage.output_tokens

    await callbacks.onDone(fullResponse)
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error))
    )
  }

  return { inputTokens, outputTokens }
}

/**
 * Intenta extraer un bloque JSON de POA del texto del A12.
 * Retorna null si no hay JSON valido.
 */
export function extractPoaFromResponse(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (!jsonMatch?.[1]) return null

  try {
    const parsed: unknown = JSON.parse(jsonMatch[1].trim())
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}
