/**
 * Rate limiter simple por IP para endpoints de IA (M4).
 *
 * Protege contra abuso de creditos de Anthropic/OpenAI.
 * Usa un Map en memoria (se resetea al reiniciar el servidor).
 * Para produccion con multiples instancias, usar Redis.
 */

const requestCounts = new Map<string, { count: number; resetAt: number }>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds }
  }

  if (entry.count >= maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  }
}
