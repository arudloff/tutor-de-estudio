/**
 * POST /api/auth/login
 *
 * Inicia sesion con email + password via Supabase Auth.
 *
 * AC-1.3: login exitoso → 200 + JWT (via cookie)
 * AC-1.4: login rechazado → 401 con mensaje genérico (no revela si el email existe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: Record<string, unknown> }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  })

  if (error) {
    // AC-1.4: mensaje genérico — NO revelar si el email existe o si es la password
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
