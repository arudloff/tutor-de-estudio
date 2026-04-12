/**
 * Validacion de variables de entorno al startup (Twelve-Factor, D13 estandar).
 * Falla rapido si falta algo critico. Mensaje claro que indica que variable falta.
 *
 * Uso: importar `env` en lugar de usar process.env directamente.
 */

import { z } from 'zod'

const EnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_DB_URL: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(20),
  ANTHROPIC_MODEL_OPUS: z.string().default('claude-opus-4-6'),
  ANTHROPIC_MODEL_SONNET: z.string().default('claude-sonnet-4-6'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_MODEL_VISION: z.string().default('gpt-4o'),

  // Orquestacion (opcionales hasta S3)
  TRIGGER_API_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email(),
})

export type Env = z.infer<typeof EnvSchema>

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env)

  if (!result.success) {
    // Log estructurado: describe que falta y por que
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    // eslint-disable-next-line no-console
    console.error(
      '[env] Configuracion invalida. Variables que fallan:\n' +
        issues +
        '\n\nRevisa .env.local o .env.example para ver los valores esperados.'
    )

    // Fallar rapido — no arrancar con config incompleta
    throw new Error('Invalid environment configuration')
  }

  return result.data
}

/**
 * Schema del subset de env disponible en el cliente.
 * Solo contiene variables NEXT_PUBLIC_*. Se valida independientemente de `env`
 * porque en el cliente las demas variables no estan disponibles.
 */
const PublicEnvSchema = EnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

function parsePublicEnv(): PublicEnv {
  const result = PublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    // eslint-disable-next-line no-console
    console.error(
      '[env/client] Configuracion publica invalida:\n' + issues
    )
    throw new Error('Invalid public environment configuration')
  }

  return result.data
}

/**
 * Env validada. Si alguna variable critica falta, esto lanza al primer import.
 *
 * IMPORTANTE: en el cliente (browser) solo las NEXT_PUBLIC_* estan disponibles.
 * En el cliente, usar `publicEnv` (abajo) en lugar de `env`.
 */
export const env: Env =
  typeof window === 'undefined'
    ? parseEnv()
    : // En el cliente, solo devolvemos las NEXT_PUBLIC_* validadas
      (parsePublicEnv() as unknown as Env)

/**
 * Subconjunto de env seguro para exponer al cliente.
 * Validado con Zod tanto en servidor como en cliente.
 */
export const publicEnv = {
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  appUrl: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
}
