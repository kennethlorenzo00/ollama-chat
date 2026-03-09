import { motion } from 'motion/react'
import { MessageSquare, Plus, Trash2, KeyRound, FileText, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ isOpen, conversations, currentId, onSelect, onNewChat, onDeleteChat, loading }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    `w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
      isActive ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
    }`

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
          {loading ? (
            <p className="px-3 py-2 text-sm text-[var(--text-muted)]">Loading…</p>
          ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-0.5 rounded-lg ${
                c.id === currentId ? 'bg-[var(--sidebar-hover)]' : 'hover:bg-[var(--sidebar-hover)]'
              }`}
            >
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex-1 flex items-center gap-2 px-3 py-2.5 text-sm text-left truncate min-w-0 transition-colors ${
                    isActive && c.id === currentId ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`
                }
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
                <span className="truncate">{c.title || 'New chat'}</span>
              </NavLink>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDeleteChat(c.id)
                }}
                aria-label="Delete chat"
                className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )))}
        </div>
      </div>
      <div
        className="p-3 pt-4 min-w-[260px] border-t flex flex-col gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <nav className="flex flex-col gap-0.5">
          <NavLink to="/keys" className={linkClass}>
            <KeyRound className="w-4 h-4 opacity-60" />
            API keys
          </NavLink>
          <NavLink to="/request-logs" className={linkClass}>
            <FileText className="w-4 h-4 opacity-60" />
            Request history
          </NavLink>
        </nav>
        <div className="pt-1">
          <p
            className="px-3 py-2 text-sm font-medium text-[var(--text)] truncate rounded-lg bg-[var(--surface)]/50"
            title={displayName}
          >
            {displayName}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 mt-0.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 opacity-60" />
            Log out
          </button>
        </div>
      </div>
    </motion.aside>
  )
}