import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseList } from './course-list'
import { CreateCourseForm } from './create-course-form'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: courses } = await supabase
    .from('course')
    .select('id, name, deadline, state, mode, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif tracking-tight">Mis cursos</h1>
          <p className="text-sm text-muted mt-1">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-muted underline hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4">Crear curso nuevo</h2>
        <CreateCourseForm />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">
          Cursos ({courses?.length ?? 0})
        </h2>
        <CourseList courses={courses ?? []} />
      </section>
    </main>
  )
}
