import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './pages/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ChatPage from './pages/ChatPage'
import ApiKeys from './pages/ApiKeys'
import RequestLogs from './pages/RequestLogs'

export default function App() {
  return (
    <BrowserRouter basename="/chat">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ChatPage />} />
            <Route path="keys" element={<ApiKeys />} />
            <Route path="request-logs" element={<RequestLogs />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
