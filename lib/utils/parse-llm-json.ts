/**
 * Extrae y parsea JSON de la respuesta de un LLM.
 *
 * Los modelos a veces envuelven el JSON en ```json ... ```,
 * o agregan texto antes/despues. Esta funcion maneja todos los casos.
 */
export function parseLlmJson<T = Record<string, unknown>>(raw: string): T {
  let str = raw.trim()

  // Caso 1: ```json ... ```
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch?.[1]) {
    str = codeBlockMatch[1].trim()
  }

  // Caso 2: empieza con ``` sin cierre capturado
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
  }

  // Caso 3: hay texto antes del JSON (buscar primer { o [)
  if (!str.startsWith('{') && !str.startsWith('[')) {
    const firstBrace = str.indexOf('{')
    const firstBracket = str.indexOf('[')
    const start = firstBrace >= 0 && firstBracket >= 0
      ? Math.min(firstBrace, firstBracket)
      : Math.max(firstBrace, firstBracket)
    if (start >= 0) {
      str = str.slice(start)
    }
  }

  // Caso 4: hay texto despues del JSON (buscar ultimo } o ])
  if (str.includes('}') || str.includes(']')) {
    const lastBrace = str.lastIndexOf('}')
    const lastBracket = str.lastIndexOf(']')
    const end = Math.max(lastBrace, lastBracket)
    if (end >= 0) {
      str = str.slice(0, end + 1)
    }
  }

  return JSON.parse(str) as T
}
