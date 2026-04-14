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
// ============================================================
function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const callbackRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  }, [])

  const startListening = useCallback((onResult: (text: string, isFinal: boolean) => void) => {
    callbackRef.current = (text) => onResult(text, true)
    chunksRef.current = []

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = async () => {
          // Detener tracks del micrófono
          stream.getTracks().forEach((t) => t.stop())

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
      })
      .catch(() => {
        setListening(false)
      })
  }, [])

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
    setListening(false)
  }, [])

  return { listening, supported, startListening, stopListening, transcribing }
}

// ============================================================
// Hook: texto a voz (OpenAI TTS — voz natural)
// ============================================================
function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text || loading) return

    // Detener audio anterior
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

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
        return
      }

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      audio.onerror = () => {
        setSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      await audio.play()
    } catch {
      setSpeaking(false)
    }
    setLoading(false)
  }, [loading])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
  }, [])

  return { speaking, supported, speak, stop, autoSpeak, setAutoSpeak }
}

// ============================================================
// Componente principal
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
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pendingAutoSendRef = useRef(false)

  const speech = useSpeechRecognition()
  const tts = useTextToSpeech()

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
        await tts.speak(d.response)
        // Modo conversación: activar mic automáticamente después de que el tutor termina de hablar
        if (conversationMode && !d.decision) {
          setTimeout(() => {
            speech.startListening((text) => {
              setInput((prev) => (prev + ' ' + text).trim())
              pendingAutoSendRef.current = true
            })
          }, 500)
        }
      }

      if (d.canonical_instruction) {
        setInstruction(d.canonical_instruction)
      }

      if (d.decision === 'PASS') {
        setDecision('PASS')
        setPhase('generative_task')
        if (d.generative_task) {
          setTask(d.generative_task)
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
      })
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
  // Botones de voz (reutilizables)
  // ============================================================
  function VoiceControls() {
    return (
      <div className="flex items-center gap-2">
        {/* Modo conversación: graba → envía → escucha → repite */}
        {speech.supported && tts.supported && (
          <button
            type="button"
            onClick={() => {
              const newMode = !conversationMode
              setConversationMode(newMode)
              if (newMode) {
                tts.setAutoSpeak(true)
              }
            }}
            title={conversationMode ? 'Modo conversación ON — habla y Socrates responde automáticamente' : 'Activar modo conversación'}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              conversationMode
                ? 'bg-accent text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {conversationMode ? 'Conversación ON' : 'Modo conversación'}
          </button>
        )}

        {/* Toggle de voz del tutor */}
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
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              tts.speaking
                ? 'bg-blue-100 text-blue-600 animate-pulse'
                : tts.autoSpeak
                  ? 'bg-accent/10 text-accent'
                  : 'bg-stone-100 text-stone-400'
            }`}
          >
            {tts.speaking ? 'Hablando...' : tts.autoSpeak ? 'Voz ON' : 'Voz OFF'}
          </button>
        )}
      </div>
    )
  }

  // Botón para leer un mensaje específico
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

  return (
    <section className="rounded border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-medium">Próxima: {unitName}</h2>
        <VoiceControls />
      </div>

      {speech.listening && (
        <div className="mb-3 px-3 py-2 rounded bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Grabando... habla y presiona el micrófono de nuevo para transcribir
        </div>
      )}
      {speech.transcribing && (
        <div className="mb-3 px-3 py-2 rounded bg-blue-50 border border-blue-200 text-sm text-blue-700 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Transcribiendo tu voz...
        </div>
      )}

      {phase === 'ready' && (
        <div>
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
        </div>
      )}

      {phase === 'productive_failure' && (
        <div>
          <div className="rounded bg-amber-50 border border-amber-200 p-4 mb-4">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-amber-800 mb-1">Desafío</p>
              <SpeakButton text={problem} />
            </div>
            <p className="text-sm">{problem}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={speech.listening ? 'Grabando...' : speech.transcribing ? 'Transcribiendo...' : 'Tu intento (escribe o dicta)...'}
              className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
              disabled={streaming}
            />
            {speech.supported && (
              <button type="button" onClick={toggleDictation} disabled={streaming}
                className={`rounded p-2 ${speech.listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                title={speech.listening ? 'Detener grabación' : 'Dictar con voz'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {speech.listening
                    ? <rect x="6" y="6" width="12" height="12" rx="2" />
                    : <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>
                  }
                </svg>
              </button>
            )}
            <button type="submit" disabled={streaming || !input.trim()}
              className="rounded bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
              Enviar
            </button>
          </form>
        </div>
      )}

      {(phase === 'dialog' || (phase === 'productive_failure' && messages.length > 0)) && instruction && (
        <div className="rounded bg-blue-50 border border-blue-200 p-4 mb-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-blue-800 mb-1">Instrucción</p>
            <SpeakButton text={instruction} />
          </div>
          <p className="text-sm whitespace-pre-wrap">{instruction}</p>
        </div>
      )}

      {phase === 'dialog' && (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg px-4 py-3 text-sm ${
                msg.role === 'assistant' ? 'bg-stone-100' : 'bg-accent/10 ml-8'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted mb-1">
                    {msg.role === 'assistant' ? 'Socrates (A4)' : 'Tú'}
                  </p>
                  {msg.role === 'assistant' && <SpeakButton text={msg.content} />}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
            {streaming && (
              <div className="rounded-lg px-4 py-3 text-sm bg-stone-100 animate-pulse">
                <p className="text-xs text-muted mb-1">Socrates (A4)</p>
                <div className="flex items-center gap-2 text-muted">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" />
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="ml-2 text-xs">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                streaming ? 'Socrates está pensando...'
                  : speech.listening ? 'Grabando...'
                    : speech.transcribing ? 'Transcribiendo...'
                      : 'Tu respuesta (escribe o dicta)...'
              }
              disabled={streaming}
              className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            {speech.supported && (
              <button type="button" onClick={toggleDictation} disabled={streaming}
                className={`rounded p-2 ${speech.listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                title={speech.listening ? 'Detener grabación' : 'Dictar con voz'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {speech.listening
                    ? <rect x="6" y="6" width="12" height="12" rx="2" />
                    : <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>
                  }
                </svg>
              </button>
            )}
            <button type="submit" disabled={streaming || !input.trim()}
              className="rounded bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
              Enviar
            </button>
          </form>
        </>
      )}

      {phase === 'generative_task' && task && (
        <div className="mt-4">
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
            <button onClick={submitArtifact} disabled={streaming || !artifact.trim()}
              className="rounded bg-accent text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
              {streaming ? 'Guardando...' : 'Enviar producción'}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className={`mt-4 rounded p-4 ${
          decision === 'PASS' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className="text-sm font-medium">
            {decision === 'PASS' ? 'Sesión completada' : 'Necesitas revisar esta unidad'}
          </p>
          <p className="text-sm text-muted mt-1">
            {decision === 'PASS'
              ? 'Tu producción ha sido guardada. Avanza a la siguiente unidad.'
              : 'El tutor reprogramará esta unidad para más adelante.'}
          </p>
          <button
            onClick={() => {
              // M2: Auto-avance — recargar la página para mostrar la siguiente unidad
              window.location.reload()
            }}
            className="mt-3 rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
          >
            Siguiente unidad
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>}
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
