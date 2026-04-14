import { parseLlmJson } from '@/lib/utils/parse-llm-json'
/**
 * A7 — Auditor de fidelidad
 *
 * Verifica que los artefactos del A3 son fieles al texto fuente:
 * 1. Citas verbatim coinciden al 99%+ con el PDF original
 * 2. Catalogo de misconcepciones cubre los puntos contraintuitivos
 *
 * Rol de verificacion independiente: NUNCA el mismo agente que produjo lo verifica.
 * Usa Claude Opus (agente independiente del disenador).
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

interface AuditInput {
  unitName: string
  canonicalInstruction: string
  citedSpans: { text: string; location: string }[]
  misconceptions: { description: string }[]
  sourceText: string
}

export interface A7Result {
  pass: boolean
  citeResults: { citation: string; found: boolean; similarity: number; issue?: string }[]
  misconceptionCoverage: { adequate: boolean; missing?: string }
  inputTokens: number
  outputTokens: number
}

export async function runA7(input: AuditInput): Promise<A7Result> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL_OPUS,
    max_tokens: 4000,
    system: `Eres el agente A7 de Socrates, un auditor de fidelidad INDEPENDIENTE del A3 (disenador instruccional). Tu unico trabajo es verificar que los artefactos del A3 son fieles al texto fuente.

Verificas 2 cosas:
1. FIDELIDAD DE CITAS: cada cita verbatim del A3 debe coincidir al 99%+ con el texto fuente (despues de normalizar whitespace y comillas tipograficas). Si una cita esta inventada o distorsionada, es FAIL.
2. COBERTURA DE MISCONCEPCIONES: el catalogo debe incluir al menos los puntos donde un aprendiz tipicamente cae (argumento contraintuitivo, termino tecnico con uso distinto al cotidiano, distincion critica). Si falta alguno obvio, reportarlo.

Produce un JSON:
{
  "pass": true,
  "cite_results": [
    {"citation": "texto de la cita", "found": true, "similarity": 99.5, "issue": null}
  ],
  "misconception_coverage": {"adequate": true, "missing": null}
}

pass = true SOLO si TODAS las citas son fieles (similarity >= 99%) Y la cobertura de misconcepciones es adecuada.

Responde SOLO con el JSON.`,
    messages: [
      {
        role: 'user',
        content: `Audita los artefactos del A3 para la unidad "${input.unitName}":

CITAS DEL A3:
${JSON.stringify(input.citedSpans, null, 2)}

MISCONCEPCIONES DEL A3:
${JSON.stringify(input.misconceptions.map(m => m.description), null, 2)}

INSTRUCCION CANONICA DEL A3:
${input.canonicalInstruction}

TEXTO FUENTE (contra el cual verificar):
${input.sourceText}`,
      },
    ],
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch?.[1]) jsonStr = jsonMatch[1]

  const parsed = parseLlmJson(content) as {
    pass?: boolean
    cite_results?: A7Result['citeResults']
    misconception_coverage?: A7Result['misconceptionCoverage']
  }

  return {
    pass: parsed.pass ?? false,
    citeResults: parsed.cite_results ?? [],
    misconceptionCoverage: parsed.misconception_coverage ?? { adequate: false },
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
