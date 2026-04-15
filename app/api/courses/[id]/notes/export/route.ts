/**
 * GET /api/courses/:id/notes/export
 *
 * D6: Export all learner notes as a markdown document.
 * Groups by unit, includes tags and metadata.
 * Always filters by course_id + user_id (defense-in-depth).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: course } = await supabase
    .from('course')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const admin = createAdminClient()

  // Fetch notes with unit names
  const { data: notes, error } = await admin
    .from('learner_note')
    .select('id, title, content, tags, unit_id, is_conceptual_change, source_span, created_at')
    .eq('course_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[notes/export] Query error:', { courseId: params.id }, error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }

  // Fetch unit names for grouping
  const unitIds = [...new Set((notes ?? []).filter((n) => n.unit_id).map((n) => n.unit_id!))]
  const unitNames = new Map<string, string>()
  if (unitIds.length > 0) {
    const { data: units } = await admin
      .from('sense_unit')
      .select('id, name')
      .in('id', unitIds)
    for (const u of units ?? []) {
      unitNames.set(u.id, u.name)
    }
  }

  // Build markdown
  const lines: string[] = []
  lines.push(`# Notas — ${course.name}`)
  lines.push(`> Exportado: ${new Date().toISOString().split('T')[0]}`)
  lines.push('')

  // Group by unit
  const byUnit = new Map<string | null, typeof notes>()
  for (const note of notes ?? []) {
    const key = note.unit_id
    if (!byUnit.has(key)) byUnit.set(key, [])
    byUnit.get(key)!.push(note)
  }

  // Unlinked notes first
  const unlinked = byUnit.get(null)
  if (unlinked && unlinked.length > 0) {
    lines.push('## Notas generales')
    lines.push('')
    for (const note of unlinked) {
      appendNote(lines, note, unitNames)
    }
  }

  // Then by unit
  for (const [unitId, unitNotes] of byUnit.entries()) {
    if (unitId === null) continue
    const unitName = unitNames.get(unitId) ?? 'Unidad desconocida'
    lines.push(`## ${unitName}`)
    lines.push('')
    for (const note of unitNotes!) {
      appendNote(lines, note, unitNames)
    }
  }

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="notas-${course.name.replace(/[^a-zA-Z0-9]/g, '_')}.md"`,
    },
  })
}

function appendNote(
  lines: string[],
  note: { title: string | null; content: string; tags: string[]; is_conceptual_change: boolean; created_at: string },
  _unitNames: Map<string, string>
): void {
  const date = note.created_at.split('T')[0]
  const title = note.title ?? 'Sin título'
  const changeMarker = note.is_conceptual_change ? ' 🔄' : ''
  lines.push(`### ${title}${changeMarker}`)
  lines.push(`*${date}*`)
  if (note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.map((t) => `\`${t}\``).join(', ')}`)
  }
  lines.push('')
  lines.push(note.content)
  lines.push('')
  lines.push('---')
  lines.push('')
}
