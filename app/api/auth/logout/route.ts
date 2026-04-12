/**
 * POST /api/auth/logout
 *
 * Cierra la sesion del usuario.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true }, { status: 200 })
}
