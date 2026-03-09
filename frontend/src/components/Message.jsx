import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User } from 'lucide-react'
import { OllamaIcon } from './OllamaIcon'

function TypingDots() {
  return (
    <div className="typing-dots flex items-center gap-2 py-1" aria-hidden="true">
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
    </div>
  )
}

export function Message({ message, isThinking }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex w-full px-4 py-5 md:px-6 lg:px-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-3xl w-full gap-3 items-center ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isUser ? 'bg-[var(--user-bubble)] text-[var(--text-muted)]' : 'bg-[#FD7979] text-white'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <OllamaIcon className="w-4 h-4" />}
        </div>
        <div
          className={`text-[15px] leading-[1.62] ${
            isUser
              ? 'px-4 py-3 rounded-2xl rounded-tr-md text-[var(--text)] w-fit max-w-full'
              : 'flex-1 min-w-0 prose prose-slate max-w-none text-[var(--text)] px-1'
          }`}
          style={isUser ? { backgroundColor: 'var(--user-bubble)' } : undefined}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : isThinking ? (
            <TypingDots />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
        </div>
      </div>
    </motion.div>
  )
}
