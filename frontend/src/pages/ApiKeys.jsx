import { useCallback, useEffect, useState } from 'react'
import { Copy, KeyRound, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ApiKeys() {
  const { authHeaders } = useAuth()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/keys', { headers: authHeaders() })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Failed to load keys')
        return
      }
      const data = await res.json()
      setKeys(data)
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const createKey = async () => {
    setCreating(true)
    setError('')
    setNewKey(null)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(name ? { name } : {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.detail || 'Failed to create key')
        return
      }
      setNewKey(data)
      setName('')
      fetchKeys()
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (id) => {
    if (!confirm('Revoke this API key? It will stop working immediately.')) return
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (res.ok) fetchKeys()
    } catch (e) {
      setError(e.message || 'Network error')
    }
  }

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
        <KeyRound className="w-5 h-5" />
        API keys
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Create keys to use the LLM API from scripts or other apps. Each key is shown only once when created.
      </p>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {newKey && (
        <div className="mb-6 p-4 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
          <p className="text-[var(--text-muted)] text-xs mb-2">New key (copy now; it won’t be shown again):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-[var(--input-bg)] rounded-lg text-sm text-[var(--text)] break-all">
              {newKey.key}
            </code>
            <button
              type="button"
              onClick={() => copyKey(newKey.key)}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
              aria-label="Copy key"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (optional)"
          className="flex-1 px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="button"
          onClick={createKey}
          disabled={creating}
          className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--text-muted)]">Your keys</h2>
        {loading && keys.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No API keys yet. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
              >
                <div>
                  <span className="font-mono text-sm text-[var(--text)]">{k.key_prefix}…</span>
                  {k.name && <span className="ml-2 text-[var(--text-muted)] text-sm">{k.name}</span>}
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Created {new Date(k.created_at).toLocaleString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeKey(k.id)}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
                  aria-label="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
