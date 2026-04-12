'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function CreateCourseForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fecha minima: mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deadline }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al crear el curso')
        return
      }

      // Redirigir al curso recién creado (en S2 será la entrevista del A12)
      router.push(`/courses/${data.data.id}`)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="course-name" className="block text-sm mb-1">
          Nombre del curso
        </label>
        <input
          id="course-name"
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="Ej: Capital social — Bourdieu, Coleman, Putnam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="w-full sm:w-44">
        <label htmlFor="course-deadline" className="block text-sm mb-1">
          Fecha límite
        </label>
        <input
          id="course-deadline"
          type="date"
          required
          min={minDate}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        {loading ? 'Creando...' : 'Crear'}
      </button>

      {error && (
        <p role="alert" className="text-red-600 text-sm sm:self-center">
          {error}
        </p>
      )}
    </form>
  )
}
