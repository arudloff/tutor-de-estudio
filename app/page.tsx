export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-serif tracking-tight">Socrates</h1>
        <p className="mt-2 text-muted">
          Tutor doctoral basado en IA — MVP-1 en construcción
        </p>
      </header>
      <section className="prose prose-stone">
        <p>
          Socrates es un sistema de tutoria basado en inteligencia artificial
          disenado para acelerar el aprendizaje doctoral sin generar deuda
          cognitiva.
        </p>
        <p>
          Este es el scaffold inicial del MVP-1 (Sprint S0). La funcionalidad
          completa se activara en los sprints siguientes (S1 auth, S2 POA,
          S3-S6 pipeline e interfaz de sesion).
        </p>
        <p className="text-sm text-muted">
          Estado del proyecto:{' '}
          <a href="https://github.com/arudloff/tutor-de-estudio" className="underline">
            arudloff/tutor-de-estudio
          </a>
        </p>
      </section>
    </main>
  )
}
