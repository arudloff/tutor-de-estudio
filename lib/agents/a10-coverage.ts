import { parseLlmJson } from '@/lib/utils/parse-llm-json'
/**
 * A10 — Verificador de cobertura (rol adversarial separado)
 *
 * Verifica de manera INDEPENDIENTE que el A2 asigno el 100% del texto
 * sustantivo del PDF a al menos una unidad de sentido.
 *
 * Regla IV&V: el A10 NO ve el proceso de razonamiento del A2. Solo recibe
 * el PDF y el catalogo de unidades como inputs externos. Ejecuta en una
 * llamada LLM independiente.
 *
 * Usa Claude Opus (razonamiento fino para distinguir contenido sustantivo
 * del no-sustantivo).
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import type { SenseUnit } from './a2-analyst'

export interface CoverageResult {
  coveragePct: number
  orphanCount: number
  orphanParagraphs: { index: number; text: string; reason: string }[]
  nonCoverable: { index: number; text: string; reason: string }[]
  pass: boolean
  inputTokens: number
  outputTokens: number
}

export async function runA10(
  paragraphs: { index: number; text: string; is_substantive: boolean }[],
  units: SenseUnit[]
): Promise<CoverageResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const unitsSummary = units.map((u, i) => ({
    index: i,
    name: u.name,
    spans: u.source_spans.map((s) => `parrafos ${s.start_paragraph}-${s.end_paragraph}`),
  }))

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL_OPUS,
    max_tokens: 8000,
    system: `Eres el agente A10 de Socrates, un verificador de cobertura INDEPENDIENTE. Tu unico trabajo es verificar que TODOS los parrafos sustantivos del PDF estan cubiertos por al menos una unidad de sentido del A2.

IMPORTANTE: Eres un agente adversarial. No compartes contexto con el A2. Tu trabajo es encontrar lo que el A2 pudo haber omitido.

Regla no negociable: ningun pasaje sustantivo del PDF puede quedar sin asignar. Un pipeline que decide unilateralmente que descartar del autor es la trampa de Bastani aplicada al diseno instruccional.

Parrafos NO sustantivos (que puedes marcar como no_coverable):
- Encabezados y pies de pagina repetitivos
- Numeracion de pagina
- Bibliografia y referencias
- Agradecimientos
- Informacion de contacto / afiliacion
- Tablas de figuras / listas de abreviaturas

TODO lo demas es sustantivo y DEBE estar cubierto.

Produce un JSON:
{
  "coverage_pct": 100.0,
  "orphan_count": 0,
  "orphan_paragraphs": [{"index": N, "text": "primeras 50 palabras...", "reason": "por que esta huerfano"}],
  "non_coverable": [{"index": N, "text": "primeras 50 palabras...", "reason": "por que no es sustantivo"}],
  "pass": true
}

pass = true SOLO si coverage_pct == 100 (todos los parrafos sustantivos cubiertos).

Responde SOLO con el JSON.`,
    messages: [
      {
        role: 'user',
        content: `Verifica la cobertura. Aqui estan los parrafos del PDF y las unidades del A2:

---PARRAFOS---
${JSON.stringify(paragraphs, null, 2)}

---UNIDADES DEL A2---
${JSON.stringify(unitsSummary, null, 2)}`,
      },
    ],
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens

  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch?.[1]) {
    jsonStr = jsonMatch[1]
  }

  const parsed = parseLlmJson(content) as {
    coverage_pct?: number
    orphan_count?: number
    orphan_paragraphs?: { index: number; text: string; reason: string }[]
    non_coverable?: { index: number; text: string; reason: string }[]
    pass?: boolean
  }

  return {
    coveragePct: parsed.coverage_pct ?? 0,
    orphanCount: parsed.orphan_count ?? 0,
    orphanParagraphs: parsed.orphan_paragraphs ?? [],
    nonCoverable: parsed.non_coverable ?? [],
    pass: parsed.pass ?? false,
    inputTokens,
    outputTokens,
  }
}
