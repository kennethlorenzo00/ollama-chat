import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { ModelSelect } from '../components/ModelSelect'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'

const THEME_KEY = 'ollama_chat_theme'

function loadTheme() {
  const t = localStorage.getItem(THEME_KEY)
  return t === 'dark' || t === 'light' ? t : 'light'
}

/** Normalize API conversation to frontend shape: messages as { role, content } */
function normalizeConv(c) {
  if (!c) return c
  const messages = (c.messages || []).map((m) => ({ role: m.role, content: m.content }))
  return { ...c, messages }
}

export default function Layout() {
  const location = useLocation()
  const { authHeaders } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [convsLoading, setConvsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [model, setModel] = useState('qwen2.5:3b')
  const [theme, setTheme] = useState(loadTheme)

  const headers = useCallback(() => authHeaders() || {}, [authHeaders])

  // Load conversation list from API
  useEffect(() => {
    let cancelled = false
    async function load() {
      setConvsLoading(true)
      try {
        const res = await fetch(`/api/conversations?_=${Date.now()}`, { headers: headers(), cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 401) return
          setConversations([])
          setCurrentId(null)
          return
        }
        const list = await res.json()
        if (cancelled) return
        if (list.length === 0) {
          const createRes = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers() },
            body: JSON.stringify({ title: 'New chat', messages: [] }),
          })
          if (!createRes.ok || cancelled) return
          const created = await createRes.json()
          const conv = normalizeConv(created)
          setConversations([conv])
          setCurrentId(conv.id)
        } else {
          setConversations(list)
          setCurrentId(list[0].id)
        }
      } catch {
        if (!cancelled) setConversations([])
      } finally {
        if (!cancelled) setConvsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [headers])

  // When currentId changes, ensure that conversation has messages (fetch detail if needed)
  useEffect(() => {
    if (!currentId || convsLoading) return
    const cur = conversations.find((c) => c.id === currentId)
    if (!cur || (cur.messages !== undefined && cur.messages !== null)) return
    let cancelled = false
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/conversations/${currentId}?_=${Date.now()}`, { headers: headers(), cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentId) return c
            // Don't overwrite if we already have messages (e.g. optimistic update from send)
            if (Array.isArray(c.messages) && c.messages.length > 0) return c
            return normalizeConv(data)
          })
        )
      } catch {}
    }
    fetchDetail()
    return () => { cancelled = true }
  }, [currentId, convsLoading, conversations, headers])

  // If list changed and currentId is no longer in list, select first
  useEffect(() => {
    if (conversations.length && currentId && !conversations.find((c) => c.id === currentId)) {
      setCurrentId(conversations[0].id)
    }
  }, [conversations, currentId])

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_KEY, theme)
    }
  }, [theme])

  const persistConvs = useCallback(
    (next) => {
      setConversations(next)
      const current = next.find((c) => c.id === currentId)
      if (current && Array.isArray(current.messages)) {
        fetch(`/api/conversations/${currentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers() },
          body: JSON.stringify({ title: current.title, messages: current.messages }),
        }).catch(() => {})
      }
    },
    [currentId, headers]
  )

  const handleThemeChange = useCallback((next) => {
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(THEME_KEY, next)
    setTheme(next)
  }, [])

  const handleNewChat = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ title: 'New chat', messages: [] }),
      })
      if (!res.ok) return
      const created = await res.json()
      const conv = normalizeConv(created)
      setConversations((prev) => [conv, ...prev])
      setCurrentId(conv.id)
    } catch {}
  }, [headers])

  const handleDeleteChat = useCallback(
    async (id) => {
      if (!confirm('Delete this conversation? It cannot be undone.')) return
      try {
        const res = await fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
          headers: headers(),
        })
        if (!res.ok) return
        const next = conversations.filter((c) => c.id !== id)
        if (next.length === 0) {
          const createRes = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers() },
            body: JSON.stringify({ title: 'New chat', messages: [] }),
          })
          if (!createRes.ok) return
          const created = await createRes.json()
          const conv = normalizeConv(created)
          setConversations([conv])
          setCurrentId(conv.id)
        } else {
          setConversations(next)
          if (currentId === id) setCurrentId(next[0].id)
        }
      } catch {}
    },
    [currentId, conversations, headers]
  )

  const pathname = location.pathname
  const pageTitle = pathname === '/keys' ? 'API keys' : pathname === '/request-logs' ? 'Request history' : 'Chat'

  const outletContext = {
    conversations,
    currentId,
    setCurrentId,
    persistConvs,
    model,
    setModel,
    convsLoading,
  }

  return (
    <div data-theme={theme} className="flex h-screen w-full bg-[var(--page-bg)] overflow-hidden font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        currentId={currentId}
        onSelect={setCurrentId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        loading={convsLoading}
      />
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header
          className="flex items-center justify-between px-4 py-3 border-b bg-[var(--surface)]/95 backdrop-blur-sm sticky top-0 z-10"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 -ml-2 rounded-lg transition-colors text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[15px] font-semibold text-[var(--text)]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
            {(pathname === '/' || pathname === '/chat') && <ModelSelect value={model} onChange={setModel} />}
          </div>
        </header>
        <Outlet context={outletContext} />
      </div>
    </div>
  )
}
