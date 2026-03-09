import { useState, useEffect } from 'react'

export default function ApiKeyGate({ open, onSave, initialKey }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setKey(initialKey || '')
      setError('')
    }
  }, [open, initialKey])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) {
      setError('Enter an API key')
      return
    }
    setError('')
    onSave(trimmed)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--border)] animate-modal-in">
        <h2 className="text-lg font-semibold mb-1 text-[var(--text)]">Enter your API key</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          Stored in this browser only. Use the same value as in your .env <code className="bg-[var(--surface-hover)] px-1.5 py-0.5 rounded text-xs text-[var(--text)]">API_KEYS</code>.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError('') }}
            placeholder="API key"
            autoComplete="off"
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm mb-4 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button
            type="submit"
            className="px-4 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-150"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
