import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Message } from './Message'
import { ChatInput } from './ChatInput'
import { OllamaIcon } from './OllamaIcon'

export default function Chat({ conversation, model, onUpdate, token, authHeaders }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const conv = conversation || { id: 0, title: 'New chat', messages: [] }
  const messages = conv.messages || []
  const lastMsg = messages[messages.length - 1]
  const isThinking = sending && lastMsg?.role === 'assistant' && lastMsg?.content === '…'
  const hasAuth = token || (authHeaders && authHeaders().Authorization)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content) => {
    const text = (content || '').trim()
    if (!text || sending || !hasAuth) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    const title = conv.title === 'New chat' ? (text.slice(0, 36) + (text.length > 36 ? '…' : '')) : conv.title
    onUpdate({ ...conv, title, messages: nextMessages })
    setError(null)
    setSending(true)

    const placeholder = { role: 'assistant', content: '…' }
    onUpdate({ ...conv, title, messages: [...nextMessages, placeholder] })

    try {
      const h = authHeaders ? authHeaders() : {}
      const headers = { 'Content-Type': 'application/json', ...h }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      })
      let data
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail) || res.statusText
        const hint = res.status === 404 ? ' Model not found — pull it first: docker exec <ollama_container> ollama pull ' + model : ''
        throw new Error(String(msg) + hint)
      }
      const reply = data.message?.content ?? ''
      onUpdate({ ...conv, title, messages: [...nextMessages, { role: 'assistant', content: reply }] })
    } catch (e) {
      setError(e.message)
      onUpdate({ ...conv, title, messages: nextMessages })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full relative min-w-0">
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-sm space-y-5"
            >
              <div className="w-14 h-14 bg-[#FD7979] rounded-2xl mx-auto flex items-center justify-center text-white shadow-md">
                <OllamaIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[var(--text)]">{getGreeting()}</h2>
                <p className="text-[var(--text-muted)] text-[15px]">How can I help you today?</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="pb-36 pt-2">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <Message
                  key={i}
                  message={m}
                  isThinking={isThinking && i === messages.length - 1}
                />
              ))}
            </AnimatePresence>
            {error && (
              <div className="px-6 md:px-8 max-w-3xl mx-auto mt-2">
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--page-bg)] via-[var(--page-bg)]/95 to-transparent pt-12 pb-2">
        <ChatInput onSend={sendMessage} disabled={sending} />
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
