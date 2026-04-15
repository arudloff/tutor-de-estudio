'use client'

/**
 * Block 1 — Progreso vs deadline
 *
 * Shows: progress bar, velocity, projection, at_risk alert.
 * Accessible: semantic HTML, ARIA labels, sufficient contrast.
 */

interface ProgressData {
  progress_pct: number
  mastered_count: number
  total_units: number
  days_remaining: number
  days_elapsed: number
  total_days: number
  velocity: number
  required_velocity: number | null
  projected_finish: string | null
  at_risk: boolean
  gap_days: number | null
}

interface Props {
  data: Record<string, unknown> | null
  loading: boolean
}

export function ProgressBlock({ data: raw, loading }: Props) {
  if (loading) return <BlockSkeleton title="Progreso" />
  if (!raw) return null

  const data = raw as unknown as ProgressData

  const progressWidth = Math.min(100, Math.max(0, data.progress_pct))
  const timeProgress = data.total_days > 0
    ? Math.round((data.days_elapsed / data.total_days) * 100)
    : 0

  return (
    <section
      className="rounded-lg border border-stone-200 bg-white p-5"
      aria-label="Progreso vs deadline"
    >
      <h2 className="text-base font-medium text-primary mb-4">
        Progreso vs deadline
      </h2>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>{data.mastered_count}/{data.total_units} unidades dominadas</span>
          <span>{Math.round(data.progress_pct)}%</span>
        </div>
        <div
          className="w-full bg-stone-100 rounded-full h-2.5"
          role="progressbar"
          aria-valuenow={Math.round(data.progress_pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso: ${Math.round(data.progress_pct)}%`}
        >
          <div
            className="bg-accent rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Time progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Tiempo transcurrido</span>
          <span>{data.days_remaining > 0 ? `${data.days_remaining} días restantes` : 'Vencido'}</span>
        </div>
        <div
          className="w-full bg-stone-100 rounded-full h-1.5"
          role="progressbar"
          aria-valuenow={timeProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiempo: ${timeProgress}% transcurrido`}
        >
          <div
            className={`rounded-full h-1.5 transition-all duration-500 ${
              data.at_risk ? 'bg-red-500' : 'bg-stone-400'
            }`}
            style={{ width: `${Math.min(100, timeProgress)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Velocidad"
          value={`${data.velocity}`}
          unit="uds/día"
        />
        <Stat
          label="Velocidad necesaria"
          value={data.required_velocity !== null ? `${data.required_velocity}` : '—'}
          unit="uds/día"
        />
        <Stat
          label="Proyección"
          value={data.projected_finish ?? 'Sin datos'}
          unit=""
        />
        <Stat
          label="Gap"
          value={data.gap_days !== null ? `${data.gap_days}` : '—'}
          unit="días"
        />
      </div>

      {/* Alert */}
      {data.at_risk && (
        <div
          className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <strong>En riesgo:</strong> Al ritmo actual no alcanzarás a completar el curso antes del deadline.
          {data.required_velocity !== null && (
            <span> Necesitas pasar de {data.velocity} a {data.required_velocity} unidades/día.</span>
          )}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-medium text-primary">{value}</div>
      <div className="text-xs text-muted">
        {unit && <span>{unit} · </span>}
        {label}
      </div>
    </div>
  )
}

function BlockSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 animate-pulse">
      <h2 className="text-base font-medium text-primary mb-4">{title}</h2>
      <div className="h-2.5 bg-stone-100 rounded-full mb-6" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-stone-100 rounded" />
        ))}
      </div>
    </section>
  )
}

function BlockError({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-medium text-primary mb-2">{title}</h2>
      <p className="text-sm text-red-700">{message}</p>
    </section>
  )
}
