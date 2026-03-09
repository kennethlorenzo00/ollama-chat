import { useOutletContext } from 'react-router-dom'
import Chat from '../components/Chat'
import { useAuth } from '../context/AuthContext'

export default function ChatPage() {
  const { token, authHeaders } = useAuth()
  const { conversations, currentId, persistConvs, model, convsLoading } = useOutletContext()
  const currentConv = conversations.find((c) => c.id === currentId) ?? conversations[0]

  if (convsLoading && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Loading…
      </div>
    )
  }

  if (!currentConv && !convsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        No conversation. Use “New chat” in the sidebar.
      </div>
    )
  }

  return (
    <Chat
      conversation={currentConv}
      model={model}
      onUpdate={(updated) => {
        const next = conversations.map((c) => (c.id === updated.id ? updated : c))
        persistConvs(next)
      }}
      authHeaders={authHeaders}
      token={token}
    />
  )
}
