import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  const hasToken = token || localStorage.getItem('ollama_chat_token')
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
