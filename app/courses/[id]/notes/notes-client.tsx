'use client'

/**
 * Notes client — list, search, filter, create, edit, delete.
 * D6: Full CRUD UI for learner personal notes.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react'

interface Note {
  id: string
  title: string | null
  content: string
  tags: string[]
  unit_id: string | null
  is_conceptual_change: boolean
  created_at: string
  updated_at: string
}

interface Unit {
  id: string
  name: string
}

interface Props {
  courseId: string
  units: Unit[]
}

export function NotesClient({ courseId, units }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filterTag) params.set('tag', filterTag)
    if (filterUnit) params.set('unit_id', filterUnit)
    params.set('limit', '50')

    try {
      const res = await fetch(`/api/courses/${courseId}/notes?${params}`)
      if (!res.ok) return
      const json = await res.json()
      setNotes(json.data ?? [])
      setTotal(json.metadata?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [courseId, search, filterTag, filterUnit])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  // Collect all unique tags from loaded notes for the filter dropdown
  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort()

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en notas..."
          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
          aria-label="Buscar notas"
        />
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="rounded border border-stone-300 px-3 py-2 text-sm"
          aria-label="Filtrar por unidad"
        >
          <option value="">Todas las unidades</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
            aria-label="Filtrar por tag"
          >
            <option value="">Todos los tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Create button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="mb-4 rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          + Nueva nota
        </button>
      )}

      {/* Create form */}
      {showCreate && (
        <NoteForm
          courseId={courseId}
          units={units}
          onSaved={() => { setShowCreate(false); fetchNotes() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Notes count */}
      <p className="text-xs text-muted mb-3">
        {loading ? 'Cargando...' : `${total} nota${total !== 1 ? 's' : ''}`}
      </p>

      {/* Notes list */}
      {!loading && notes.length === 0 && (
        <div className="rounded border border-stone-200 bg-stone-50 p-8 text-center">
          <p className="text-sm text-muted mb-2">No hay notas todavía.</p>
          <p className="text-xs text-muted">
            Crea tu primera nota mientras estudias para anclar ideas importantes.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id}>
            {editingId === note.id ? (
              <NoteForm
                courseId={courseId}
                units={units}
                existingNote={note}
                onSaved={() => { setEditingId(null); fetchNotes() }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <NoteCard
                note={note}
                unitName={units.find((u) => u.id === note.unit_id)?.name}
                onEdit={() => setEditingId(note.id)}
                onDelete={async () => {
                  if (!confirm('¿Eliminar esta nota?')) return
                  await fetch(`/api/courses/${courseId}/notes?id=${note.id}`, { method: 'DELETE' })
                  fetchNotes()
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Note Card ───────────────────────────────────────────────

function NoteCard({
  note,
  unitName,
  onEdit,
  onDelete,
}: {
  note: Note
  unitName?: string
  onEdit: () => void
  onDelete: () => void
}) {
  const date = new Date(note.created_at).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <article className="rounded border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-medium text-primary">
            {note.title ?? 'Sin título'}
            {note.is_conceptual_change && (
              <span className="ml-1.5 text-xs text-amber-600" title="Cambio conceptual">
                cambio conceptual
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
            <time dateTime={note.created_at}>{date}</time>
            {unitName && <span>· {unitName}</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-100"
            aria-label="Editar nota"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
            aria-label="Eliminar nota"
          >
            Eliminar
          </button>
        </div>
      </div>

      <p className="text-sm text-stone-700 whitespace-pre-wrap line-clamp-4">
        {note.content}
      </p>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

// ─── Note Form (create + edit) ───────────────────────────────

function NoteForm({
  courseId,
  units,
  existingNote,
  onSaved,
  onCancel,
}: {
  courseId: string
  units: Unit[]
  existingNote?: Note
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(existingNote?.title ?? '')
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [tagsInput, setTagsInput] = useState(existingNote?.tags.join(', ') ?? '')
  const [unitId, setUnitId] = useState(existingNote?.unit_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!existingNote

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
      const body = isEdit
        ? { id: existingNote.id, title: title || undefined, content, tags, unit_id: unitId || null }
        : { title: title || undefined, content, tags, unit_id: unitId || undefined }

      const res = await fetch(`/api/courses/${courseId}/notes`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Error al guardar')
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-accent/30 bg-accent/5 p-4 mb-4"
    >
      <h3 className="text-sm font-medium text-primary mb-3">
        {isEdit ? 'Editar nota' : 'Nueva nota'}
      </h3>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        maxLength={200}
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-accent"
        aria-label="Título de la nota"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu nota aquí..."
        rows={4}
        maxLength={10000}
        required
        className="w-full rounded border border-stone-300 px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-accent resize-y"
        aria-label="Contenido de la nota"
      />

      <div className="flex flex-col gap-2 sm:flex-row mb-3">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Tags separados por coma"
          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
          aria-label="Tags de la nota"
        />
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="rounded border border-stone-300 px-3 py-2 text-sm"
          aria-label="Vincular a unidad"
        >
          <option value="">Sin unidad</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="text-red-600 text-xs mb-2">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="rounded bg-accent text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-accent/90"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear nota'}
        </button>
      </div>
    </form>
  )
}
