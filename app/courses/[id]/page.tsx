import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { id: string }
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Borrador — pendiente entrevista del tutor',
  poa_captured: 'Objetivo capturado — sube tu material',
  corpus_loaded: 'Material subido — listo para procesar',
  ingestion_ready: 'Listo para procesar',
  ingesting: 'Procesando tu material...',
  active: 'Activo — puedes empezar a estudiar',
  fail_review: 'Requiere tu revisión',
  paused: 'Pausado',
  completed: 'Completado',
  archived: 'Archivado',
}

export default async function CoursePage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: course } = await supabase
    .from('course')
    .select('id, name, deadline, state, mode, created_at')
    .eq('id', params.id)
    .eq('user_id', user.id) // defense-in-depth
    .single()

  if (!course) {
    notFound()
  }

  const daysRemaining = Math.ceil(
    (new Date(course.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6">
        <a href="/dashboard" className="text-sm text-accent underline">
          ← Mis cursos
        </a>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-serif tracking-tight">{course.name}</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted">
          <span>
            {STATE_LABELS[course.state] ?? course.state}
          </span>
          <span>
            {daysRemaining > 0
              ? `${daysRemaining} días restantes`
              : 'Fecha límite pasada'}
          </span>
        </div>
      </header>

      {course.state === 'draft' && (
        <section className="rounded border border-accent/30 bg-accent/5 p-6">
          <h2 className="text-lg font-medium mb-2">Siguiente paso: conocerte</h2>
          <p className="text-sm text-muted mb-4">
            Antes de subir material, Socrates necesita entender quién eres,
            qué objetivo tienes con este curso, y qué ya sabes del tema.
            Esto calibra toda la experiencia a tu contexto real.
          </p>
          <p className="text-sm font-medium text-accent">
            La entrevista del tutor estará disponible en el Sprint S2.
          </p>
        </section>
      )}

      {course.state === 'active' && (
        <section className="rounded border border-stone-200 p-6">
          <h2 className="text-lg font-medium mb-2">Sesión de aprendizaje</h2>
          <p className="text-sm text-muted">
            Las sesiones de aprendizaje estarán disponibles en el Sprint S5.
          </p>
        </section>
      )}
    </main>
  )
}
