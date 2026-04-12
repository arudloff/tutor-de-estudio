/**
 * POST /api/courses/:id/pdfs
 *
 * Sube un PDF al curso. Valida tipo y tamaño. Persiste en Supabase Storage.
 *
 * AC-5.1: upload exitoso → 201 + pdf row con state=uploaded, role=principal
 * AC-5.2: archivo no-PDF → 400
 * AC-5.3: archivo >50MB → 413
 * AC-5.4: bucket privado sin acceso publico
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar curso y estado
  const { data: course } = await supabase
    .from('course')
    .select('id, state')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.state !== 'poa_captured' && course.state !== 'corpus_loaded') {
    return NextResponse.json(
      { error: 'Course must have POA confirmed before uploading PDFs' },
      { status: 409 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // AC-5.2: solo PDFs
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 })
  }

  // AC-5.3: limite de tamaño
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large, max 50 MB' },
      { status: 413 }
    )
  }

  const admin = createAdminClient()
  const pdfId = crypto.randomUUID()
  const storagePath = `${user.id}/${params.id}/${pdfId}.pdf`

  // Subir a Supabase Storage (bucket privado)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from('pdfs')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    // eslint-disable-next-line no-console
    console.error('[pdfs/upload] storage error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  // Crear fila en BD
  const { data: pdf, error: dbError } = await admin
    .from('pdf')
    .insert({
      id: pdfId,
      course_id: params.id,
      filename: file.name,
      size_bytes: file.size,
      mime_type: 'application/pdf',
      storage_path: storagePath,
      role: 'principal',
      state: 'uploaded',
    })
    .select('id, filename, size_bytes, role, state, created_at')
    .single()

  if (dbError) {
    // eslint-disable-next-line no-console
    console.error('[pdfs/upload] db error:', dbError)
    // Limpiar archivo subido
    await admin.storage.from('pdfs').remove([storagePath])
    return NextResponse.json({ error: 'Failed to register PDF' }, { status: 500 })
  }

  // Transicionar curso si es necesario
  if (course.state === 'poa_captured') {
    await admin.from('course').update({ state: 'corpus_loaded' }).eq('id', params.id)
  }

  return NextResponse.json({ data: pdf }, { status: 201 })
}
