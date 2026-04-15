'use client'

/**
 * Dashboard client wrapper — fetches analytics data ONCE and passes to blocks.
 * Fixes audit issue #6: triple-fetch eliminated.
 */

import { useEffect, useState } from 'react'
import { ProgressBlock } from './progress-block'
import { IbcBlock } from './ibc-block'
import { ConvergenceBlock } from './convergence-block'

interface DashboardData {
  course_name: string
  course_state: string
  deadline: string
  block_1_progress: Record<string, unknown>
  block_2_ibc: Record<string, unknown>
  block_5_convergence: Record<string, unknown>
}

export function DashboardClient({ courseId }: { courseId: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${courseId}/analytics/dashboard`)
        if (!res.ok) throw new Error('Failed to load dashboard')
        const json = await res.json()
        setData(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProgressBlock data={loading ? null : data?.block_1_progress ?? null} loading={loading} />
      <IbcBlock data={loading ? null : data?.block_2_ibc ?? null} loading={loading} />
      <ConvergenceBlock data={loading ? null : data?.block_5_convergence ?? null} loading={loading} />
    </div>
  )
}
