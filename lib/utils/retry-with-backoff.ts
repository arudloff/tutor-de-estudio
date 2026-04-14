/**
 * Ejecuta una funcion con retry y backoff para manejar rate limits de APIs LLM.
 *
 * El plan free de Anthropic tiene un limite de 30K tokens/min.
 * Un PDF de 4MB consume ~105K tokens, asi que necesitamos esperar entre llamadas.
 */

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    label?: string
    rateLimitWaitSec?: number
    errorWaitSec?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 5,
    label = 'api-call',
    rateLimitWaitSec = 90,
    errorWaitSec = 5,
  } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const isRateLimit = msg.includes('429') || msg.includes('rate_limit')

      // eslint-disable-next-line no-console
      console.error(`[${label}] Intento ${attempt}/${maxRetries}: ${msg.slice(0, 120)}`)

      if (attempt === maxRetries) throw error

      const waitSec = isRateLimit ? rateLimitWaitSec : errorWaitSec
      // eslint-disable-next-line no-console
      console.log(`[${label}] Esperando ${waitSec}s...`)
      await new Promise((r) => setTimeout(r, waitSec * 1000))
    }
  }

  throw new Error(`${label}: max retries exhausted`)
}
