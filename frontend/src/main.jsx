import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const saved = localStorage.getItem('ollama_chat_theme')
document.documentElement.setAttribute('data-theme', saved === 'dark' || saved === 'light' ? saved : 'light')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
