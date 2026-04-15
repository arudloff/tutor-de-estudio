'use client'

/**
 * Block 2 — IBC (Índice de Brecha Cognitiva)
 *
 * Shows: global IBC (0-1), interpretation, per-unit breakdown.
 * IBC = 1 - normalized_avg_SOLO. Higher = bigger gap.
 */

interface IbcData {
  ibc_global: number
  avg_solo_level: number
  total_analyzed_turns: number
  ibc_by_unit: {
    unit_id: string
    unit_name: string
    avg_solo: number
    ibc: number
    turns: number
  }[]
  interpretation: string
}

interface Props {
  data: Record<string, unknown> | null
  loading: boolean
}

export function IbcBlock({ data: raw, loading }: Props) {
  if (loading) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 animate-pulse">
        <h2 className="text-base font-medium text-primary mb-4">Brecha Cognitiva</h2>
        <div className="h-20 bg-stone-100 rounded" />
      </section>
    )
  }

  if (!raw) return null

  const data = raw as unknown as IbcData

  const ibcPct = Math.round(data.ibc_global * 100)
  const ibcColor = data.ibc_global > 0.7
    ? 'text-red-600'
    : data.ibc_global > 0.4
      ? 'text-amber-600'
      : data.ibc_global > 0.15
        ? 'text-accent'
        : 'text-green-600'

  const barColor = data.ibc_global > 0.7
    ? 'bg-red-500'
    : data.ibc_global > 0.4
      ? 'bg-amber-500'
      : data.ibc_global > 0.15
        ? 'bg-accent'
        : 'bg-green-500'

  return (
    <section
      className="rounded-lg border border-stone-200 bg-white p-5"
      aria-label="Índice de Brecha Cognitiva"
    >
      <h2 className="text-base font-medium text-primary mb-4">
        Índice de Brecha Cognitiva (IBC)
      </h2>

      {data.total_analyzed_turns === 0 ? (
        <p className="text-sm text-muted">
          Sin datos todavía. Completa al menos una sesión socrática para ver tu IBC.
        </p>
      ) : (
        <>
          {/* Global IBC */}
          <div className="flex items-center gap-4 mb-3">
            <div className={`text-3xl font-bold ${ibcColor}`}>
              {ibcPct}%
            </div>
            <div className="flex-1">
              <div
                className="w-full bg-stone-100 rounded-full h-3"
                role="meter"
                aria-valuenow={ibcPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Brecha cognitiva: ${ibcPct}%`}
              >
                <div
                  className={`${barColor} rounded-full h-3 transition-all duration-500`}
                  style={{ width: `${ibcPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Profundo</span>
                <span>Superficial</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted mb-4">
            {data.interpretation}
          </p>

          <div className="text-xs text-muted mb-2">
            Nivel SOLO promedio: {data.avg_solo_level}/5 · {data.total_analyzed_turns} turnos analizados
          </div>

          {/* Per-unit breakdown */}
          {data.ibc_by_unit.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm font-medium cursor-pointer text-stone-600 hover:text-stone-800">
                Por unidad ({data.ibc_by_unit.length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {data.ibc_by_unit.map((u) => (
                  <li
                    key={u.unit_id}
                    className="flex items-center justify-between rounded border border-stone-100 px-3 py-2 text-sm"
                  >
                    <span className="truncate mr-2">{u.unit_name}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-muted">SOLO {u.avg_solo}/5</span>
                      <span className={`font-medium ${
                        u.ibc > 0.7 ? 'text-red-600' : u.ibc > 0.4 ? 'text-amber-600' : 'text-accent'
                      }`}>
                        {Math.round(u.ibc * 100)}%
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
