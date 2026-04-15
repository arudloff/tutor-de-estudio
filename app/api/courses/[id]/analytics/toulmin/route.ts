/**
 * GET /api/courses/:id/analytics/toulmin
 *
 * Returns Toulmin argumentation analysis for a course:
 * - Component frequency (how often each appears)
 * - Weakest component (recommendation)
 * - Trend over time
 * - Argumentation completeness score
 *
 * D1: Always filters by course_id + user_id (defense-in-depth).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: { id: string }
}

const COMPONENTS = ['claim', 'data', 'warrant', 'backing', 'qualifier', 'rebuttal'] as const
type ToulminComponent = typeof COMPONENTS[number]

// Personalized recommendations per missing component
const RECOMMENDATIONS: Record<ToulminComponent, string> = {
  claim: 'Intenta formular afirmaciones claras y explícitas sobre lo que entiendes del tema.',
  data: 'Apoya tus afirmaciones con datos concretos, ejemplos o evidencia del texto.',
  warrant: 'Explica POR QUÉ tu evidencia apoya tu afirmación — haz el razonamiento explícito.',
  backing: 'Fortalece tus argumentos citando teorías, autores o principios que respalden tu razonamiento.',
  qualifier: 'Matiza tus afirmaciones — ¿en qué contextos aplica? ¿tiene límites?',
  rebuttal: 'Considera posibles objeciones o excepciones a tu argumento antes de que otros las planteen.',
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  const admin = createAdminClient()

  const { data: analyses, error } = await admin
    .from('turn_analysis')
    .select('toulmin_claim, toulmin_data, toulmin_warrant, toulmin_backing, toulmin_qualifier, toulmin_rebuttal, toulmin_summary, created_at')
    .eq('course_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[analytics/toulmin] Query error:', { courseId: params.id }, error)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }

  const items = analyses ?? []

  // Component frequency: count how many turns include each component
  const frequency: Record<ToulminComponent, number> = {
    claim: 0, data: 0, warrant: 0, backing: 0, qualifier: 0, rebuttal: 0,
  }
  for (const a of items) {
    if (a.toulmin_claim) frequency.claim++
    if (a.toulmin_data) frequency.data++
    if (a.toulmin_warrant) frequency.warrant++
    if (a.toulmin_backing) frequency.backing++
    if (a.toulmin_qualifier) frequency.qualifier++
    if (a.toulmin_rebuttal) frequency.rebuttal++
  }

  // Frequency as percentages
  const frequencyPct: Record<ToulminComponent, number> = { ...frequency }
  if (items.length > 0) {
    for (const c of COMPONENTS) {
      frequencyPct[c] = Math.round((frequency[c]! / items.length) * 100)
    }
  }

  // Weakest component (lowest frequency)
  let weakest: ToulminComponent = 'rebuttal'
  let lowestPct = 101
  for (const c of COMPONENTS) {
    if (frequencyPct[c]! < lowestPct) {
      lowestPct = frequencyPct[c]!
      weakest = c
    }
  }

  // Completeness score: avg components per turn / 6, normalized 0-1
  const avgComponents = items.length > 0
    ? items.reduce((sum, a) => {
        let count = 0
        if (a.toulmin_claim) count++
        if (a.toulmin_data) count++
        if (a.toulmin_warrant) count++
        if (a.toulmin_backing) count++
        if (a.toulmin_qualifier) count++
        if (a.toulmin_rebuttal) count++
        return sum + count
      }, 0) / items.length
    : 0
  const completenessScore = Math.round((avgComponents / 6) * 100) / 100

  // Trend: components present per turn
  const trend = items.map((a, idx) => ({
    index: idx + 1,
    components: {
      claim: a.toulmin_claim,
      data: a.toulmin_data,
      warrant: a.toulmin_warrant,
      backing: a.toulmin_backing,
      qualifier: a.toulmin_qualifier,
      rebuttal: a.toulmin_rebuttal,
    },
    created_at: a.created_at,
  }))

  return NextResponse.json({
    data: {
      total_turns: items.length,
      frequency,
      frequency_pct: frequencyPct,
      completeness_score: completenessScore,
      weakest_component: weakest,
      recommendation: RECOMMENDATIONS[weakest],
      trend,
    },
  })
}
