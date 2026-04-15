/**
 * /courses/:id/analytics — Dashboard de metacognición (D2)
 *
 * Blocks 1, 2, 5:
 * 1. Progreso vs deadline (velocidad, proyección, alerta at_risk)
 * 2. IBC (Índice de Brecha Cognitiva)
 * 5. Convergencia + ZDP
 *
 * Server component that fetches data and renders client blocks.
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

interface Props {
  params: { id: string }
}

export default async function AnalyticsPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('course')
    .select('id, name, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) notFound()

  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      <nav className="mb-6 flex items-baseline justify-between">
        <div>
          <a
            href={`/courses/${params.id}/learn`}
            className="text-sm text-accent underline"
          >
            ← Volver a estudiar
          </a>
          <h1 className="mt-1 text-xl font-serif font-medium text-primary">
            {course.name}
          </h1>
          <p className="text-sm text-muted">Dashboard de metacognición</p>
        </div>
      </nav>

      <DashboardClient courseId={params.id} />
    </main>
  )
}
