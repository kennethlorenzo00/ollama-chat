import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required')
      return
    }
    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.detail || 'Registration failed')
        return
      }
      setToken(data.access_token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--page-bg)]">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--border)] animate-modal-in">
        <h1 className="text-lg font-semibold mb-1 text-[var(--text)]">Create an account</h1>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          Register with your email and a password (min 8 characters).
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError('') }}
              placeholder="First name"
              autoComplete="given-name"
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError('') }}
              placeholder="Last name"
              autoComplete="family-name"
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
            />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm mb-3 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm mb-4 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="text-[var(--text-muted)] text-sm mt-4">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
