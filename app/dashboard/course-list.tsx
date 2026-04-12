'use client'

interface Course {
  id: string
  name: string
  deadline: string
  state: string
  mode: string
  created_at: string
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Borrador',
  poa_captured: 'POA capturado',
  corpus_loaded: 'Material subido',
  ingestion_ready: 'Listo para procesar',
  ingesting: 'Procesando...',
  active: 'Activo',
  fail_review: 'Requiere revisión',
  paused: 'Pausado',
  completed: 'Completado',
  archived: 'Archivado',
}

export function CourseList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <div className="rounded border border-dashed border-stone-300 p-8 text-center">
        <p className="text-muted text-sm">
          No tienes cursos todavía. Crea uno arriba para empezar.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {courses.map((course) => (
        <li key={course.id}>
          <a
            href={`/courses/${course.id}`}
            className="block rounded border border-stone-200 p-4 hover:border-accent hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="font-medium">{course.name}</h3>
              <span className="text-xs text-muted bg-stone-100 rounded px-2 py-0.5">
                {STATE_LABELS[course.state] ?? course.state}
              </span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-muted">
              <span>Fecha límite: {new Date(course.deadline).toLocaleDateString('es-CL')}</span>
              <span>Modo: {course.mode}</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}
