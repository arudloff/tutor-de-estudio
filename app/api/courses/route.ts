/**
 * /api/courses
 *
 * GET  — lista cursos del usuario autenticado (filtrado por RLS + defense-in-depth)
 * POST — crea un curso nuevo con nombre + deadline
 *
 * AC-2.1: crear curso exitoso → 201 + { id, state: "draft" }
 * AC-2.2: deadline pasado → 400
 * AC-2.3: RLS impide ver cursos de otros usuarios (verificado por tests adversariales)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateCourseSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must be at most 200 characters'),
  deadline: z.string().refine(
    (val) => {
      const d = new Date(val)
      return !isNaN(d.getTime()) && d > new Date()
    },
    { message: 'Deadline must be a valid future date' }
  ),
})

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Defense-in-depth: filtramos por user_id en código además de confiar en RLS (D5)
  const { data: courses, error } = await supabase
    .from('course')
    .select('id, name, deadline, state, mode, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[courses/GET] error:', { error, userId: user.id })
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: courses }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateCourseSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid input'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { name, deadline } = parsed.data

  // Defense-in-depth: seteamos user_id explícitamente (no confiamos solo en RLS)
  const { data: course, error } = await supabase
    .from('course')
    .insert({
      user_id: user.id,
      name,
      deadline,
      state: 'draft',
      mode: 'examen',
    })
    .select('id, name, deadline, state, mode, created_at')
    .single()

  if (error) {
    // El CHECK constraint de deadline futuro también lo atrapa en la BD
    if (error.message.includes('course_deadline_future')) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      )
    }
    // eslint-disable-next-line no-console
    console.error('[courses/POST] error:', { error, userId: user.id })
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: course }, { status: 201 })
}
