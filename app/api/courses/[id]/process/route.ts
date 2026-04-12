/**
 * POST /api/courses/:id/process
 *
 * Dispara el pipeline de ingestion (A1 → A2 → A10) para todos los PDFs
 * del curso. Retorna el job ID para polling de progreso.
 *
 * AC-4.1: bloquea si no hay PDFs subidos → 409
 * AC-4.2: transiciona curso a ingesting → 200 + job_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runIngestionPipeline } from '@/lib/pipeline/ingest'

interface RouteParams {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: course } = await supabase
    .from('course')
    .select('id, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.state !== 'corpus_loaded' && course.state !== 'ingestion_ready') {
    return NextResponse.json(
      { error: 'Course must have PDFs uploaded to process' },
      { status: 409 }
    )
  }

  const admin = createAdminClient()

  // Verificar que hay al menos 1 PDF
  const { data: pdfs } = await admin
    .from('pdf')
    .select('id, filename, storage_path, state')
    .eq('course_id', params.id)

  if (!pdfs || pdfs.length === 0) {
    return NextResponse.json({ error: 'No PDFs uploaded' }, { status: 409 })
  }

  // Crear job de ingestion
  const { data: job, error: jobError } = await admin
    .from('ingestion_job')
    .insert({
      course_id: params.id,
      state: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (jobError || !job) {
    // eslint-disable-next-line no-console
    console.error('[process] create job error:', jobError)
    return NextResponse.json({ error: 'Failed to create ingestion job' }, { status: 500 })
  }

  // Transicionar curso
  await admin.from('course').update({ state: 'ingesting' }).eq('id', params.id)

  // Cargar POA del curso (D19: el pipeline necesita el POA para calibrar A3)
  const { data: poa } = await admin
    .from('learner_objective_profile')
    .select('learner_role, discipline, research_field, target_challenge, target_capability, success_signal, known_authors, theoretical_traditions')
    .eq('course_id', params.id)
    .single()

  if (!poa) {
    return NextResponse.json({ error: 'POA not found or not confirmed' }, { status: 409 })
  }

  // Ejecutar pipeline en background (fire and forget en MVP-1)
  // En sprints futuros esto se migra a Trigger.dev/Inngest
  const pdf = pdfs[0]! // MVP-1: 1 PDF por curso
  const { data: fileData } = await admin.storage
    .from('pdfs')
    .download(pdf.storage_path)

  if (fileData) {
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const base64 = buffer.toString('base64')

    // Ejecutar en background sin bloquear la respuesta
    runIngestionPipeline(
      admin,
      params.id,
      pdf.id,
      base64,
      pdf.filename,
      job.id,
      poa,
      (progress) => {
        // eslint-disable-next-line no-console
        console.log(`[ingest] ${progress.step} iter=${progress.iteration}: ${progress.message}`)
      }
    )
      .then(async (result) => {
        if (result.success) {
          await admin.from('course').update({ state: 'active' }).eq('id', params.id)
        }
      })
      .catch(async (error) => {
        // eslint-disable-next-line no-console
        console.error('[ingest] pipeline error:', error)
        await admin.from('ingestion_job').update({ state: 'failed', error_msg: String(error) }).eq('id', job.id)
        await admin.from('course').update({ state: 'fail_review' }).eq('id', params.id)
      })
  }

  return NextResponse.json(
    { data: { job_id: job.id, status: 'running' } },
    { status: 200 }
  )
}

/**
 * GET /api/courses/:id/process
 *
 * Consulta el estado del job de ingestion.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: job } = await supabase
    .from('ingestion_job')
    .select('id, state, current_step, progress_pct, error_msg, started_at, completed_at')
    .eq('course_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!job) {
    return NextResponse.json({ error: 'No ingestion job found' }, { status: 404 })
  }

  return NextResponse.json({ data: job }, { status: 200 })
}
