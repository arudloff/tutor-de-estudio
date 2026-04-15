/**
 * Landing page — static, no auth calls.
 * Middleware handles redirect to /dashboard for authenticated users.
 */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <header className="px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-primary tracking-tight">
          Socrates
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-accent font-medium">
          Aprende con diálogo, no con resúmenes
        </p>
        <p className="mt-4 text-base text-muted max-w-xl mx-auto leading-relaxed">
          Un tutor doctoral basado en IA que te hace mejores preguntas
          — no mejores respuestas.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/signup"
            className="inline-block rounded bg-accent text-white px-6 py-3 text-sm font-medium hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Empezar
          </a>
          <a
            href="/login"
            className="inline-block rounded border border-stone-300 text-stone-600 px-6 py-3 text-sm font-medium hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Ya tengo cuenta
          </a>
        </div>
      </header>

      {/* ── El problema ── */}
      <section className="px-6 py-16 bg-primary/[0.03]" aria-labelledby="problema">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="problema" className="sr-only">El problema</h2>
          <blockquote className="text-base sm:text-lg leading-relaxed text-primary/80 italic">
            &quot;La misma IA puede producir{' '}
            <strong className="text-accent">+127% de aprendizaje</strong>{' '}
            o <strong className="text-red-700">-17% de daño cognitivo</strong>.
            La diferencia no es la tecnología — es la instrucción.&quot;
          </blockquote>
          <cite className="mt-4 block text-sm text-muted not-italic">
            Bastani et al., 2025, <span className="italic">PNAS</span>
          </cite>
        </div>
      </section>

      {/* ── 6 Ideas fuerza ── */}
      <section className="px-6 py-16 max-w-5xl mx-auto" aria-labelledby="ideas">
        <h2 id="ideas" className="text-xl font-serif font-medium text-primary text-center mb-10">
          Qué hace diferente a Socrates
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <IdeaCard
            title="La IA que enseña preguntando"
            description="No genera resúmenes. Te desafía con un problema, escucha tu intento, y dialoga hasta que demuestres comprensión real."
          />
          <IdeaCard
            title="Calibrado a tu objetivo"
            description="Antes de abrir un PDF, Socrates entiende quién eres y qué necesitas lograr. Todo se calibra a eso."
            source="Ausubel"
          />
          <IdeaCard
            title="Tu texto, tu diálogo"
            description="No estudias un resumen. Dialogas directamente con las palabras del autor, guiado por un tutor socrático."
          />
          <IdeaCard
            title="Comprensión que persiste"
            description="Diseñado para que aprendas de verdad, no para que dependas de la app. Mini-tests verifican retención real."
          />
          <IdeaCard
            title="Ves cómo piensas"
            description="Dashboard de metacognición: profundidad SOLO, calidad argumentativa Toulmin, velocidad de convergencia, red de conceptos."
          />
          <IdeaCard
            title="Ciencia, no marketing"
            description="6 principios pedagógicos + 6 constructos de evaluación + 12 agentes de IA + auditoría de 15 dimensiones."
          />
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="px-6 py-16 bg-primary/[0.03]" aria-labelledby="flujo">
        <div className="max-w-3xl mx-auto">
          <h2 id="flujo" className="text-xl font-serif font-medium text-primary text-center mb-10">
            Cómo funciona una sesión
          </h2>
          <ol className="flex flex-col gap-0">
            <FlowStep number={1} title="Desafío" description="Socrates te presenta un problema antes de cualquier instrucción." />
            <FlowStep number={2} title="Tu intento" description="Respondes con lo que sabes. Sin miedo al error — es fallo productivo." />
            <FlowStep number={3} title="Instrucción del autor" description="Ahora sí: la explicación canónica, condensada del texto fuente." />
            <FlowStep number={4} title="Diálogo socrático" description="Preguntas abiertas que verifican si realmente comprendiste." />
            <FlowStep number={5} title="Lectura del texto" description="Pasajes del autor que confirman, desafían o matizan tu respuesta." />
            <FlowStep number={6} title="Producción con cita" description="Produces un texto propio anclado en las palabras del autor." />
            <FlowStep number={7} title="Reflexión" description="Revisas cómo pensaste, qué cambió y qué queda por aprender." last />
          </ol>
        </div>
      </section>

      {/* ── Para quién ── */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center" aria-labelledby="audiencia">
        <h2 id="audiencia" className="text-xl font-serif font-medium text-primary mb-6">
          Para quién es Socrates
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <AudienceTag label="Doctorandos" />
          <AudienceTag label="Estudiantes de máster" />
          <AudienceTag label="Profesionales que estudian" />
          <AudienceTag label="Investigadores" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10 border-t border-stone-200 text-center">
        <p className="text-sm text-muted leading-relaxed max-w-xl mx-auto">
          Operacionalización del artículo A9 del cluster doctoral
          <br className="hidden sm:block" />
          <em>&quot;Coexistir con lo que nos excede&quot;</em>
        </p>
        <p className="mt-3 text-sm text-muted">
          Alejandro Rudloff — Universidad de Talca, 2026
        </p>
        <a
          href="https://github.com/arudloff/tutor-de-estudio"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-accent underline hover:text-accent/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}

/* ── Components ── */

function IdeaCard({
  title,
  description,
  source,
}: {
  title: string
  description: string
  source?: string
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-medium text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">
        {description}
        {source && (
          <span className="text-xs text-accent ml-1">({source})</span>
        )}
      </p>
    </article>
  )
}

function FlowStep({
  number,
  title,
  description,
  last = false,
}: {
  number: number
  title: string
  description: string
  last?: boolean
}) {
  return (
    <li className="flex gap-4">
      {/* Vertical line + circle */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-xs font-medium shrink-0">
          {number}
        </div>
        {!last && <div className="w-px flex-1 bg-stone-200 my-1" />}
      </div>
      {/* Content */}
      <div className={last ? 'pb-0' : 'pb-6'}>
        <h3 className="text-sm font-medium text-primary">{title}</h3>
        <p className="text-sm text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </li>
  )
}

function AudienceTag({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-sm text-accent">
      {label}
    </span>
  )
}
