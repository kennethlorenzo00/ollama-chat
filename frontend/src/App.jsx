import { useState, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import ApiKeyGate from './components/ApiKeyGate'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import { ModelSelect } from './components/ModelSelect'
import { ThemeToggle } from './components/ThemeToggle'

const STORAGE_KEY = 'ollama_chat_api_key'
const CONVS_KEY = 'ollama_chat_conversations'
const THEME_KEY = 'ollama_chat_theme'

function loadApiKey() {
  return localStorage.getItem(STORAGE_KEY) || ''
}

function loadTheme() {
  const t = localStorage.getItem(THEME_KEY)
  return t === 'dark' || t === 'light' ? t : 'light'
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVS_KEY)
    return raw ? JSON.parse(raw) : [{ id: Date.now(), title: 'New chat', messages: [] }]
  } catch {
    return [{ id: Date.now(), title: 'New chat', messages: [] }]
  }
}

function saveConversations(arr) {
  localStorage.setItem(CONVS_KEY, JSON.stringify(arr))
}

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [model, setModel] = useState('qwen2.5:3b')
  const [theme, setTheme] = useState(loadTheme)

  useEffect(() => {
    const key = loadApiKey()
    setApiKey(key)
    setShowKeyModal(!key)
  }, [])

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_KEY, theme)
    }
  }, [theme])

  useEffect(() => {
    setConversations(loadConversations())
  }, [])

  useEffect(() => {
    const convs = loadConversations()
    if (convs.length && currentId === null) setCurrentId(convs[0].id)
    else if (convs.length && !convs.find(c => c.id === currentId)) setCurrentId(convs[0].id)
  }, [currentId])

  const persistKey = useCallback((key) => {
    const trimmed = (key || '').trim()
    localStorage.setItem(STORAGE_KEY, trimmed)
    setApiKey(trimmed)
    setShowKeyModal(false)
  }, [])

  const clearKeyAndReenter = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setShowKeyModal(true)
  }, [])

  const persistConvs = useCallback((next) => {
    setConversations(next)
    saveConversations(next)
  }, [])

  const handleThemeChange = useCallback((next) => {
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(THEME_KEY, next)
    setTheme(next)
  }, [])

  const currentConv = conversations.find(c => c.id === currentId) || conversations[0]

  return (
    <div data-theme={theme} className="flex h-screen w-full bg-[var(--page-bg)] overflow-hidden font-sans">
      <ApiKeyGate open={showKeyModal} onSave={persistKey} initialKey={apiKey} />
      <Sidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        currentId={currentId}
        onSelect={setCurrentId}
        onNewChat={() => {
          const next = [{ id: Date.now(), title: 'New chat', messages: [] }, ...conversations]
          persistConvs(next)
          setCurrentId(next[0].id)
        }}
        onDeleteChat={(id) => {
          const next = conversations.filter((c) => c.id !== id)
          if (next.length === 0) {
            const newConv = { id: Date.now(), title: 'New chat', messages: [] }
            persistConvs([newConv])
            setCurrentId(newConv.id)
          } else {
            persistConvs(next)
            if (currentId === id) setCurrentId(next[0].id)
          }
        }}
        onReenterKey={clearKeyAndReenter}
        apiKeySet={!!apiKey}
      />
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-[var(--surface)]/95 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 -ml-2 rounded-lg transition-colors text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[15px] font-semibold text-[var(--text)]">Chat</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />
            <ModelSelect value={model} onChange={setModel} />
          </div>
        </header>
        <Chat
          conversation={currentConv}
          model={model}
          onUpdate={(updated) => {
            const next = conversations.map(c => (c.id === updated.id ? updated : c))
            persistConvs(next)
          }}
          apiKey={apiKey}
        />
      </div>
    </div>
  )
}
