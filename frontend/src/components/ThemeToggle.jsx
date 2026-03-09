import { useState, useCallback, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'

const LIGHT_BG = '#faf9f5'
const DARK_BG = '#262624'
const FADE_DURATION_MS = 280
/** Keep overlay up until new theme has painted, then remove so no blink. */
const PAINT_WAIT_MS = 80

export function ThemeToggle({ theme, onThemeChange }) {
  const [fade, setFade] = useState(null)

  const handleClick = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setFade(next)
  }, [theme])

  useEffect(() => {
    if (!fade) return
    let t2
    const t1 = setTimeout(() => {
      onThemeChange(fade)
      t2 = setTimeout(() => setFade(null), PAINT_WAIT_MS)
    }, FADE_DURATION_MS)
    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [fade, onThemeChange])

  const isDark = theme === 'dark'

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="p-2 rounded-lg transition-colors border border-transparent hover:border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)]"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {fade && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          aria-hidden="true"
          style={{
            background: fade === 'dark' ? DARK_BG : LIGHT_BG,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FADE_DURATION_MS / 1000, ease: 'easeOut' }}
        />
      )}
    </>
  )
}
