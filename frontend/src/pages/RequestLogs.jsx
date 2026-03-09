import { useCallback, useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RequestLogs() {
  const { authHeaders } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/request-logs?limit=100', { headers: authHeaders() })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.detail || 'Failed to load logs')
        return
      }
      const data = await res.json()
      setLogs(data)
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Request history
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-4">
        Every request to the model is logged here.
      </p>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm">No requests yet.</p>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Time</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Path</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Method</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2.5 text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text)] font-mono truncate max-w-xs" title={log.path}>
                    {log.path}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text)]">{log.method}</td>
                  <td className="px-4 py-2.5 text-[var(--text)]">{log.status_code ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
