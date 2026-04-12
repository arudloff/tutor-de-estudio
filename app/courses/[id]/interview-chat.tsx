'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  courseId: string
}

export function InterviewChat({ courseId }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [poaCaptured, setPoaCaptured] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  // Auto-scroll al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Iniciar la entrevista al montar (primer turno del A12)
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendMessage('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(userMessage: string) {
    setError(null)
    setStreaming(true)

    if (userMessage) {
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/poa/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error en la entrevista')
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setError('No se pudo iniciar la conversación')
        setStreaming(false)
        return
      }

      const decoder = new TextDecoder()
      let assistantContent = ''

      // Agregar mensaje vacio del asistente que vamos llenando
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)

          if (data === '[DONE]') continue

          try {
            const parsed: { text?: string; poa_captured?: boolean; error?: string } =
              JSON.parse(data)

            if (parsed.text) {
              assistantContent += parsed.text
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: assistantContent,
                  }
                }
                return copy
              })
            }

            if (parsed.poa_captured) {
              setPoaCaptured(true)
            }

            if (parsed.error) {
              setError(parsed.error)
            }
          } catch {
            // Ignore malformed SSE
          }
        }
      }
    } catch {
      setError('Error de conexión con el tutor')
    } finally {
      setStreaming(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg)
  }

  async function handleConfirmPoa() {
    setConfirming(true)
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseId}/poa/confirm`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al confirmar')
        return
      }

      router.push(`/courses/${courseId}`)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 text-sm ${
              msg.role === 'assistant'
                ? 'bg-stone-100 text-foreground'
                : 'bg-accent/10 text-foreground ml-8'
            }`}
          >
            <p className="text-xs text-muted mb-1 font-medium">
              {msg.role === 'assistant' ? 'Socrates (A12)' : 'Tú'}
            </p>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Boton de confirmacion si el POA fue capturado */}
      {poaCaptured && (
        <div className="mb-4 p-4 rounded-lg border border-accent/30 bg-accent/5">
          <p className="text-sm mb-3">
            El tutor ha capturado tu perfil de objetivo. Si estas de acuerdo,
            confirma para continuar.
          </p>
          <button
            onClick={handleConfirmPoa}
            disabled={confirming}
            className="rounded bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
          >
            {confirming ? 'Confirmando...' : 'Confirmar mi perfil'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-red-600 text-sm mb-2">
          {error}
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Tu mensaje
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming || poaCaptured}
          placeholder={
            poaCaptured
              ? 'POA capturado — confirma arriba'
              : streaming
                ? 'El tutor está respondiendo...'
                : 'Escribe tu respuesta...'
          }
          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim() || poaCaptured}
          className="rounded bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
