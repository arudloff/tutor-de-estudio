/**
 * Setup comun para todos los tests.
 * - Carga variables de entorno dummy para que `lib/env.ts` no falle al import
 * - Estas variables NUNCA son valores reales
 */

const testEnv: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  ANTHROPIC_API_KEY: 'sk-ant-test-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  OPENAI_API_KEY: 'sk-test-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  ADMIN_EMAIL: 'admin@example.test',
  NODE_ENV: 'test',
}

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = value
}
