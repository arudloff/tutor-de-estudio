'use client'

/**
 * Block 5 — Convergencia + ZDP
 *
 * Shows: avg turns to accreditation, ZDP calibration, per-unit detail.
 * Answers: "¿Estoy convergiendo más rápido?" and "¿La dificultad es adecuada?"
 */

interface ConvergenceData {
  avg_turns_to_pass: number | null
  total_completed_sessions: number
  total_passed: number
  total_failed: number
  convergence_by_unit: {
    unit_id: string
    unit_name: string
    turns: number
    result: string
  }[]
  zdp_calibration: 'too_easy' | 'optimal' | 'too_hard' | 'insufficient_data'
  zdp_interpretation: string
}

interface Props {
  data: Record<string, unknown> | null
  loading: boolean
}

export function ConvergenceBlock({ data: raw, loading }: Props) {
  if (loading) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 animate-pulse">
        <h2 className="text-base font-medium text-primary mb-4">Convergencia + ZDP</h2>
        <div className="h-20 bg-stone-100 rounded" />
      </section>
    )
  }

  if (!raw) return null

  const data = raw as unknown as ConvergenceData

  const zdpColor = data.zdp_calibration === 'optimal'
    ? 'border-green-200 bg-green-50 text-green-800'
    : data.zdp_calibration === 'too_easy'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : data.zdp_calibration === 'too_hard'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-stone-200 bg-stone-50 text-stone-600'

  return (
    <section
      className="rounded-lg border border-stone-200 bg-white p-5"
      aria-label="Convergencia y Zona de Desarrollo Próximo"
    >
      <h2 className="text-base font-medium text-primary mb-4">
        Convergencia + ZDP
      </h2>

      {data.total_completed_sessions === 0 ? (
        <p className="text-sm text-muted">
          Sin sesiones completadas todavía. La convergencia se calcula después de al menos 2 sesiones.
        </p>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            <StatCard
              label="Turnos promedio"
              value={data.avg_turns_to_pass !== null ? `${data.avg_turns_to_pass}` : '—'}
            />
            <StatCard label="Acreditadas" value={`${data.total_passed}`} />
            <StatCard label="No acreditadas" value={`${data.total_failed}`} />
            <StatCard
              label="Tasa de éxito"
              value={data.total_completed_sessions > 0
                ? `${Math.round((data.total_passed / data.total_completed_sessions) * 100)}%`
                : '—'}
            />
          </div>

          {/* ZDP calibration */}
          <div className={`rounded border px-4 py-3 text-sm mb-4 ${zdpColor}`} role="status">
            <strong>Calibración ZDP:</strong> {data.zdp_interpretation}
          </div>

          {/* Per-unit convergence */}
          {data.convergence_by_unit.length > 0 && (
            <details>
              <summary className="text-sm font-medium cursor-pointer text-stone-600 hover:text-stone-800">
                Detalle por unidad ({data.convergence_by_unit.length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {data.convergence_by_unit.map((u, idx) => (
                  <li
                    key={`${u.unit_id}-${idx}`}
                    className="flex items-center justify-between rounded border border-stone-100 px-3 py-2 text-sm"
                  >
                    <span className="truncate mr-2">{u.unit_name}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-muted">{u.turns} turnos</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        u.result === 'PASS'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {u.result}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-stone-100 bg-stone-50 px-3 py-2 text-center">
      <div className="text-lg font-medium text-primary">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
