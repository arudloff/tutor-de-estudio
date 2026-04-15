import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SessionView } from './session-view'

interface Props {
  params: { id: string }
}

export default async function LearnPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('course')
    .select('id, name, state, deadline')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) notFound()
  if (course.state !== 'active') redirect(`/courses/${params.id}`)

  const admin = createAdminClient()

  // Dashboard data
  const { data: units } = await admin
    .from('sense_unit')
    .select('id, name, state')
    .eq('course_id', params.id)

  const { data: plan } = await admin
    .from('learning_plan')
    .select('next_unit_id, progress_pct, at_risk, gap_days')
    .eq('course_id', params.id)
    .maybeSingle()

  const totalUnits = units?.length ?? 0
  const masteredCount = units?.filter((u) => u.state === 'mastered').length ?? 0
  const daysRemaining = Math.ceil(
    (new Date(course.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  // M2: Cleanup de sesiones trabadas
  // 1. Sesiones >30 min en started/in_progress → abandoned + liberar unidad
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: stuckSessions } = await admin
    .from('learning_session')
    .select('id, unit_id')
    .eq('course_id', params.id)
    .in('state', ['started', 'in_progress'])
    .lt('updated_at', thirtyMinAgo)

  if (stuckSessions && stuckSessions.length > 0) {
    for (const s of stuckSessions) {
      await admin.from('learning_session').update({ state: 'abandoned' }).eq('id', s.id)
      await admin.from('sense_unit').update({ state: 'available' }).eq('id', s.unit_id)
    }
  }

  // 2. Sesiones en 'evaluated' (PASS dado pero artifact no enviado) → closed
  const { data: evaluatedSessions } = await admin
    .from('learning_session')
    .select('id')
    .eq('course_id', params.id)
    .eq('state', 'evaluated')

  if (evaluatedSessions && evaluatedSessions.length > 0) {
    for (const s of evaluatedSessions) {
      await admin.from('learning_session').update({ state: 'closed' }).eq('id', s.id)
    }
  }

  // Buscar sesión activa (en progreso)
  const { data: activeSession } = await admin
    .from('learning_session')
    .select('id, unit_id, state')
    .eq('course_id', params.id)
    .in('state', ['started', 'in_progress', 'evaluated'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const activeUnit = activeSession
    ? units?.find((u) => u.id === activeSession.unit_id)
    : null

  const nextUnit = activeUnit
    ?? (plan?.next_unit_id
      ? units?.find((u) => u.id === plan.next_unit_id)
      : units?.find((u) => u.state === 'available'))

  const hasActiveSession = !!activeSession

  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <nav className="mb-4 flex items-baseline justify-between">
        <a href={`/courses/${params.id}`} className="text-sm text-accent underline">
          ← {course.name}
        </a>
        <div className="flex items-baseline gap-3 text-sm text-muted">
          <a
            href={`/courses/${params.id}/analytics`}
            className="text-accent underline"
          >
            Dashboard
          </a>
          <a
            href={`/courses/${params.id}/notes`}
            className="text-accent underline"
          >
            Notas
          </a>
          {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
          {plan?.at_risk && (
            <span className="ml-2 text-red-600 font-medium">En riesgo</span>
          )}
        </div>
      </nav>

      {/* Barra de progreso compacta */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>{masteredCount}/{totalUnits} dominadas</span>
          <span>{Math.round(plan?.progress_pct ?? 0)}%</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-1.5">
          <div
            className="bg-accent rounded-full h-1.5 transition-all"
            style={{ width: `${plan?.progress_pct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Sesión activa PRIMERO (cuando hay una) */}
      {nextUnit && (
        <div className="mb-6">
          <SessionView
            courseId={params.id}
            unitId={nextUnit.id}
            unitName={nextUnit.name}
            existingSessionId={activeSession?.id ?? null}
          />
        </div>
      )}

      {!nextUnit && masteredCount === totalUnits && totalUnits > 0 && (
        <div className="rounded border border-green-300 bg-green-50 p-6 text-center mb-6">
          <h2 className="text-lg font-medium text-green-800 mb-2">
            Curso completado
          </h2>
          <p className="text-sm text-green-700">
            Has dominado todas las unidades de este curso.
          </p>
        </div>
      )}

      {/* Lista de unidades — colapsada durante sesión activa */}
      <details open={!hasActiveSession}>
        <summary className="text-sm font-medium cursor-pointer mb-3 text-stone-600 hover:text-stone-800">
          Unidades ({masteredCount}/{totalUnits})
        </summary>
        <ul className="space-y-1.5">
          {(units ?? []).map((unit) => (
            <li
              key={unit.id}
              className={`rounded border px-3 py-2 flex items-baseline justify-between text-sm ${
                unit.state === 'mastered'
                  ? 'border-green-200 bg-green-50'
                  : unit.state === 'available'
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-stone-200'
              }`}
            >
              <span className="text-sm">{unit.name}</span>
              <span className="text-xs text-muted">
                {unit.state === 'mastered' && 'Dominada'}
                {unit.state === 'available' && 'Disponible'}
                {unit.state === 'in_session' && 'En sesión'}
                {unit.state === 'needs_review' && 'Revisar'}
                {unit.state === 'analyzed' && 'Procesada'}
                {unit.state === 'audited_ok' && 'Lista'}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </main>
  )
}
