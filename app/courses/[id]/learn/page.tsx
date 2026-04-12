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

  const nextUnit = plan?.next_unit_id
    ? units?.find((u) => u.id === plan.next_unit_id)
    : units?.find((u) => u.state === 'available')

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6 flex items-baseline justify-between">
        <a href={`/courses/${params.id}`} className="text-sm text-accent underline">
          ← {course.name}
        </a>
        <div className="text-sm text-muted">
          {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
          {plan?.at_risk && (
            <span className="ml-2 text-red-600 font-medium">En riesgo</span>
          )}
        </div>
      </nav>

      {/* Barra de progreso */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span>{masteredCount} de {totalUnits} unidades dominadas</span>
          <span>{Math.round(plan?.progress_pct ?? 0)}%</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div
            className="bg-accent rounded-full h-2 transition-all"
            style={{ width: `${plan?.progress_pct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Lista de unidades */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Unidades</h2>
        <ul className="space-y-2">
          {(units ?? []).map((unit) => (
            <li
              key={unit.id}
              className={`rounded border px-4 py-3 flex items-baseline justify-between ${
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
      </div>

      {/* Siguiente sesion */}
      {nextUnit && (
        <SessionView
          courseId={params.id}
          unitId={nextUnit.id}
          unitName={nextUnit.name}
        />
      )}

      {!nextUnit && masteredCount === totalUnits && totalUnits > 0 && (
        <div className="rounded border border-green-300 bg-green-50 p-6 text-center">
          <h2 className="text-lg font-medium text-green-800 mb-2">
            Curso completado
          </h2>
          <p className="text-sm text-green-700">
            Has dominado todas las unidades de este curso. Puedes revisar
            la evidencia de cada acreditación desde la lista de unidades.
          </p>
        </div>
      )}
    </main>
  )
}
