'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  courseId: string
  unitId: string
  unitName: string
}

type SessionPhase = 'ready' | 'productive_failure' | 'dialog' | 'generative_task' | 'done'

export function SessionView({ courseId, unitId, unitName }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<SessionPhase>('ready')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [problem, setProblem] = useState('')
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [task, setTask] = useState<{ id: string; prompt: string; max_words: number } | null>(null)
  const [artifact, setArtifact] = useState('')
  const [decision, setDecision] = useState<'PASS' | 'FAIL' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const res = await fetch(`/api/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const reader = res.body?.getReader()
      if (!reader) { setError('No stream'); setStreaming(false); return }

      const decoder = new TextDecoder()
      let assistantContent = ''
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>
            if (parsed.text) {
              assistantContent += parsed.text as string
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: assistantContent }
                }
                return copy
              })
            }
            if (parsed.canonical_instruction) {
              setInstruction(parsed.canonical_instruction as string)
            }
            if (parsed.decision === 'PASS') {
              setDecision('PASS')
              setPhase('generative_task')
              if (parsed.generative_task) {
                const t = parsed.generative_task as { id: string; prompt: string; max_words: number }
                setTask(t)
              }
            }
            if (parsed.decision === 'FAIL') {
              setDecision('FAIL')
              setPhase('done')
            }
          } catch { /* ignore malformed SSE */ }
        }
      }

      if (phase === 'productive_failure') setPhase('dialog')
    } catch { setError('Error de conexión') }
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

  return (
    <section className="rounded border border-stone-200 p-6">
      <h2 className="text-lg font-medium mb-1">Próxima: {unitName}</h2>

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
            <p className="text-sm font-medium text-amber-800 mb-1">Desafío</p>
            <p className="text-sm">{problem}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tu intento (está bien si no sabes la respuesta)..."
              className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      {(phase === 'dialog' || (phase === 'productive_failure' && messages.length > 0)) && instruction && (
        <div className="rounded bg-blue-50 border border-blue-200 p-4 mb-4">
          <p className="text-sm font-medium text-blue-800 mb-1">Instrucción</p>
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
                <p className="text-xs text-muted mb-1">
                  {msg.role === 'assistant' ? 'Socrates (A4)' : 'Tú'}
                </p>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? 'El tutor responde...' : 'Tu respuesta...'}
              disabled={streaming}
              className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
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
            <p className="text-sm font-medium mb-2">Tarea generativa</p>
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
            onClick={() => router.refresh()}
            className="mt-3 rounded bg-primary text-white px-4 py-2 text-sm font-medium"
          >
            Continuar
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>}
    </section>
  )
}
