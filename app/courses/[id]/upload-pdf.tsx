'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
}

export function UploadPdf({ courseId }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/courses/${courseId}/pdfs`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al subir el archivo')
        return
      }

      setSuccess(true)
      setFile(null)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="pdf-file" className="block text-sm font-medium mb-1">
            Selecciona un PDF (máximo 50 MB)
          </label>
          <input
            id="pdf-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setSuccess(false)
              setError(null)
            }}
            className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
          />
        </div>

        {file && (
          <p className="text-xs text-muted">
            {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}

        {error && (
          <p role="alert" className="text-red-600 text-sm">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm">PDF subido correctamente.</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir PDF'}
          </button>
        </div>
      </form>
    </div>
  )
}
