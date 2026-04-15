'use client'

/**
 * QuickNote — compact note-taking during a Socratic session (D6).
 *
 * Appears as a small button next to the input. Opens an inline form
 * that auto-links the note to the current unit + session.
 */

import { useState, type FormEvent } from 'react'

interface Props {
  courseId: string
  unitId: string
  sessionId: string | null
}

export function QuickNote({ courseId, unitId, sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setSaving(true)
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      const res = await fetch(`/api/courses/${courseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          tags,
          unit_id: unitId,
          session_id: sessionId ?? undefined,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar nota')

      setContent('')
      setTagsInput('')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setOpen(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-stone-300 px-2 py-1.5 text-xs text-stone-500 hover:bg-stone-50"
        title="Anotar algo sobre esta unidad"
        aria-label="Crear nota rápida"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    )
  }

  if (saved) {
    return (
      <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
        Nota guardada
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-accent/30 bg-accent/5 p-3"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Anota tu reflexión..."
        rows={2}
        maxLength={10000}
        required
        autoFocus
        className="w-full rounded border border-stone-300 px-2 py-1.5 text-xs mb-1.5 focus:ring-2 focus:ring-accent resize-y"
        aria-label="Contenido de la nota rápida"
      />
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="Tags (coma separados, ej: duda, cambio_conceptual)"
        className="w-full rounded border border-stone-300 px-2 py-1.5 text-xs mb-2 focus:ring-2 focus:ring-accent"
        aria-label="Tags de la nota"
      />
      {error && <p role="alert" className="text-red-600 text-xs mb-1">{error}</p>}
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => { setOpen(false); setContent(''); setTagsInput('') }}
          className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded bg-accent text-white px-3 py-1 text-xs font-medium disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
