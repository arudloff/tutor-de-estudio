/**
 * Tests adversariales de lib/env.ts
 *
 * Objetivo: verificar que la validacion de env FALLA correctamente cuando
 * falta una variable critica. Sin estos tests, podriamos tener una validacion
 * que silenciosamente pasa cuando no deberia (CHK-ENV-001).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('lib/env (validacion Zod)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restaurar env original despues de cada test
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key]
    }
    Object.assign(process.env, originalEnv)
  })

  it('PASS: parsea correctamente con todas las variables presentes', async () => {
    // Given todas las variables criticas estan en process.env (via tests/setup.ts)
    // When importamos lib/env
    const { env } = await import('@/lib/env')
    // Then el objeto env tiene los campos esperados
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(env.ANTHROPIC_MODEL_OPUS).toBe('claude-opus-4-6')
    expect(env.NODE_ENV).toBe('test')
  })

  it('FAIL adversarial: lanza si falta NEXT_PUBLIC_SUPABASE_URL', async () => {
    // Given la variable critica NO esta presente
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    // When intentamos importar lib/env
    // Then debe lanzar error (fail-fast)
    await expect(async () => await import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration/
    )
  })

  it('FAIL adversarial: lanza si ANTHROPIC_API_KEY es muy corta (bypass tentativo)', async () => {
    // Given alguien intenta poner una API key trivialmente corta para "pasar" la validacion
    process.env.ANTHROPIC_API_KEY = 'sk-'
    // When intentamos importar lib/env
    // Then debe lanzar (min 20 caracteres)
    await expect(async () => await import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration/
    )
  })

  it('FAIL adversarial: lanza si ADMIN_EMAIL no es email valido', async () => {
    // Given un ADMIN_EMAIL con formato invalido
    process.env.ADMIN_EMAIL = 'not-an-email'
    // When intentamos importar
    // Then debe lanzar
    await expect(async () => await import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration/
    )
  })

  it('FAIL adversarial: lanza si SUPABASE_SERVICE_ROLE_KEY falta', async () => {
    // Given falta la service role key (critica — permite bypasear RLS)
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    // When intentamos importar
    // Then debe lanzar
    await expect(async () => await import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration/
    )
  })

  it('FAIL adversarial: lanza si NEXT_PUBLIC_SUPABASE_URL no es URL valida', async () => {
    // Given una URL invalida (bypass tentativo con string arbitrario)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url'
    // When intentamos importar
    // Then debe lanzar
    await expect(async () => await import('@/lib/env')).rejects.toThrow(
      /Invalid environment configuration/
    )
  })
})
