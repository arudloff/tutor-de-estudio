'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
}

export function ProcessButton({ courseId }: Props) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  async function handleProcess() {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseId}/process`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar')
        return
      }

      setStarted(true)
      // Poll progress every 5 seconds
      pollProgress()
    } catch {
      setError('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  async function pollProgress() {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/process`)
        if (!res.ok) return

        const { data } = await res.json() as {
          data: { state: string; current_step: string; progress_pct: number }
        }

        if (data.state === 'completed') {
          clearInterval(interval)
          router.refresh()
        } else if (data.state === 'failed' || data.state === 'fail_review') {
          clearInterval(interval)
          setError(`Procesamiento falló: ${data.current_step}`)
          setStarted(false)
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000)
  }

  if (started) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">
          Procesando tu material...
        </p>
        <p className="text-sm text-amber-700">
          Esto puede tomar 5-15 minutos. Socrates está extrayendo el texto,
          analizando los conceptos, verificando cobertura y diseñando las
          lecciones calibradas a tu objetivo. Puedes dejar esta página abierta.
        </p>
        <div className="mt-3 w-full bg-amber-200 rounded-full h-2">
          <div className="bg-amber-500 rounded-full h-2 animate-pulse" style={{ width: '60%' }} />
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleProcess}
        disabled={processing}
        className="rounded bg-accent text-white px-6 py-3 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
      >
        {processing ? 'Iniciando...' : 'Procesar material'}
      </button>
      <p className="text-xs text-muted mt-2">
        Usa créditos de Anthropic (~$5-8) y OpenAI (~$1-2). Toma 5-15 minutos.
      </p>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
