import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterviewChat } from './interview-chat'
import { UploadPdf } from './upload-pdf'
import { ProcessButton } from './process-button'

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
        <section>
          <h2 className="text-lg font-medium mb-2">Conocerte antes de empezar</h2>
          <p className="text-sm text-muted mb-4">
            Antes de subir material, Socrates necesita entender quién eres,
            qué objetivo tienes con este curso, y qué ya sabes del tema.
            Esto calibra toda la experiencia a tu contexto real (Ausubel).
          </p>
          <InterviewChat courseId={course.id} />
        </section>
      )}

      {(course.state === 'poa_captured' || course.state === 'corpus_loaded') && (
        <section className="space-y-6">
          <div className="rounded border border-accent/30 bg-accent/5 p-6">
            <h2 className="text-lg font-medium mb-2">Sube tu material</h2>
            <p className="text-sm text-muted mb-4">
              Tu perfil de aprendizaje ha sido capturado. Ahora sube el PDF
              con el que vas a estudiar.
            </p>
            <UploadPdf courseId={course.id} />
          </div>

          {course.state === 'corpus_loaded' && (
            <div className="rounded border border-stone-200 p-6">
              <h2 className="text-lg font-medium mb-2">Material listo</h2>
              <p className="text-sm text-muted mb-4">
                Tu PDF está subido. Cuando estés listo, Socrates analizará el
                texto, creará las unidades de sentido y diseñará las lecciones
                calibradas a tu objetivo.
              </p>
              <ProcessButton courseId={course.id} />
            </div>
          )}
        </section>
      )}

      {course.state === 'ingesting' && (
        <section className="rounded border border-stone-200 p-6">
          <h2 className="text-lg font-medium mb-2">Procesando tu material...</h2>
          <p className="text-sm text-muted">
            Socrates está analizando tu PDF, creando las unidades de sentido
            y diseñando las lecciones calibradas a tu objetivo.
          </p>
        </section>
      )}

      {course.state === 'active' && (
        <section className="space-y-6">
          <div className="rounded border border-stone-200 p-6">
            <h2 className="text-lg font-medium mb-4">Tu progreso</h2>
            <p className="text-sm text-muted mb-2">
              Carga el dashboard para ver tu avance detallado.
            </p>
            <a
              href={`/courses/${course.id}/learn`}
              className="inline-block rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
            >
              Ir a estudiar
            </a>
          </div>
        </section>
      )}
    </main>
  )
}
