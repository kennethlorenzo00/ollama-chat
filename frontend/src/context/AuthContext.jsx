import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const TOKEN_KEY = 'ollama_chat_token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)

  const setToken = useCallback((newToken) => {
    const t = (newToken || '').trim()
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
    setTokenState(t)
    if (!t) setUser(null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setTokenState('')
    setUser(null)
  }, [])

  const authHeaders = useCallback(() => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) return {}
    return {
      Authorization: `Bearer ${t}`,
    }
  }, [token])

  // Fetch current user when we have a token
  useEffect(() => {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) {
      setUser(null)
      return
    }
    let cancelled = false
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setUser(data)
        if (!cancelled && !data) setUser(null)
      })
      .catch(() => { if (!cancelled) setUser(null) })
    return () => { cancelled = true }
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, setToken, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
