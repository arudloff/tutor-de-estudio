/**
 * POST /api/tts
 *
 * Convierte texto a voz usando OpenAI TTS.
 * Retorna audio MP3.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { env } from '@/lib/env'
import { checkRateLimit } from '@/lib/utils/rate-limiter'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`tts:${user.id}`, 15, 60)
  if (!rl.allowed) return NextResponse.json({ error: `Rate limited. Wait ${rl.resetInSeconds}s` }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (!body?.text) {
    return NextResponse.json({ error: 'text required' }, { status: 400 })
  }

  // Limitar texto a 4096 chars (limite de OpenAI TTS)
  const text = (body.text as string).slice(0, 4096)

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // nova: voz femenina natural, buena en español
      input: text,
      speed: 1.0,
    })

    const audioBuffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'public, max-age=3600', // cachear 1 hora
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('[tts] error:', msg.slice(0, 200))
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
