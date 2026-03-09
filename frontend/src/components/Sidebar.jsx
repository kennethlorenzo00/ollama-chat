import { motion } from 'motion/react'
import { MessageSquare, Plus, KeyRound, Trash2 } from 'lucide-react'

export default function Sidebar({ isOpen, conversations, currentId, onSelect, onNewChat, onDeleteChat, onReenterKey, apiKeySet }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full flex flex-col overflow-hidden shrink-0 border-r"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
    >
      <div className="p-3 min-w-[260px]">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-all text-sm font-medium text-[var(--text)] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 min-h-0 min-w-[260px]">
        <div className="px-3 text-[11px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
          Recent
        </div>
        <div className="space-y-0.5 px-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-0.5 rounded-lg ${
                c.id === currentId ? 'bg-[var(--sidebar-hover)]' : 'hover:bg-[var(--sidebar-hover)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm text-left truncate min-w-0 transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
                <span className="truncate">{c.title || 'New chat'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id) }}
                aria-label="Delete chat"
                className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t space-y-1 min-w-[260px]" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onReenterKey}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] rounded-lg transition-colors"
        >
          <KeyRound className="w-4 h-4 opacity-60" />
          {apiKeySet ? 'Change API key' : 'Enter API key'}
        </button>
      </div>
    </motion.aside>
  )
}
