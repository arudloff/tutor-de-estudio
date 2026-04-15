/**
 * GET /api/courses/:id/analytics/solo
 *
 * Returns SOLO taxonomy analysis for a course:
 * - Distribution of levels across all turns
 * - Trend over time (chronological)
 * - Dominant level
 * - Per-unit breakdown
 *
 * D1: Always filters by course_id + user_id (defense-in-depth for scalability).
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

  // Defense-in-depth: verify course ownership even with RLS
  const { data: course } = await supabase
    .from('course')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const admin = createAdminClient()

  // Fetch all turn analyses for this course, ordered chronologically
  const { data: analyses, error } = await admin
    .from('turn_analysis')
    .select('solo_level, solo_label, solo_evidence, unit_id, turn_number, created_at')
    .eq('course_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[analytics/solo] Query error:', { courseId: params.id }, error)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }

  const items = analyses ?? []

  // Distribution: count per level
  const distribution: Record<string, number> = {
    prestructural: 0,
    unistructural: 0,
    multistructural: 0,
    relational: 0,
    extended_abstract: 0,
  }
  for (const a of items) {
    distribution[a.solo_label] = (distribution[a.solo_label] ?? 0) + 1
  }

  // Dominant level (mode)
  let dominantLabel = 'prestructural'
  let maxCount = 0
  for (const [label, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count
      dominantLabel = label
    }
  }

  // Trend: chronological array of {turn, level, label}
  const trend = items.map((a, idx) => ({
    index: idx + 1,
    solo_level: a.solo_level,
    solo_label: a.solo_label,
    created_at: a.created_at,
  }))

  // Average level
  const avgLevel = items.length > 0
    ? items.reduce((sum, a) => sum + a.solo_level, 0) / items.length
    : 0

  return NextResponse.json({
    data: {
      total_turns: items.length,
      distribution,
      dominant_label: dominantLabel,
      average_level: Math.round(avgLevel * 100) / 100,
      trend,
    },
  })
}
