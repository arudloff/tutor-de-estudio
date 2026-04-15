/**
 * /courses/:id/notes — Notas personales del aprendiz (D6)
 *
 * Server component: auth + course verification.
 * Client component: list, search, filter, create, edit, delete, export.
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NotesClient } from './notes-client'

interface Props {
  params: { id: string }
}

export default async function NotesPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('course')
    .select('id, name, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) notFound()

  // Fetch units for the filter dropdown
  const admin = createAdminClient()
  const { data: units } = await admin
    .from('sense_unit')
    .select('id, name')
    .eq('course_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <main className="mx-auto max-w-3xl px-6 py-6">
      <nav className="mb-6 flex items-baseline justify-between">
        <div>
          <a
            href={`/courses/${params.id}/learn`}
            className="text-sm text-accent underline"
          >
            ← Volver a estudiar
          </a>
          <h1 className="mt-1 text-xl font-serif font-medium text-primary">
            Mis notas
          </h1>
          <p className="text-sm text-muted">{course.name}</p>
        </div>
        <a
          href={`/api/courses/${params.id}/notes/export`}
          download
          className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
        >
          Exportar .md
        </a>
      </nav>

      <NotesClient
        courseId={params.id}
        units={(units ?? []).map((u) => ({ id: u.id, name: u.name }))}
      />
    </main>
  )
}
