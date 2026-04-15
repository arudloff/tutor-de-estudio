/**
 * GET + POST /api/courses/:id/notes
 *
 * D6: Learner personal notes — CRUD with tags, search, filtering.
 * Always filters by course_id + user_id (defense-in-depth).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

// Zod schema for note creation
const CreateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1, 'Content is required').max(10000),
  tags: z.array(z.string().max(50)).max(20).default([]),
  unit_id: z.string().uuid().optional(),
  misconception_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  source_pdf_id: z.string().uuid().optional(),
  source_span: z.object({
    from_paragraph: z.number().int().min(0),
    to_paragraph: z.number().int().min(0),
  }).optional(),
})

// Zod schema for note update
const UpdateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  unit_id: z.string().uuid().nullable().optional(),
  misconception_id: z.string().uuid().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  source_pdf_id: z.string().uuid().nullable().optional(),
  source_span: z.object({
    from_paragraph: z.number().int().min(0),
    to_paragraph: z.number().int().min(0),
  }).nullable().optional(),
})

/**
 * GET /api/courses/:id/notes?tag=X&unit_id=Y&q=search_term
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Defense-in-depth: verify course ownership
  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const url = new URL(request.url)
  const tag = url.searchParams.get('tag')
  const unitId = url.searchParams.get('unit_id')
  const search = url.searchParams.get('q')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

  const admin = createAdminClient()

  let query = admin
    .from('learner_note')
    .select('id, title, content, tags, unit_id, misconception_id, session_id, source_pdf_id, source_span, is_conceptual_change, created_at, updated_at', { count: 'exact' })
    .eq('course_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tag) {
    query = query.contains('tags', [tag])
  }
  if (unitId) {
    query = query.eq('unit_id', unitId)
  }
  // Sanitize search input: strip PostgREST special chars to prevent filter injection
  if (search) {
    const sanitized = search.replace(/[%_(),."\\]/g, '')
    if (sanitized.length > 0) {
      query = query.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
    }
  }

  const { data: notes, count, error } = await query

  if (error) {
    console.error('[notes/GET] Query error:', { courseId: params.id }, error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }

  return NextResponse.json({
    data: notes ?? [],
    metadata: { total: count ?? 0, limit, offset },
  })
}

/**
 * POST /api/courses/:id/notes
 * Create a new note.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = CreateNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const noteData = parsed.data

  // Detect #cambio_conceptual pattern
  const isConceptualChange = noteData.tags.includes('cambio_conceptual') ||
    noteData.content.includes('#cambio_conceptual')

  const admin = createAdminClient()

  const { data: note, error } = await admin
    .from('learner_note')
    .insert({
      course_id: params.id,
      user_id: user.id,
      title: noteData.title ?? null,
      content: noteData.content,
      tags: noteData.tags,
      unit_id: noteData.unit_id ?? null,
      misconception_id: noteData.misconception_id ?? null,
      session_id: noteData.session_id ?? null,
      source_pdf_id: noteData.source_pdf_id ?? null,
      source_span: noteData.source_span ?? null,
      is_conceptual_change: isConceptualChange,
    })
    .select('id, title, content, tags, created_at')
    .single()

  if (error) {
    console.error('[notes/POST] Insert error:', { courseId: params.id }, error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }

  return NextResponse.json({ data: note }, { status: 201 })
}

/**
 * PATCH /api/courses/:id/notes
 * Update an existing note.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = UpdateNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { id: noteId, ...updateFields } = parsed.data

  const admin = createAdminClient()

  // Build update payload with conceptual change detection
  const updatePayload: Record<string, unknown> = { ...updateFields }
  if (updateFields.content !== undefined || updateFields.tags !== undefined) {
    // If only tags changed, fetch current content to evaluate correctly
    let content = updateFields.content ?? ''
    let tags = updateFields.tags ?? []
    if (updateFields.content === undefined || updateFields.tags === undefined) {
      const { data: current } = await admin
        .from('learner_note')
        .select('content, tags')
        .eq('id', noteId)
        .eq('course_id', params.id)
        .eq('user_id', user.id)
        .single()
      if (current) {
        if (updateFields.content === undefined) content = current.content
        if (updateFields.tags === undefined) tags = current.tags
      }
    }
    updatePayload.is_conceptual_change = tags.includes('cambio_conceptual') ||
      content.includes('#cambio_conceptual')
  }

  // Verify note belongs to this user+course
  const { data: note, error } = await admin
    .from('learner_note')
    .update(updatePayload)
    .eq('id', noteId)
    .eq('course_id', params.id)
    .eq('user_id', user.id)
    .select('id, title, content, tags, updated_at')
    .single()

  if (error || !note) {
    return NextResponse.json({ error: 'Note not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ data: note })
}

/**
 * DELETE /api/courses/:id/notes?id=NOTE_ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const noteId = url.searchParams.get('id')
  if (!noteId) return NextResponse.json({ error: 'Note ID required' }, { status: 400 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('learner_note')
    .delete()
    .eq('id', noteId)
    .eq('course_id', params.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[notes/DELETE] Error:', { courseId: params.id, noteId }, error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true } })
}
