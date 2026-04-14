import { parseLlmJson } from '@/lib/utils/parse-llm-json'
/**
 * A2 — Analista semantico (descomposicion en unidades de sentido)
 *
 * Recibe el texto completo del PDF (del A1) y produce:
 * - Unidades de sentido a granularidad de proposicion
 * - Glosario jerarquizado (CRITICO/IMPORTANTE/COMPLEMENTARIO)
 * - Esqueleto argumentativo
 * - Grafo de prerequisitos
 *
 * Know-how heredado de SILA internalizado en el prompt (D12).
 * Usa Claude Opus por razonamiento profundo sobre textos densos.
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

export interface SenseUnit {
  name: string
  description: string
  source_spans: { start_paragraph: number; end_paragraph: number; text_excerpt: string }[]
  prerequisites: string[] // nombres de otras unidades que son prerequisito
  glossary_weight: 'critical' | 'important' | 'complementary'
}

export interface A2Result {
  units: SenseUnit[]
  paragraphs: { index: number; text: string; is_substantive: boolean }[]
  inputTokens: number
  outputTokens: number
}

export async function runA2(
  fullText: string,
  pdfFilename: string,
  orphanFeedback?: string
): Promise<A2Result> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const orphanContext = orphanFeedback
    ? `\n\nATENCION: El agente A10 (verificador de cobertura) encontro parrafos huerfanos en la iteracion anterior. Debes crear unidades para cubrirlos o justificar su exclusion. Parrafos huerfanos:\n${orphanFeedback}`
    : ''

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL_OPUS,
    max_tokens: 16000,
    system: `Eres el agente A2 de Socrates, un tutor doctoral. Tu trabajo es descomponer un texto academico en unidades de sentido siguiendo la metodologia heredada de SILA (Sistema Integrado de Lectura Academica).

Produce un JSON con esta estructura:
{
  "units": [
    {
      "name": "nombre corto de la unidad (3-8 palabras)",
      "description": "descripcion de 2-3 oraciones de que proposicion o conjunto de proposiciones captura esta unidad",
      "source_spans": [{"start_paragraph": 0, "end_paragraph": 2, "text_excerpt": "primeras 50 palabras del span..."}],
      "prerequisites": ["nombre de unidad prerequisito", ...],
      "glossary_weight": "critical|important|complementary"
    }
  ],
  "paragraphs": [
    {"index": 0, "text": "primeras 100 palabras del parrafo...", "is_substantive": true}
  ]
}

Reglas de analisis (know-how SILA internalizado):
1. Granularidad: cada unidad captura UNA proposicion o conjunto coherente de proposiciones. Un parrafo puede generar 1-3 unidades.
2. Glosario jerarquizado (SILA § C): CRITICAL = sin el, el argumento colapsa. IMPORTANT = necesario para comprension plena. COMPLEMENTARY = enriquece pero no es central.
3. Prerequisites: si entender la unidad B requiere haber entendido la unidad A, marca A como prerequisito de B.
4. Esqueleto argumentativo (SILA § A.2): la lista de unidades en orden debe reflejar el flujo argumental del autor.
5. Cobertura: CADA parrafo sustantivo del texto debe estar cubierto por al menos una unidad. Los parrafos no sustantivos (encabezados, bibliografia, agradecimientos, numeracion) se marcan como is_substantive=false.
6. En "paragraphs", lista TODOS los parrafos del texto (separados por doble newline) con su indice, las primeras 100 palabras, y si son sustantivos o no.

Responde SOLO con el JSON.`,
    messages: [
      {
        role: 'user',
        content: `Analiza el siguiente texto academico del PDF "${pdfFilename}" y produce las unidades de sentido:${orphanContext}\n\n---TEXTO---\n${fullText}`,
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
    units?: SenseUnit[]
    paragraphs?: { index: number; text: string; is_substantive: boolean }[]
  }

  return {
    units: parsed.units ?? [],
    paragraphs: parsed.paragraphs ?? [],
    inputTokens,
    outputTokens,
  }
}
