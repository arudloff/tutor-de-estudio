/**
 * A3 — Disenador instruccional
 *
 * Para cada unidad de sentido del A2, genera la secuencia pedagogica completa:
 * - Problema de fallo productivo (P1)
 * - Instruccion canonica condensada
 * - Rubrica de expectativas (P3)
 * - Catalogo de misconcepciones expandido (SILA alertas + expansion propia)
 * - Tarea generativa de cierre (P6, Tier 1 en MVP-1)
 *
 * RECIBE POA como contexto en cada llamada (D19). El diseno queda CALIBRADO
 * al objetivo del aprendiz — esto es lo que distingue a Socrates de un wrapper.
 *
 * Usa Claude Sonnet (buen balance creatividad/costo).
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

interface PoaContext {
  learner_role: string | null
  discipline: string | null
  research_field: string | null
  target_challenge: string | null
  target_capability: string | null
  success_signal: string | null
  known_authors: string[] | null
  theoretical_traditions: string[] | null
}

interface UnitInput {
  name: string
  description: string
  sourceText: string
}

export interface A3Result {
  productiveFailureProblem: string
  canonicalInstruction: string
  citedSpans: { text: string; location: string }[]
  rubricItems: { description: string; scope: 'universal' | 'objective_specific' }[]
  misconceptions: { description: string; why_typical: string; detection_signal: string; reformulation: string }[]
  generativeTask: { tier: number; format: string; prompt: string; maxWords: number }
  inputTokens: number
  outputTokens: number
}

export async function runA3(unit: UnitInput, poa: PoaContext): Promise<A3Result> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const poaBlock = `
PERFIL DE OBJETIVO DEL APRENDIZ (POA):
- Rol: ${poa.learner_role ?? 'no especificado'}
- Disciplina: ${poa.discipline ?? 'no especificada'}
- Campo: ${poa.research_field ?? 'no especificado'}
- Desafio: ${poa.target_challenge ?? 'no especificado'}
- Capacidad objetivo: ${poa.target_capability ?? 'no especificada'}
- Senal de exito: ${poa.success_signal ?? 'no especificada'}
- Autores conocidos: ${poa.known_authors?.join(', ') ?? 'ninguno'}
- Tradiciones teoricas: ${poa.theoretical_traditions?.join(', ') ?? 'ninguna'}`

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL_SONNET,
    max_tokens: 8000,
    system: `Eres el agente A3 de Socrates, un disenador instruccional doctoral. Tu trabajo es disenar la secuencia pedagogica completa para UNA unidad de sentido, CALIBRADA al POA del aprendiz (Ausubel estricto).

El POA del aprendiz esta abajo. CADA artefacto que produzcas debe reflejar este contexto — el fallo productivo conecta con su desafio real, la rubrica tiene items especificos de su objetivo, las misconcepciones priorizan las criticas para su objetivo, la tarea generativa produce algo util para su desafio.

Produce un JSON con esta estructura exacta:
{
  "productive_failure_problem": "problema que el concepto explica, redactado para que el aprendiz intente ANTES de ver la instruccion. Debe conectar con su contexto real segun el POA.",
  "canonical_instruction": "explicacion clara del concepto basada en el texto del autor. Esto es lo que el aprendiz ve DESPUES de luchar.",
  "cited_spans": [{"text": "cita verbatim del autor (max 2 oraciones)", "location": "seccion o parrafo de referencia"}],
  "rubric_items": [
    {"description": "lo que debe poder articular/defender/aplicar", "scope": "universal"},
    {"description": "item especifico del objetivo del POA", "scope": "objective_specific"}
  ],
  "misconceptions": [
    {"description": "error tipico", "why_typical": "por que el aprendiz cae en el", "detection_signal": "como detectarlo en el dialogo", "reformulation": "como reformular la instruccion cuando se detecta"}
  ],
  "generative_task": {
    "tier": 1,
    "format": "sintesis|tabla_comparativa|ejemplos_contextuales",
    "prompt": "instruccion para la tarea, conectada con el desafio real del aprendiz",
    "max_words": 100
  }
}

Reglas:
- rubric_items: minimo 5 items (al menos 2 universales + al menos 1 objective_specific)
- misconceptions: minimo 3, idealmente 5-8
- cited_spans: 3-5 citas verbatim del texto fuente
- generative_task: Tier 1 para MVP-1 (max 100 palabras, formatos simples)
- El fallo productivo NO debe tener la respuesta implicita. Debe ser un problema genuino.

Responde SOLO con el JSON.`,
    messages: [
      {
        role: 'user',
        content: `${poaBlock}

UNIDAD DE SENTIDO:
- Nombre: ${unit.name}
- Descripcion: ${unit.description}

TEXTO FUENTE:
${unit.sourceText}`,
      },
    ],
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch?.[1]) jsonStr = jsonMatch[1]

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>

  return {
    productiveFailureProblem: (parsed.productive_failure_problem as string) ?? '',
    canonicalInstruction: (parsed.canonical_instruction as string) ?? '',
    citedSpans: (parsed.cited_spans as A3Result['citedSpans']) ?? [],
    rubricItems: (parsed.rubric_items as A3Result['rubricItems']) ?? [],
    misconceptions: (parsed.misconceptions as A3Result['misconceptions']) ?? [],
    generativeTask: (parsed.generative_task as A3Result['generativeTask']) ?? { tier: 1, format: 'sintesis', prompt: '', maxWords: 100 },
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
