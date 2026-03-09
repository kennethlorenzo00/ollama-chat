import { useState, useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion } from 'motion/react'

export function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSend(input)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-end gap-2 min-h-[52px] bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl pl-4 pr-2 py-2 shadow-sm hover:border-[var(--border-hover)] focus-within:ring-2 focus-within:ring-[var(--border)]/60 transition-all"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 min-h-[44px] max-h-[200px] py-3 px-0 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-muted)]"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed enabled:bg-[var(--text)] enabled:text-[var(--page-bg)] enabled:hover:opacity-90"
          aria-label="Send message"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </motion.div>
      <p className="text-center mt-2 text-[11px] text-[var(--text-muted)]">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  )
}
