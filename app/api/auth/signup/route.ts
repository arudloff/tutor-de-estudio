/**
 * POST /api/auth/signup
 *
 * Crea una cuenta nueva. Verifica primero que el email este en la whitelist
 * (tabla invited_users). Sin whitelist match → 403 (D6: multi-usuario controlado).
 *
 * AC-1.1: sign-up exitoso de email invitado → 201 + JWT
 * AC-1.2: sign-up rechazado de email NO invitado → 403
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // Verificar whitelist con admin client (bypasa RLS)
  const admin = createAdminClient()
  const { data: invited, error: whitelistError } = await admin
    .from('invited_users')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (whitelistError) {
    // eslint-disable-next-line no-console
    console.error('[signup] whitelist check error:', { error: whitelistError })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }

  if (!invited) {
    // AC-1.2: email NOT in whitelist → 403
    return NextResponse.json(
      { error: 'Email not in whitelist' },
      { status: 403 }
    )
  }

  // Crear usuario via Supabase Auth
  const { data: signupData, error: signupError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true, // Skip email confirmation for controlled whitelist
  })

  if (signupError) {
    if (signupError.message.includes('already been registered')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }
    // eslint-disable-next-line no-console
    console.error('[signup] create user error:', { error: signupError })
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }

  // Actualizar signed_up_at en whitelist
  await admin
    .from('invited_users')
    .update({ signed_up_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())

  // Sign in para generar sesion JWT
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context
          }
        },
      },
    }
  )

  const { error: signinError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  })

  if (signinError) {
    // eslint-disable-next-line no-console
    console.error('[signup] auto-signin error:', { error: signinError })
    // User was created but auto-signin failed — still return 201
  }

  return NextResponse.json(
    { id: signupData.user.id, email: signupData.user.email },
    { status: 201 }
  )
}
