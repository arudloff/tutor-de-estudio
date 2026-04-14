'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  courseId: string
  unitId: string
  unitName: string
  existingSessionId: string | null
}

type SessionPhase = 'ready' | 'productive_failure' | 'dialog' | 'generative_task' | 'done'

// ============================================================
// Hook: dictado por voz (MediaRecorder + Whisper API)
// Con pre-warm de micrófono para eliminar delay de getUserMedia
// ============================================================
function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const callbackRef = useRef<((text: string) => void) | null>(null)
  const analyserCtxRef = useRef<AudioContext | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Pre-warmed stream: mantiene micrófono abierto para inicio instantáneo
  const warmStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  // Pre-warm: solicita mic una vez y lo mantiene listo (tracks en mute)
  const warmUp = useCallback(() => {
    if (warmStreamRef.current) return
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Mutear para no grabar ruido de fondo
        stream.getTracks().forEach((t) => { t.enabled = false })
        warmStreamRef.current = stream
      })
      .catch(() => {})
  }, [])

  const startListening = useCallback((onResult: (text: string, isFinal: boolean) => void, autoStopOnSilence = false) => {
    callbackRef.current = (text) => onResult(text, true)
    chunksRef.current = []

    const initRecorder = (stream: MediaStream) => {
      // Habilitar tracks
      stream.getTracks().forEach((t) => { t.enabled = true })

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Mutear tracks (no cerrar — mantener para reuso)
        stream.getTracks().forEach((t) => { t.enabled = false })
        // Limpiar silence detection
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        if (analyserCtxRef.current) {
          analyserCtxRef.current.close().catch(() => {})
          analyserCtxRef.current = null
        }

        if (chunksRef.current.length === 0) return

        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (res.ok) {
            const { text } = await res.json() as { text: string }
            if (text) callbackRef.current?.(text)
          }
        } catch {
          // Transcripción falló silenciosamente
        }
        setTranscribing(false)
        chunksRef.current = []
      }

      recorder.start()
      setListening(true)

      // Silence detection: auto-stop after 2s of silence
      if (autoStopOnSilence) {
        try {
          const audioContext = new AudioContext()
          analyserCtxRef.current = audioContext
          const source = audioContext.createMediaStreamSource(stream)
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 512
          source.connect(analyser)

          let silentFrames = 0
          let hasSpoken = false
          const dataArray = new Uint8Array(analyser.fftSize)

          const checkSilence = () => {
            if (recorder.state !== 'recording') return

            analyser.getByteTimeDomainData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i]! - 128) / 128
              sum += val * val
            }
            const rms = Math.sqrt(sum / dataArray.length)

            if (rms > 0.02) {
              hasSpoken = true
              silentFrames = 0
            } else {
              silentFrames++
            }

            // Auto-stop: 2s de silencio después de hablar (5 * 400ms)
            if (hasSpoken && silentFrames >= 5) {
              setListening(false)
              recorder.stop()
              return
            }

            silenceTimerRef.current = setTimeout(checkSilence, 400)
          }

          // 400ms de gracia antes de detectar silencio
          silenceTimerRef.current = setTimeout(checkSilence, 400)
        } catch {
          // Silence detection no disponible
        }
      }
    }

    // Usar stream pre-warmed si existe (inicio instantáneo)
    if (warmStreamRef.current && warmStreamRef.current.getTracks().length > 0) {
      initRecorder(warmStreamRef.current)
    } else {
      // Fallback: solicitar mic (primera vez o si el stream se perdió)
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          warmStreamRef.current = stream
          initRecorder(stream)
        })
        .catch(() => { setListening(false) })
    }
  }, [])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    setListening(false)
  }, [])

  return { listening, supported, startListening, stopListening, transcribing, warmUp }
}

// ============================================================
// Hook: texto a voz (OpenAI TTS — voz natural)
// Usa AudioContext para decodificación + reproducción sin gaps
// ============================================================
function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [loading, setLoading] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const onEndCallbackRef = useRef<(() => void) | null>(null)

  // AudioContext singleton — se reutiliza entre llamadas
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    // Reanudar si fue suspendido por política de autoplay
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text || loading) return

    // Detener audio anterior
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop() } catch { /* ya detenido */ }
      sourceNodeRef.current = null
    }

    onEndCallbackRef.current = onEnd ?? null
    setSpeaking(true)
    setLoading(true)

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        setSpeaking(false)
        setLoading(false)
        return
      }

      const arrayBuffer = await res.arrayBuffer()
      const ctx = getAudioCtx()

      // Decodificar MP3 → PCM (rápido, sin buffering del elemento <audio>)
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      // Crear source node y reproducir inmediatamente — sin gaps
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      sourceNodeRef.current = source

      source.onended = () => {
        setSpeaking(false)
        sourceNodeRef.current = null
        onEndCallbackRef.current?.()
        onEndCallbackRef.current = null
      }

      source.start(0)
    } catch {
      setSpeaking(false)
    }
    setLoading(false)
  }, [loading, getAudioCtx])

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop() } catch { /* ya detenido */ }
      sourceNodeRef.current = null
    }
    setSpeaking(false)
    onEndCallbackRef.current = null
  }, [])

  return { speaking, supported, speak, stop, autoSpeak, setAutoSpeak }
}

// ============================================================
// Componente principal — Layout tipo chat (WhatsApp)
// ============================================================
export function SessionView({ courseId, unitId, unitName, existingSessionId }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<SessionPhase>(existingSessionId ? 'dialog' : 'ready')
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId)
  const [problem, setProblem] = useState('')
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(!!existingSessionId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [task, setTask] = useState<{ id: string; prompt: string; max_words: number } | null>(null)
  const [artifact, setArtifact] = useState('')
  const [decision, setDecision] = useState<'PASS' | 'FAIL' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conversationMode, setConversationMode] = useState(false)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pendingAutoSendRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const speech = useSpeechRecognition()
  const tts = useTextToSpeech()

  const isActivePhase = phase === 'productive_failure' || phase === 'dialog'

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cargar historial si hay sesión existente
  useEffect(() => {
    if (!existingSessionId) return
    async function loadHistory() {
      try {
        const res = await fetch(`/api/sessions/${existingSessionId}/messages`)
        if (!res.ok) { setLoading(false); return }
        const { data } = await res.json() as {
          data: {
            state: string
            problem: string
            instruction: string
            generative_task: { id: string; prompt: string; max_words: number } | null
            messages: Message[]
          }
        }
        setProblem(data.problem)
        setInstruction(data.instruction)
        if (data.messages.length > 0) {
          setMessages(data.messages)
        }
        // Restaurar fase correcta
        if (data.state === 'evaluated') {
          setPhase('generative_task')
          if (data.generative_task) setTask(data.generative_task)
        } else if (data.state === 'started') {
          setPhase(data.messages.length > 0 ? 'productive_failure' : 'productive_failure')
        } else if (data.state === 'in_progress') {
          setPhase('dialog')
        } else if (data.state === 'closed') {
          setPhase('done')
          setDecision('PASS')
        }
      } catch {
        // Si falla, mostrar como nueva sesión
      }
      setLoading(false)
    }
    loadHistory()
  }, [existingSessionId])

  // Leer el desafio en voz alta al iniciarse
  useEffect(() => {
    if (phase === 'productive_failure' && problem && tts.autoSpeak) {
      tts.speak(problem)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, problem])

  // Auto-colapsar header después de los primeros mensajes
  useEffect(() => {
    if (messages.length >= 2 && !headerCollapsed) {
      setHeaderCollapsed(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  async function startSession() {
    setError(null)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: unitId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSessionId(data.data.session_id)
      setProblem(data.data.productive_failure_problem)
      setPhase('productive_failure')
    } catch { setError('Error de conexión') }
  }

  async function sendTurn(userMessage: string) {
    if (!sessionId) return
    setStreaming(true)
    setError(null)

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      // Timeout de 2 minutos — si el A4 no responde, desbloquear
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch(`/api/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const result = await res.json() as {
        data?: {
          response: string
          decision: string | null
          canonical_instruction: string | null
          generative_task: { id: string; prompt: string; max_words: number } | null
          rate_limited: boolean
        }
        error?: string
      }

      if (!res.ok || result.error) {
        setError(result.error ?? 'Error del tutor')
        return
      }

      const d = result.data!

      if (d.rate_limited) {
        setError(d.response)
        return
      }

      // Agregar respuesta del A4
      setMessages((prev) => [...prev, { role: 'assistant', content: d.response }])

      // Leer respuesta en voz alta
      if (tts.autoSpeak && d.response) {
        await tts.speak(d.response, () => {
          // Callback: TTS terminó de hablar
          // Modo conversación: activar mic con silence detection
          if (conversationMode && !d.decision) {
            speech.startListening((text) => {
              setInput((prev) => (prev + ' ' + text).trim())
              pendingAutoSendRef.current = true
            }, true) // autoStopOnSilence = true
          }
        })
      } else if (conversationMode && !d.decision && !tts.autoSpeak) {
        // Conversation mode sin voz: activar mic inmediatamente
        setTimeout(() => {
          speech.startListening((text) => {
            setInput((prev) => (prev + ' ' + text).trim())
            pendingAutoSendRef.current = true
          }, true)
        }, 500)
      }

      if (d.canonical_instruction) {
        setInstruction(d.canonical_instruction)
      }

      if (d.decision === 'PASS') {
        setDecision('PASS')
        if (d.generative_task) {
          setTask(d.generative_task)
          setPhase('generative_task')
        } else {
          // Sin tarea generativa → ir directo a done
          setPhase('done')
        }
      } else if (d.decision === 'FAIL') {
        setDecision('FAIL')
        setPhase('done')
      }

      if (phase === 'productive_failure') setPhase('dialog')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('El tutor tardó demasiado. Espera 1 minuto y envía tu mensaje de nuevo.')
      } else {
        setError('Error de conexión. Intenta de nuevo.')
      }
    }
    finally { setStreaming(false) }
  }

  async function submitArtifact() {
    if (!sessionId || !task) return
    setStreaming(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, content: artifact }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setPhase('done')
      router.refresh()
    } catch { setError('Error') }
    finally { setStreaming(false) }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    sendTurn(msg)
  }

  function toggleDictation() {
    if (speech.listening) {
      speech.stopListening()
      // En modo conversación, enviar automáticamente al detener
      if (conversationMode) {
        pendingAutoSendRef.current = true
      }
    } else {
      speech.startListening((text) => {
        setInput((prev) => (prev + ' ' + text).trim())
        if (conversationMode) {
          pendingAutoSendRef.current = true
        }
      }, conversationMode) // autoStopOnSilence en conversation mode
    }
  }

  // Auto-enviar cuando hay texto pendiente del modo conversación
  useEffect(() => {
    if (pendingAutoSendRef.current && !speech.listening && !speech.transcribing && input.trim()) {
      pendingAutoSendRef.current = false
      const msg = input.trim()
      setInput('')
      sendTurn(msg)
    }
  }, [speech.listening, speech.transcribing, input])

  // ============================================================
  // Subcomponentes
  // ============================================================

  function SpeakButton({ text }: { text: string }) {
    if (!tts.supported) return null
    return (
      <button
        type="button"
        onClick={() => {
          if (tts.speaking) {
            tts.stop()
          } else {
            tts.speak(text)
          }
        }}
        title={tts.speaking ? 'Detener' : 'Leer en voz alta'}
        className={`ml-2 transition-colors inline-flex items-center ${
          tts.speaking ? 'text-accent animate-pulse' : 'text-stone-400 hover:text-accent'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {tts.speaking
            ? <line x1="22" x2="16" y1="9" y2="15" />
            : <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          }
        </svg>
      </button>
    )
  }

  function MicButton({ disabled }: { disabled?: boolean }) {
    if (!speech.supported) return null
    return (
      <button type="button" onClick={toggleDictation} disabled={disabled}
        className={`rounded p-2 transition-colors ${
          speech.listening
            ? 'bg-red-100 text-red-600 animate-pulse'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        }`}
        title={speech.listening ? 'Detener grabación' : 'Dictar con voz'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {speech.listening
            ? <rect x="6" y="6" width="12" height="12" rx="2" />
            : <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>
          }
        </svg>
      </button>
    )
  }

  function ChatInput() {
    return (
      <div className="space-y-2">
        {/* Fila 1: controles de modo voz (siempre visibles junto al input) */}
        <div className="flex items-center gap-2">
          {speech.supported && tts.supported && (
            <button
              type="button"
              onClick={() => {
                const newMode = !conversationMode
                setConversationMode(newMode)
                if (newMode) {
                  tts.setAutoSpeak(true)
                  speech.warmUp()
                }
              }}
              title={conversationMode ? 'Modo conversación ON' : 'Activar modo conversación'}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                conversationMode
                  ? 'bg-accent text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {conversationMode ? '🎙 Conversación' : 'Modo conversación'}
            </button>
          )}
          {tts.supported && (
            <button
              type="button"
              onClick={() => {
                if (tts.speaking) {
                  tts.stop()
                } else {
                  tts.setAutoSpeak(!tts.autoSpeak)
                }
              }}
              title={tts.speaking ? 'Detener' : tts.autoSpeak ? 'Voz ON' : 'Voz OFF'}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                tts.speaking
                  ? 'bg-blue-100 text-blue-600 animate-pulse'
                  : tts.autoSpeak
                    ? 'bg-accent/10 text-accent'
                    : 'bg-stone-100 text-stone-400'
              }`}
            >
              {tts.speaking ? '🔊 Hablando...' : tts.autoSpeak ? '🔊 Voz ON' : '🔇 Voz OFF'}
            </button>
          )}
          {/* Status de grabación/transcripción inline */}
          {speech.listening && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {conversationMode ? 'Escuchando...' : 'Grabando...'}
            </span>
          )}
          {speech.transcribing && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Transcribiendo...
            </span>
          )}
        </div>
        {/* Fila 2: input + mic + enviar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              streaming ? 'Socrates está pensando...'
                : speech.listening ? 'Grabando...'
                  : speech.transcribing ? 'Transcribiendo...'
                    : 'Escribe o dicta...'
            }
            disabled={streaming}
            className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <MicButton disabled={streaming} />
          <button type="submit" disabled={streaming || !input.trim()}
            className="rounded bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
            Enviar
          </button>
        </form>
      </div>
    )
  }

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <section className="rounded border border-stone-200 p-6">
        <p className="text-sm text-muted">Cargando sesión...</p>
      </section>
    )
  }

  // Fase ready: layout simple (no chat)
  if (phase === 'ready') {
    return (
      <section className="rounded border border-stone-200 p-6">
        <h2 className="text-lg font-medium mb-1">Próxima: {unitName}</h2>
        <p className="text-sm text-muted mb-4">
          Empezarás con un desafío. Intenta resolverlo antes de ver la
          explicación — la lucha cognitiva es parte del aprendizaje.
        </p>
        <button
          onClick={startSession}
          className="rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          Empezar sesión
        </button>
      </section>
    )
  }

  // Generative task: layout simple
  if (phase === 'generative_task' && task) {
    return (
      <section className="rounded border border-stone-200 p-6">
        <h2 className="text-lg font-medium mb-4">Tarea generativa</h2>
        <div className="rounded bg-green-50 border border-green-200 p-4 mb-4">
          <p className="text-sm font-medium text-green-800 mb-1">Acreditado</p>
          <p className="text-sm">Has demostrado comprensión. Ahora produce:</p>
        </div>
        <div className="rounded border border-stone-200 p-4 mb-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium mb-2">Tarea generativa</p>
            <SpeakButton text={task.prompt} />
          </div>
          <p className="text-sm text-muted mb-3">{task.prompt}</p>
          <p className="text-xs text-muted">Máximo {task.max_words} palabras</p>
        </div>
        <textarea
          value={artifact}
          onChange={(e) => setArtifact(e.target.value)}
          rows={5}
          placeholder="Escribe tu producción aquí..."
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent mb-2"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">
            {artifact.trim().split(/\s+/).filter(Boolean).length} / {task.max_words} palabras
          </span>
          <div className="flex gap-2">
            <button onClick={() => { setPhase('done'); router.refresh() }}
              className="rounded border border-stone-300 text-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-50">
              Omitir
            </button>
            <button onClick={submitArtifact} disabled={streaming || !artifact.trim()}
              className="rounded bg-accent text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
              {streaming ? 'Guardando...' : 'Enviar producción'}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>}
      </section>
    )
  }

  // Done: layout simple con auto-avance
  if (phase === 'done') {
    return (
      <section className="rounded border border-stone-200 p-6">
        <div className={`rounded p-4 ${
          decision === 'PASS' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className="text-sm font-medium">
            {decision === 'PASS' ? 'Sesión completada' : 'Necesitas revisar esta unidad'}
          </p>
          <p className="text-sm text-muted mt-1">
            {decision === 'PASS'
              ? 'Avanzando a la siguiente unidad...'
              : 'El tutor reprogramará esta unidad para más adelante.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
          >
            Siguiente unidad
          </button>
        </div>
      </section>
    )
  }

  // ============================================================
  // Chat layout (productive_failure + dialog) — WhatsApp style
  // ============================================================
  const headerContent = phase === 'productive_failure' ? problem : instruction
  const headerLabel = phase === 'productive_failure' ? 'Desafío' : 'Instrucción'
  const headerColor = phase === 'productive_failure'
    ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' }
    : { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' }

  return (
    <section className="flex flex-col rounded border border-stone-200 h-[calc(100dvh-12rem)] min-h-[400px]">
      {/* ── Header fijo: solo título ── */}
      <div className="px-4 py-2.5 border-b border-stone-200 shrink-0">
        <h2 className="text-sm font-medium truncate">{unitName}</h2>
      </div>

      {/* ── Collapsible challenge/instruction header ── */}
      {headerContent && (
        <div className={`shrink-0 border-b ${headerColor.border}`}>
          <button
            type="button"
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className={`w-full flex items-center justify-between px-4 py-2 text-left ${headerColor.bg} hover:opacity-90 transition-opacity`}
          >
            <span className={`text-xs font-medium ${headerColor.text}`}>
              {headerLabel} {headerCollapsed ? '(toca para expandir)' : ''}
            </span>
            <div className="flex items-center gap-1">
              <SpeakButton text={headerContent} />
              <svg
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${headerCollapsed ? '' : 'rotate-180'} text-stone-400`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>
          {!headerCollapsed && (
            <div className={`px-4 py-3 ${headerColor.bg}`}>
              <p className="text-sm whitespace-pre-wrap">{headerContent}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Messages (scrollable area) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
              msg.role === 'assistant'
                ? 'bg-stone-100 rounded-tl-sm'
                : 'bg-accent/10 rounded-tr-sm'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] text-muted">Socrates</p>
                  <SpeakButton text={msg.content} />
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm bg-stone-100">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input fijo abajo ── */}
      <div className="shrink-0 px-4 py-3 border-t border-stone-200 bg-white">
        <ChatInput />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="shrink-0 px-4 py-2 bg-red-50">
          <p role="alert" className="text-red-600 text-xs">{error}</p>
        </div>
      )}
    </section>
  )
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
