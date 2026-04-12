/**
 * Setup comun para todos los tests.
 * - Carga variables de entorno dummy para que `lib/env.ts` no falle al import
 * - Estas variables NUNCA son valores reales
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-' + 'x'.repeat(40)
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-' + 'x'.repeat(40)
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-' + 'x'.repeat(40)
process.env.OPENAI_API_KEY = 'sk-test-' + 'x'.repeat(40)
process.env.ADMIN_EMAIL = 'admin@example.test'
process.env.NODE_ENV = 'test'
