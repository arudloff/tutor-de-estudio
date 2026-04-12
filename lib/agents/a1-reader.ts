/**
 * A1 — Lector (extraccion de texto de PDFs)
 *
 * Usa GPT-4o vision para extraer texto completo + estructura del PDF.
 * En MVP-1 recibe el PDF como base64 y devuelve texto plano + TOC.
 */

import OpenAI from 'openai'
import { env } from '@/lib/env'

interface A1Result {
  fullText: string
  toc: { title: string; page: number }[]
  pageCount: number
  inputTokens: number
  outputTokens: number
}

export async function runA1(pdfBase64: string, filename: string): Promise<A1Result> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL_VISION,
    max_tokens: 16000,
    messages: [
      {
        role: 'system',
        content: `Eres el agente A1 de Socrates, un sistema de tutoria doctoral. Tu unico trabajo es extraer el texto completo de un PDF academico y su estructura.

Produce un JSON con exactamente esta estructura:
{
  "full_text": "todo el texto del PDF, preservando parrafos y estructura de secciones",
  "toc": [{"title": "titulo de seccion", "page": 1}, ...],
  "page_count": N
}

Reglas:
- Extrae TODO el texto, incluyendo notas al pie. No resumas ni omitas nada.
- Preserva la estructura de parrafos (separados por doble newline).
- El TOC incluye solo secciones y subsecciones principales.
- Si no puedes leer alguna pagina, indicalo con [ILEGIBLE pagina N].
- Responde SOLO con el JSON, sin texto adicional.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extrae el texto completo y la estructura del PDF "${filename}".`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${pdfBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  const inputTokens = response.usage?.prompt_tokens ?? 0
  const outputTokens = response.usage?.completion_tokens ?? 0

  // Extraer JSON del contenido (puede tener markdown wrapping)
  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch?.[1]) {
    jsonStr = jsonMatch[1]
  }

  const parsed = JSON.parse(jsonStr) as {
    full_text?: string
    toc?: { title: string; page: number }[]
    page_count?: number
  }

  return {
    fullText: parsed.full_text ?? '',
    toc: parsed.toc ?? [],
    pageCount: parsed.page_count ?? 0,
    inputTokens,
    outputTokens,
  }
}
