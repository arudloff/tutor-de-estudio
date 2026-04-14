/**
 * POST /api/transcribe
 *
 * Recibe audio grabado del navegador y lo transcribe con OpenAI Whisper.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const audioFile = formData.get('audio')

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json({ error: 'No audio file' }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('[transcribe] error:', msg)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
